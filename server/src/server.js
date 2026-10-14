
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
//import paypalWebhook from "./paypalWebhook.js";
import companyDocumentsRoutes from "./companyDocumentsRoutes.js";

if (process.env.PAYPAL_ENV !== "live") {
  throw new Error("PAYPAL_ENV must be live.");
}

const app = express();

const PORT = Number(process.env.PORT || 5010);

const allowedOrigins = (
  process.env.CLIENT_ORIGINS ||
  "https://ritadigitalservices.com,https://www.ritadigitalservices.com"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

app.disable("x-powered-by");

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origin not allowed."));
      }
    },
  })
);

// Important: webhook receives the raw body.
// Mount it before express.json().
//app.use("/api/paypal", paypalWebhook);

app.use(
  express.json({
    limit: "100kb",
  })
);

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(value || "").trim()
  );
}

function isApplicationId(value) {
  return /^\d{8,20}$/.test(String(value || ""));
}

async function queueAndTrySend(data) {
  const job = enqueueEmail(data);

  await flushEmailOutbox();

  const current = getEmailJob(job.id);

  return {
    success: true,
    queued: current?.status !== "sent",
    emailStatus: current?.status || "pending",
    jobId: job.id,
    messageId: current?.messageId || null,
  };
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "rita-api",
    paypal: "live",
    email: "enabled",
  });
});

// Original new-request endpoint.
app.post("/api/send-new-request-email", async (req, res) => {
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

    const email = buildNewRequestAdminEmail(payload);

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

    return res.status(
      result.queued ? 202 : 200
    ).json(result);
  } catch (error) {
    console.error("NEW_REQUEST_EMAIL_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to queue notification.",
    });
  }
});

// Original workflow endpoint.
app.post("/api/send-workflow-email", async (req, res) => {
  try {
    const payload = req.body || {};

    if (!isEmail(payload.to)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipient.",
      });
    }

    const email = buildWorkflowEmail(payload);

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

    return res.status(
      result.queued ? 202 : 200
    ).json(result);
  } catch (error) {
    console.error("WORKFLOW_EMAIL_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to queue notification.",
    });
  }
});

// Original payment-request endpoint.
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
        message: "Invalid application or recipient.",
      });
    }

    const email = buildPaymentRequestEmail({
      ...payload,
      applicationId,
    });

    const result = await queueAndTrySend({
      key: `payment-request:${applicationId}`,
      kind: "payment_request",
      to: String(payload.to).trim(),
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    return res.status(
      result.queued ? 202 : 200
    ).json(result);
  } catch (error) {
    console.error("PAYMENT_REQUEST_EMAIL_ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to queue payment request.",
    });
  }
}

app.post(
  "/api/applications/:id/send-payment-request-email",
  paymentRequestEmail
);

app.post(
  "/api/send-payment-request-email",
  paymentRequestEmail
);

// Payment operations.
app.use("/api/paypal", paypalRoutes);

// Company documents.
app.use("/api", companyDocumentsRoutes);

async function start() {
  getAdminEmail();



  try {
    await verifyMailer();
    console.log("SMTP verified.");
  } catch (error) {
    console.error(
      "SMTP verification failed:",
      error.message
    );
  }

  startEmailOutbox();

  app.listen(PORT, "127.0.0.1", () => {
    console.log(
      `Rita API listening on 127.0.0.1:${PORT}`
    );
  });
}

start().catch((error) => {
  console.error("SERVER_START_FAILED:", error);
  process.exit(1);
});
