
import { Router, raw } from "express";
import {
  getApps,
  initializeApp,
  applicationDefault,
} from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import {
  enqueueEmail,
  flushEmailOutbox,
  getAdminEmail,
} from "./emailOutbox.js";

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
  });
}

const db = getFirestore();
const router = Router();

const API = "https://api-m.paypal.com";

const clientId = process.env.PAYPAL_LIVE_CLIENT_ID;
const clientSecret = process.env.PAYPAL_LIVE_CLIENT_SECRET;
const webhookId = process.env.PAYPAL_LIVE_WEBHOOK_ID;

if (process.env.PAYPAL_ENV !== "live") {
  throw new Error("PayPal must be in Live mode.");
}

if (!clientId || !clientSecret || !webhookId) {
  throw new Error(
    "Missing PayPal Live or Webhook configuration."
  );
}

function cents(value) {
  const text = String(value ?? "")
    .trim()
    .replace(/,/g, "")
    .replace(/^\s*(?:USD\s*)?\$\s*/i, "")
    .replace(/\s*USD\s*$/i, "");

  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    throw new Error("Invalid amount.");
  }

  const result = Math.round(Number(text) * 100);

  if (!Number.isSafeInteger(result) || result <= 0) {
    throw new Error("Invalid amount.");
  }

  return result;
}

async function accessToken() {
  const basic = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetch(
    `${API}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    }
  );

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error("PayPal authentication failed.");
  }

  return data.access_token;
}

async function verifySignature(req, event) {
  const token = await accessToken();

  const required = {
    transmission_id: req.get("paypal-transmission-id"),
    transmission_time: req.get("paypal-transmission-time"),
    cert_url: req.get("paypal-cert-url"),
    auth_algo: req.get("paypal-auth-algo"),
    transmission_sig: req.get("paypal-transmission-sig"),
  };

  if (Object.values(required).some((value) => !value)) {
    return false;
  }

  const response = await fetch(
    `${API}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...required,
        webhook_id: webhookId,
        webhook_event: event,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `PayPal verification unavailable: ${response.status}`
    );
  }

  const result = await response.json();

  return result.verification_status === "SUCCESS";
}

async function fetchPayPalOrder(orderId) {
  const token = await accessToken();

  const response = await fetch(
    `${API}/v2/checkout/orders/${encodeURIComponent(orderId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Cannot verify PayPal order: ${response.status}`
    );
  }

  return response.json();
}

