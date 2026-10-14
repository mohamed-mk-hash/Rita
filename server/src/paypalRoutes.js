
import { Router } from "express";
import {
  getApps,
  initializeApp,
  applicationDefault,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  getFirestore,
  FieldValue,
} from "firebase-admin/firestore";

import {
  enqueueEmail,
  flushEmailOutbox,
  getAdminEmail,
} from "./emailOutbox.js";

const router = Router();

if (process.env.PAYPAL_ENV !== "live") {
  throw new Error("PAYPAL_ENV must be live.");
}

const CLIENT_ID = process.env.PAYPAL_LIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_LIVE_CLIENT_SECRET;
const PAYPAL_BASE = "https://api-m.paypal.com";

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error("Missing PayPal Live credentials.");
}

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
  });
}

const db = getFirestore();
const firebaseAuth = getAuth();

// Prices are in US cents.
// Change these only when the published package
// prices change. Never accept a price from React.
const PACKAGE_PRICES = Object.freeze({
  starter: 34999,
  growth: 44999,
  premium: 64999,
});

const serverTime = () => FieldValue.serverTimestamp();
const formatAmount = (cents) => (cents / 100).toFixed(2);

function apiError(message, status = 500) {
  return Object.assign(new Error(message), { status });
}

function fail(res, error) {
  console.error("PAYPAL_ERROR:", error);

  const status =
    Number.isInteger(error?.status) &&
    error.status >= 400 &&
    error.status <= 599
      ? error.status
      : 500;

  res.status(status).json({
    success: false,
    message:
      status === 500
        ? "Payment service error. Please try again."
        : error.message,
  });
}

function cleanApplicationId(value) {
  const id = String(value ?? "");

  if (!/^\d{8,20}$/.test(id)) {
    throw apiError("Invalid application ID.", 400);
  }

  return id;
}

function parseSavedPrice(value) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/,/g, "")
    .replace(/^\s*(?:USD\s*)?\$\s*/i, "")
    .replace(/\s*USD\s*$/i, "");

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw apiError("Invalid saved package price.", 409);
  }

  const cents = Math.round(Number(normalized) * 100);

  if (!Number.isSafeInteger(cents)) {
    throw apiError("Invalid payment amount.", 409);
  }

  return cents;
}

// Only the code determines the approved amount.
// The saved application must match it.
function trustedPrice(snapshot) {
  const slug = String(
    snapshot.get("package_slug") || ""
  ).trim().toLowerCase();

  if (!Object.hasOwn(PACKAGE_PRICES, slug)) {
    throw apiError(
      "Unknown package. Please contact support.",
      409
    );
  }

  const approvedCents = PACKAGE_PRICES[slug];
  const savedCents = parseSavedPrice(
    snapshot.get("package_price")
  );

  if (approvedCents !== savedCents) {
    throw apiError(
      "Package price does not match the selected package. Please contact support.",
      409
    );
  }

  return approvedCents;
}

async function getApplication(id) {
  const snapshot = await db
    .collection("applications")
    .doc(cleanApplicationId(id))
    .get();

  if (!snapshot.exists) {
    throw apiError("Application not found.", 404);
  }

  return snapshot;
}

function requireOwner(snapshot, uid) {
  if (snapshot.get("user_id") !== uid) {
    throw apiError("Access denied.", 403);
  }
}

function requireWaitingPayment(snapshot) {
  if (
    snapshot.get("status") !== "waiting_payment" ||
    snapshot.get("payment_status") === "paid"
  ) {
    throw apiError(
      "This application is not awaiting payment.",
      409
    );
  }
}

async function requireLogin(req, res, next) {
  try {
    const authorization = /^Bearer (.+)$/i.exec(
      req.get("authorization") || ""
    );

    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: "Please sign in.",
      });
    }

    const decoded = await firebaseAuth.verifyIdToken(
      authorization[1],
      true
    );

    req.uid = decoded.uid;
    next();
  } catch (error) {
    console.error("PAYPAL_LOGIN_ERROR:", error?.code);
    res.status(401).json({
      success: false,
      message: "Please sign in again.",
    });
  }
}

async function getPayPalToken() {
  const credentials = Buffer.from(
    `${CLIENT_ID}:${CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(
    `${PAYPAL_BASE}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok || !data.access_token) {
    throw apiError(
      "Cannot connect to PayPal.",
      502
    );
  }

  return data.access_token;
}

