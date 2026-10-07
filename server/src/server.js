import "dotenv/config";

import express from "express";
import cors from "cors";

import {
  sendWorkflowEmail,
  verifyMailer,
  transporter,
} from "./mailer.js";

const app = express();

const port = Number(process.env.PORT || 5010);

app.use(cors());

app.use(
  express.json({
    limit: "100kb",
  })
);

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(value || "").trim()
  );
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "rita-simple-email-server",
  });
});

/*
|--------------------------------------------------------------------------
| Workflow email
|--------------------------------------------------------------------------
*/

app.post("/api/send-workflow-email", async (req, res) => {
  try {
    const {
      to,
      userName,
      applicationId,
      serviceName,
      oldPhase,
      newPhase,
      oldStatus,
      newStatus,
    } = req.body || {};

    if (!isValidEmail(to)) {
      return res.status(400).json({
        success: false,
        message: "A valid recipient email is required.",
      });
    }

    const result = await sendWorkflowEmail({
      to: String(to).trim(),
      userName: String(userName || ""),
      applicationId: String(applicationId || ""),
      serviceName: String(serviceName || ""),
      oldPhase: String(oldPhase || ""),
      newPhase: String(newPhase || ""),
      oldStatus: String(oldStatus || ""),
      newStatus: String(newStatus || ""),
    });

    if (result.skipped) {
      return res.json({
        success: true,
        skipped: true,
        message: result.reason,
      });
    }

    return res.json({
      success: true,
      skipped: false,
      message: "Email sent successfully.",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("SEND_WORKFLOW_EMAIL_ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Could not send the email.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| New service request email
|--------------------------------------------------------------------------
*/

app.post("/api/send-new-request-email", async (req, res) => {
  try {
    const {
      userName,
      userEmail,
      phone,
      country,
      applicationId,
      serviceName,
      packageName,
      packagePrice,
      desiredCompanyName,
      businessActivity,
      requestedSolutions,
      extraNotes,
    } = req.body || {};

    const adminEmail =
      process.env.ADMIN_EMAIL || "contact@ritadigitalservices.com";

    const subject = applicationId
      ? `New service request #${applicationId}`
      : "New service request";

    const html = `
<!doctype html>
<html>
  <body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#0e3149;">
    <div style="max-width:680px;margin:0 auto;padding:30px 16px;">

      <div style="background:#173e56;color:#fff;padding:22px 26px;border-radius:18px 18px 0 0;">
        <div style="font-size:22px;font-weight:800;">
          Rita Digital Services
        </div>

        <div style="margin-top:6px;opacity:.8;">
          New service request
        </div>
      </div>

      <div style="background:#fff;border:1px solid #dbe4ee;border-top:0;border-radius:0 0 18px 18px;padding:26px;">

        <h2 style="margin:0 0 18px;">
          A new service request was submitted
        </h2>

        <div style="padding:16px;border-radius:14px;background:#f8fafc;border:1px solid #e5edf5;line-height:1.8;">

          <div>
            <strong>Application:</strong>
            #${applicationId || "—"}
          </div>

          <div>
            <strong>Client:</strong>
            ${userName || "—"}
          </div>

          <div>
            <strong>Email:</strong>
            ${userEmail || "—"}
          </div>

          <div>
            <strong>Phone:</strong>
            ${phone || "—"}
          </div>

          <div>
            <strong>Country:</strong>
            ${country || "—"}
          </div>

          <div>
            <strong>Service:</strong>
            ${serviceName || "—"}
          </div>

          <div>
            <strong>Package:</strong>
            ${packageName || "—"}
          </div>

          <div>
            <strong>Package price:</strong>
            ${packagePrice || "—"}
          </div>

          <div>
            <strong>Desired company name:</strong>
            ${desiredCompanyName || "—"}
          </div>

          <div>
            <strong>Requested solutions:</strong>
            ${requestedSolutions || "—"}
          </div>

        </div>

        <div style="margin-top:18px;">
          <strong>Business activity</strong>

          <p style="white-space:pre-wrap;line-height:1.7;color:#64748b;">
            ${businessActivity || "—"}
          </p>
        </div>

        <div style="margin-top:18px;">
          <strong>Extra notes</strong>

          <p style="white-space:pre-wrap;line-height:1.7;color:#64748b;">
            ${extraNotes || "—"}
          </p>
        </div>

      </div>
    </div>
  </body>
</html>
`;

    const info = await transporter.sendMail({
      from: {
        name:
          process.env.MAIL_FROM_NAME ||
          "Rita Digital Services",

        address:
          process.env.MAIL_FROM_EMAIL ||
          process.env.SMTP_USER,
      },

      to: adminEmail,

      replyTo:
        userEmail && isValidEmail(userEmail)
          ? userEmail
          : undefined,

      subject,
      html,
    });

    return res.json({
      success: true,
      message: "Admin email sent successfully.",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error(
      "SEND_NEW_REQUEST_EMAIL_ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Could not send admin email.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| Start server
|--------------------------------------------------------------------------
*/

async function start() {
  try {
    await verifyMailer();

    console.log(
      "Hostinger SMTP verified successfully."
    );
  } catch (error) {
    console.error(
      "SMTP verification failed. Check your .env settings.",
      error
    );
  }

  app.listen(port, "127.0.0.1", () => {
    console.log(
      `Rita simple email server running on http://127.0.0.1:${port}`
    );
  });
}

start();