async function notifyAdmin(applicationId, amount, captureId) {
  const to = getAdminEmail();

  enqueueEmail({
    key: `paypal-live:${captureId}`,
    kind: "payment_confirmed",
    to,
    subject: `Rita | Payment received #${applicationId}`,
    text: [
      "Rita Digital Services",
      "",
      "A real PayPal payment has been confirmed.",
      `Application: #${applicationId}`,
      `Amount: ${amount} USD`,
      `Capture ID: ${captureId}`,
      "",
      "You can now begin processing the service.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:16px;overflow:hidden">
          <div style="background:#173e56;color:#fff;padding:24px;font-size:22px;font-weight:bold">
            Rita Digital Services
          </div>
          <div style="padding:28px;color:#173e56">
            <h2>Payment received</h2>
            <p>A client has successfully completed payment.</p>
            <p><b>Application:</b> #${applicationId}</p>
            <p><b>Amount:</b> ${amount} USD</p>
            <p><b>Payment provider:</b> PayPal</p>
            <p><b>Status:</b> Paid</p>
            <p><b>Capture ID:</b> ${captureId}</p>
          </div>
        </div>
      </div>
    `,
  });

  await flushEmailOutbox();
}

router.post(
  "/webhook",
  raw({ type: "application/json", limit: "256kb" }),
  async (req, res) => {
    let event;

    try {
      if (!Buffer.isBuffer(req.body)) {
        return res.status(415).json({
          success: false,
          message: "Expected raw JSON body.",
        });
      }

      event = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook JSON.",
      });
    }

    try {
      const verified = await verifySignature(req, event);

      if (!verified) {
        console.error(
          "PAYPAL_WEBHOOK_INVALID_SIGNATURE",
          event.id
        );

        return res.status(401).json({
          success: false,
          message: "Invalid PayPal signature.",
        });
      }

      // Acknowledge unrelated verified events.
      if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
        return res.json({
          success: true,
          ignored: true,
        });
      }

      const resource = event.resource || {};

      if (
        resource.status !== "COMPLETED" ||
        !resource.id
      ) {
        return res.status(409).json({
          success: false,
          message: "Capture is not completed.",
        });
      }

      const orderId =
        resource.supplementary_data?.related_ids?.order_id;

      if (!orderId) {
        throw new Error(
          "PayPal capture is missing its order ID."
        );
      }

      // Independently read the order from PayPal.
      const order = await fetchPayPalOrder(orderId);

      if (order.status !== "COMPLETED") {
        throw new Error(
          "PayPal order is not completed."
        );
      }

      const units = order.purchase_units || [];

      if (units.length !== 1) {
        throw new Error(
          "Unexpected PayPal purchase units."
        );
      }

      const unit = units[0];
      const applicationId = String(unit.custom_id || "");

      if (
        !/^\d{8,20}$/.test(applicationId) ||
        String(unit.reference_id) !== applicationId
      ) {
        throw new Error(
          "Invalid application reference."
        );
      }

      const applicationRef = db
        .collection("applications")
        .doc(applicationId);

      const snapshot = await applicationRef.get();

      if (!snapshot.exists) {
        throw new Error(
          "Matching application was not found."
        );
      }

      if (
        snapshot.get("paypal_order_id") !== orderId ||
        snapshot.get("paypal_environment") !== "live" ||
        snapshot.get("payment_currency") !== "USD"
      ) {
        throw new Error(
          "PayPal order does not match application."
        );
      }

      const expectedCents = Number(
        snapshot.get("payment_amount_cents")
      );

      if (
        !Number.isSafeInteger(expectedCents) ||
        expectedCents <= 0 ||
        cents(snapshot.get("package_price")) !== expectedCents
      ) {
        throw new Error(
          "Stored payment amount is invalid."
        );
      }

      const capture = unit.payments?.captures?.find(
        (item) =>
          item.id === resource.id &&
          item.status === "COMPLETED"
      );

      if (
        !capture ||
        capture.amount?.currency_code !== "USD" ||
        resource.amount?.currency_code !== "USD" ||
        cents(capture.amount.value) !== expectedCents ||
        cents(resource.amount.value) !== expectedCents
      ) {
        throw new Error(
          "Capture amount does not match application."
        );
      }

      // Optional merchant-account verification.
      // Set PAYPAL_LIVE_MERCHANT_ID before production.
      const expectedMerchant =
        process.env.PAYPAL_LIVE_MERCHANT_ID;

      if (
        expectedMerchant &&
        String(resource.payee?.merchant_id || "") !==
          expectedMerchant
      ) {
        throw new Error(
          "Payment was not captured for the expected merchant."
        );
      }

      let newlyPaid = false;

      await db.runTransaction(async (tx) => {
        const current = await tx.get(applicationRef);

        if (
          current.get("payment_status") === "paid"
        ) {
          if (
            current.get("paypal_capture_id") !== resource.id
          ) {
            throw new Error(
              "Application was paid with another capture."
            );
          }

          return;
        }

        if (
          current.get("status") !== "waiting_payment" ||
          current.get("paypal_order_id") !== orderId ||
          current.get("paypal_environment") !== "live" ||
          current.get("payment_amount_cents") !== expectedCents
        ) {
          throw new Error(
            "Application changed during payment."
          );
        }

        tx.update(applicationRef, {
          status: "paid",
          current_step: "payment_received",
          payment_status: "paid",
          payment_provider: "paypal",
          payment_environment: "live",
          paypal_capture_id: resource.id,
          paid_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        });

        newlyPaid = true;
      });

      if (newlyPaid) {
        console.log("PAYPAL_WEBHOOK_PAYMENT_CONFIRMED:", {
          applicationId,
          captureId: resource.id,
        });

        try {
          await notifyAdmin(
            applicationId,
            (expectedCents / 100).toFixed(2),
            resource.id
          );
        } catch (error) {
          console.error(
            "PAYPAL_WEBHOOK_EMAIL_ERROR:",
            error
          );
        }
      }

      return res.json({
        success: true,
        paid: true,
      });
    } catch (error) {
      console.error(
        "PAYPAL_WEBHOOK_PROCESSING_ERROR:",
        error
      );

      // A non-2xx response permits PayPal to retry
      // transient processing failures.
      return res.status(503).json({
        success: false,
        message: "Webhook processing failed.",
      });
    }
  }
);

export default router;
