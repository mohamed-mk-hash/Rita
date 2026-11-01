
import "dotenv/config";

import express from "express";
import cors from "cors";

import {
  verifyMailer,
  buildNewRequestAdminEmail,
  buildWorkflowEmail,
  buildPaymentRequestEmail,
} from "./mailer.js";

import {
  enqueueEmail,
  flushEmailOutbox,
  startEmailOutbox,
  getAdminEmail,
  getEmailJob,
} from "./emailOutbox.js";

import paypalRoutes from "./paypalRoutes.js";

// Keep disabled unless you configure its webhook.
// import paypalWebhook from "./paypalWebhook.js";

import companyDocumentsRoutes from "./companyDocumentsRoutes.js";

import {
  configureStripeCloudinary,
} from "./stripeCloudinaryStorage.js";

import {
  getStripeManualIntegration,
} from "./stripeManualIntegration.js";

import {
  createStripeManualPaymentRouter,
} from "./stripeManualPaymentRoutes.js";

// ======================================
// PAYPAL CONFIGURATION
// ======================================

if (process.env.PAYPAL_ENV !== "live") {
  throw new Error("PAYPAL_ENV must be live.");
}

// ======================================
// EXPRESS SERVER
// ======================================

const app = express();

const PORT = Number(process.env.PORT || 5010);

let stripeReceiptAvailable = false;

app.disable("x-powered-by");

// ======================================
// CORS CONFIGURATION
// ======================================

// Existing production websites.
// Additional origins can still come from
// your existing CLIENT_ORIGINS variable.

const allowedOrigins = (
  process.env.CLIENT_ORIGINS ||
  "https://ritadigitalservices.com,https://www.ritadigitalservices.com"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Local development support.
  // Disabled automatically in production.

  if (process.env.NODE_ENV !== "production") {
    try {
      const url = new URL(origin);

      const localHosts = [
        "localhost",
        "127.0.0.1",
        "[::1]",
      ];

      return (
        localHosts.includes(url.hostname) &&
        ["http:", "https:"].includes(url.protocol) &&
        url.origin === origin
      );
    } catch {
      return false;
    }
  }

  return false;
}

// Reuse the SAME origin validation
// inside the Stripe integration.

app.locals.isAllowedOrigin = isAllowedOrigin;

app.use(
  cors({
    credentials: true,

    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.warn(
        "CORS_BLOCKED_ORIGIN:",
        origin
      );

      return callback(null, false);
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
    ],
  })
);

// ======================================
// BODY PARSING
// ======================================

// PayPal webhook, if enabled, must
// be mounted before express.json().

// app.use("/api/paypal", paypalWebhook);

app.use(
  express.json({
    limit: "100kb",
  })
);

// ======================================
// VALIDATION HELPERS
// ======================================

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(value || "").trim()
  );
}

function isApplicationId(value) {
  return /^\d{1,20}$/.test(
    String(value || "")
  );
}

// ======================================
// EMAIL OUTBOX HELPER
// ======================================

async function queueAndTrySend(data) {
  const job = enqueueEmail(data);

  try {
    await flushEmailOutbox();
  } catch (error) {
    console.error(
      "EMAIL_OUTBOX_FLUSH_ERROR:",
      error
    );
  }

  const current = getEmailJob(job.id);

  const result = {
    success: true,

    queued: current?.status !== "sent",

    emailStatus:
      current?.status || "pending",

    jobId: job.id,

    messageId:
      current?.messageId || null,
  };

  return result;
}

// ======================================
// HEALTH CHECK
// ======================================

app.get("/health", (_req, res) => {
  return res.json({
    ok: true,
    service: "rita-api",
    paypal: "live",
    email: "enabled",

    stripeManualReceipts:
      stripeReceiptAvailable
        ? "enabled"
        : "integration_required",
  });
});

// ======================================
// NEW SERVICE REQUEST EMAIL
// ======================================

app.post(
  "/api/send-new-request-email",
  async (req, res) => {
    try {
      const payload = req.body || {};

      const applicationId = String(
        payload.applicationId || ""
      );

      if (!isApplicationId(applicationId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid application ID.",
        });
      }

      const email =
        buildNewRequestAdminEmail(payload);

      const result = await queueAndTrySend({
        key: `new-request:${applicationId}`,

        kind: "new_request",

        to: getAdminEmail(),

        subject: email.subject,

        text: email.text,

        html: email.html,

        replyTo: isEmail(payload.userEmail)
          ? String(payload.userEmail).trim()
          : undefined,
      });

      console.log(
        "NEW_REQUEST_EMAIL_STATUS:",
        {
          applicationId,
          status: result.emailStatus,
          jobId: result.jobId,
        }
      );

      return res
        .status(result.queued ? 202 : 200)
        .json(result);
    } catch (error) {
      console.error(
        "NEW_REQUEST_EMAIL_ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to queue new request notification.",
      });
    }
  }
);

// ======================================
// WORKFLOW / STATUS CHANGE EMAIL
// ======================================