async function paypalRequest(
  path,
  method = "GET",
  body = null,
  requestId = ""
) {
  const token = await getPayPalToken();

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  if (requestId) {
    headers["PayPal-Request-Id"] = requestId;
  }

  const response = await fetch(
    `${PAYPAL_BASE}${path}`,
    {
      method,
      headers,
      body:
        body === null
          ? undefined
          : JSON.stringify(body),
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    console.error("PAYPAL_API_ERROR:", {
      status: response.status,
      name: data.name,
      details: data.details,
      debugId: data.debug_id,
    });

    throw Object.assign(
      apiError(
        `PayPal rejected the request (${response.status}).`,
        502
      ),
      { paypalStatus: response.status }
    );
  }

  return data;
}

async function getOrder(orderId) {
  try {
    return await paypalRequest(
      `/v2/checkout/orders/${encodeURIComponent(orderId)}`
    );
  } catch (error) {
    if (error.paypalStatus === 404) {
      return null;
    }
    throw error;
  }
}

function orderMatches(order, snapshot, cents) {
  const units = order?.purchase_units;

  if (!Array.isArray(units) || units.length !== 1) {
    return false;
  }

  const unit = units[0];

  return (
    String(unit.reference_id) === snapshot.id &&
    String(unit.custom_id) === snapshot.id &&
    unit.amount?.currency_code === "USD" &&
    unit.amount?.value === formatAmount(cents)
  );
}

async function notifyAdmin(applicationId, cents, captureId) {
  const to = getAdminEmail();

  const subject =
    `Rita | Payment received #${applicationId}`;

  const text = [
    "Rita Digital Services",
    "",
    "A client has completed a PayPal payment.",
    `Application: #${applicationId}`,
    `Amount: ${formatAmount(cents)} USD`,
    `Transaction: ${captureId}`,
    "",
    "The application is now paid.",
  ].join("\n");

  const html = `
    <div style="background:#f3f6fb;padding:28px;font-family:Arial,sans-serif;color:#173e56">
      <div style="max-width:620px;margin:auto;background:white;border-radius:16px;overflow:hidden">
        <div style="background:#173e56;color:white;padding:25px;font-size:22px;font-weight:bold">
          Rita Digital Services
        </div>
        <div style="padding:28px">
          <h2>Payment received successfully</h2>
          <p>A client has paid for a service.</p>
          <div style="background:#f4f7fb;padding:20px;border-radius:12px;line-height:2">
            <div><b>Application:</b> #${applicationId}</div>
            <div><b>Amount:</b> ${formatAmount(cents)} USD</div>
            <div><b>Payment:</b> PayPal</div>
            <div><b>Status:</b> Paid</div>
            <div><b>Transaction:</b> ${captureId}</div>
          </div>
          <p>You can now begin processing the service.</p>
        </div>
      </div>
    </div>
  `;

  enqueueEmail({
    key: `paypal-live:${captureId}`,
    kind: "payment_confirmed",
    to,
    subject,
    text,
    html,
  });

  await flushEmailOutbox();
}

// Only the public Client ID is returned.
router.get("/client-config", (_req, res) => {
  res.json({
    success: true,
    clientId: CLIENT_ID,
    mode: "live",
    currency: "USD",
  });
});

router.get("/route-check", (_req, res) => {
  res.json({
    ok: true,
    provider: "paypal",
    mode: "live",
  });
});

router.use(requireLogin);

// Read payment state without showing
// a second price in the client UI.
router.get(
  "/applications/:id/quote",
  async (req, res) => {
    try {
      const snapshot = await getApplication(
        req.params.id
      );

      requireOwner(snapshot, req.uid);

      const paymentStatus =
        snapshot.get("payment_status") || "unpaid";

      const payable =
        snapshot.get("status") === "waiting_payment" &&
        paymentStatus !== "paid";

      if (payable) {
        trustedPrice(snapshot);
      }

      res.json({
        success: true,
        payable,
        status: snapshot.get("status"),
        paymentStatus,
      });
    } catch (error) {
      fail(res, error);
    }
  }
);

// Create a real PayPal order.
router.post(
  "/applications/:id/create-order",
  async (req, res) => {
    try {
      const snapshot = await getApplication(
        req.params.id
      );

      requireOwner(snapshot, req.uid);
      requireWaitingPayment(snapshot);

      const cents = trustedPrice(snapshot);
      const existingOrderId =
        snapshot.get("paypal_order_id");

      if (existingOrderId) {
        if (
          snapshot.get("paypal_environment") !== "live"
        ) {
          throw apiError(
            "This application has a previous payment from another environment. Contact support.",
            409
          );
        }

        const order = await getOrder(existingOrderId);

        if (
          order &&
          !orderMatches(order, snapshot, cents)
        ) {
          throw apiError(
            "Previous payment does not match this application.",
            409
          );
        }

        if (
          order &&
          ["CREATED", "SAVED", "PAYER_ACTION_REQUIRED", "APPROVED"]
            .includes(order.status)
        ) {
          return res.json({
            success: true,
            id: existingOrderId,
          });
        }

        throw apiError(
          "The previous payment requires review. Please contact support.",
          409
        );
      }

      // A stable request ID reduces duplicate
      // orders after connection failures.
      const paypalOrder = await paypalRequest(
        "/v2/checkout/orders",
        "POST",
        {
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: snapshot.id,
              custom_id: snapshot.id,
              description:
                `Rita application #${snapshot.id}`,
              amount: {
                currency_code: "USD",
                value: formatAmount(cents),
              },
            },
          ],
          application_context: {
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
          },
        },
        `rita-live-order-${snapshot.id}`
      );

      if (!paypalOrder.id) {
        throw apiError(
          "PayPal did not return an order ID.",
          502
        );
      }

      await db.runTransaction(async (tx) => {
        const current = await tx.get(snapshot.ref);

        requireWaitingPayment(current);

        if (current.get("paypal_order_id")) {
          throw apiError(
            "Another payment was already created. Refresh the page.",
            409
          );
        }

        if (trustedPrice(current) !== cents) {
          throw apiError(
            "Package price changed.",
            409
          );
        }

        tx.update(snapshot.ref, {
          paypal_order_id: paypalOrder.id,
          paypal_environment: "live",
          payment_amount_cents: cents,
          payment_currency: "USD",
          payment_status: "unpaid",
          updated_at: serverTime(),
        });
      });

      console.log("PAYPAL_ORDER_READY:", {
        applicationId: snapshot.id,
        orderId: paypalOrder.id,
      });

      res.json({
        success: true,
        id: paypalOrder.id,
      });
    } catch (error) {
      fail(res, error);
    }
  }
);