app.post(
  "/api/send-workflow-email",
  async (req, res) => {
    try {
      const payload = req.body || {};

      if (!isEmail(payload.to)) {
        return res.status(400).json({
          success: false,
          message: "Invalid recipient.",
        });
      }

      const email =
        buildWorkflowEmail(payload);

      if (!email) {
        return res.json({
          success: true,
          skipped: true,
        });
      }

      const key = [
        "workflow",
        payload.applicationId || "",
        payload.oldPhase || "",
        payload.newPhase || "",
        payload.oldStatus || "",
        payload.newStatus || "",
      ].join(":");

      const result = await queueAndTrySend({
        key,

        kind: "workflow",

        to: String(payload.to).trim(),

        subject: email.subject,

        text: email.text,

        html: email.html,
      });

      console.log(
        "WORKFLOW_EMAIL_STATUS:",
        {
          applicationId:
            String(payload.applicationId || ""),

          status: result.emailStatus,

          jobId: result.jobId,
        }
      );

      return res
        .status(result.queued ? 202 : 200)
        .json(result);
    } catch (error) {
      console.error(
        "WORKFLOW_EMAIL_ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to queue workflow notification.",
      });
    }
  }
);

// ======================================
// PAYMENT REQUEST EMAIL
// ======================================

async function paymentRequestEmail(req, res) {
  try {
    const payload = req.body || {};

    const applicationId = String(
      req.params.id ||
      payload.applicationId ||
      ""
    );

    if (
      !isApplicationId(applicationId) ||
      !isEmail(payload.to)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid application or recipient.",
      });
    }

    const email =
      buildPaymentRequestEmail({
        ...payload,
        applicationId,
      });

    const result = await queueAndTrySend({
      key:
        `payment-request:${applicationId}`,

      kind: "payment_request",

      to: String(payload.to).trim(),

      subject: email.subject,

      text: email.text,

      html: email.html,
    });

    console.log(
      "PAYMENT_REQUEST_EMAIL_STATUS:",
      {
        applicationId,

        status: result.emailStatus,

        jobId: result.jobId,
      }
    );

    return res
      .status(result.queued ? 202 : 200)
      .json(result);
  } catch (error) {
    console.error(
      "PAYMENT_REQUEST_EMAIL_ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to queue payment request.",
    });
  }
}

// Keep both existing routes.

app.post(
  "/api/applications/:id/send-payment-request-email",
  paymentRequestEmail
);

app.post(
  "/api/send-payment-request-email",
  paymentRequestEmail
);

// ======================================
// EXISTING PAYPAL ROUTES
// ======================================

app.use(
  "/api/paypal",
  paypalRoutes
);

// ======================================
// SERVER STARTUP
// ======================================

async function start() {
  // ====================================
  // STRIPE MANUAL PAYMENT
  // ====================================

  const stripeIntegration =
    await getStripeManualIntegration();

  const cloudinaryReady =
    await configureStripeCloudinary();

  if (
    stripeIntegration &&
    cloudinaryReady
  ) {
    app.use(
      "/api",
      createStripeManualPaymentRouter({
        ...stripeIntegration,

        notifyAdmin: async ({
          applicationId,
          reference,
          payerEmail,
          proofId,
        }) => {
          const result =
            await queueAndTrySend({
              key:
                `stripe-receipt:${applicationId}:${proofId}`,

              kind: "workflow",

              to: getAdminEmail(),

              subject:
                `Rita | Stripe receipt uploaded | Application #${applicationId}`,

              text: [
                "A client uploaded a Stripe payment receipt.",
                "",
                "PAYMENT NOT YET VERIFIED.",
                "",
                `Application: #${applicationId}`,
                `Transfer reference: ${reference}`,
                `Payer email: ${payerEmail}`,
                "",
                "Open the Rita Admin Dashboard",
                "to view or download the receipt.",
                "",
                "Confirm the real payment, amount,",
                "currency and transaction before approval.",
              ].join("\n"),
            });

          console.log(
            "STRIPE_RECEIPT_EMAIL_STATUS:",
            {
              applicationId,
              status: result.emailStatus,
              jobId: result.jobId,
            }
          );

          return result;
        },
      })
    );

    stripeReceiptAvailable = true;

    console.log(
      "Stripe manual receipts: Cloudinary + email routes enabled."
    );
  } else {
    console.warn(
      "Stripe manual receipts disabled. Check Firebase integration and Cloudinary configuration."
    );
  }

  // ====================================
  // EXISTING COMPANY DOCUMENT ROUTES
  // ====================================

  app.use(
    "/api",
    companyDocumentsRoutes
  );

  // ====================================
  // ERROR HANDLER
  // ====================================

  app.use((error, req, res, _next) => {
    console.error(
      "RITA_API_ERROR:",
      req.method,
      req.path,
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Unexpected server error.",
      });
    }
  });

  // ====================================
  // SMTP INITIALIZATION
  // ====================================

  getAdminEmail();

  try {
    await verifyMailer();

    console.log("SMTP verified.");
  } catch (error) {
    console.error(
      "SMTP verification failed:",
      error
    );
  }

  // Background retry queue for existing emails.
  startEmailOutbox();

  // ====================================
  // START LISTENING
  // ====================================

  app.listen(
    PORT,
    "127.0.0.1",
    () => {
      console.log(
        `Rita API listening on 127.0.0.1:${PORT}`
      );
    }
  );
}

start().catch((error) => {
  console.error(
    "SERVER_START_FAILED:",
    error
  );

  process.exit(1);
});