// Confirm capture with PayPal itself.
router.post(
  "/applications/:id/capture-order",
  async (req, res) => {
    try {
      const snapshot = await getApplication(
        req.params.id
      );

      requireOwner(snapshot, req.uid);

      if (
        snapshot.get("payment_status") === "paid"
      ) {
        return res.json({
          success: true,
          paid: true,
          alreadyPaid: true,
        });
      }

      requireWaitingPayment(snapshot);

      const orderId = String(
        req.body?.orderId || ""
      );

      if (
        !orderId ||
        snapshot.get("paypal_order_id") !== orderId ||
        snapshot.get("paypal_environment") !== "live"
      ) {
        throw apiError(
          "Invalid PayPal order.",
          403
        );
      }

      const cents = trustedPrice(snapshot);

      if (
        snapshot.get("payment_amount_cents") !== cents
      ) {
        throw apiError(
          "Payment amount mismatch.",
          409
        );
      }

      let result;

      try {
        result = await paypalRequest(
          `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
          "POST",
          null,
          `rita-live-capture-${orderId}`
        );
      } catch (captureError) {
        // PayPal may have captured the payment
        // despite a lost network response.
        result = await getOrder(orderId);

        if (result?.status !== "COMPLETED") {
          throw captureError;
        }
      }

      const units = result?.purchase_units;
      const unit = units?.[0];

      const captures =
        unit?.payments?.captures || [];

      const capture = captures.find(
        (item) => item.status === "COMPLETED"
      );

      if (
        result?.status !== "COMPLETED" ||
        !orderMatches(result, snapshot, cents) ||
        !capture?.id ||
        capture.amount?.currency_code !== "USD" ||
        capture.amount?.value !== formatAmount(cents)
      ) {
        throw apiError(
          "Payment verification failed.",
          409
        );
      }

      let newlyPaid = false;

      await db.runTransaction(async (tx) => {
        const current = await tx.get(snapshot.ref);

        if (
          current.get("payment_status") === "paid"
        ) {
          return;
        }

        requireWaitingPayment(current);

        if (
          current.get("paypal_order_id") !== orderId ||
          current.get("paypal_environment") !== "live" ||
          current.get("payment_amount_cents") !== cents ||
          trustedPrice(current) !== cents
        ) {
          throw apiError(
            "Application payment data changed.",
            409
          );
        }

        tx.update(snapshot.ref, {
          status: "paid",
          current_step: "payment_received",
          payment_status: "paid",
          payment_provider: "paypal",
          payment_environment: "live",
          paypal_capture_id: capture.id,
          paid_at: serverTime(),
          updated_at: serverTime(),
        });

        newlyPaid = true;
      });

      if (newlyPaid) {
        console.log("PAYPAL_PAYMENT_CONFIRMED:", {
          applicationId: snapshot.id,
          captureId: capture.id,
        });

        try {
          await notifyAdmin(
            snapshot.id,
            cents,
            capture.id
          );
        } catch (error) {
          console.error(
            "PAYMENT_EMAIL_NOTIFICATION_ERROR:",
            error
          );
        }
      }

      res.json({
        success: true,
        paid: true,
      });
    } catch (error) {
      fail(res, error);
    }
  }
);

export default router;
