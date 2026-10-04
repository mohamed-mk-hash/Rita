import nodemailer from "nodemailer";

const smtpPort = Number(process.env.SMTP_PORT || 465);

const smtpSecure =
  String(process.env.SMTP_SECURE || "true").toLowerCase() === "true";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function verifyMailer() {
  await transporter.verify();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendWorkflowEmail({
  to,
  userName,
  applicationId,
  serviceName,
  oldPhase,
  newPhase,
  oldStatus,
  newStatus,
}) {
  const safeName = escapeHtml(userName || "");
  const safeApplicationId = escapeHtml(applicationId || "");
  const safeServiceName = escapeHtml(serviceName || "");

  const phaseChanged =
    String(oldPhase || "") !== String(newPhase || "");

  const statusChanged =
    String(oldStatus || "") !== String(newStatus || "");

  if (!phaseChanged && !statusChanged) {
    return {
      skipped: true,
      reason: "No workflow change detected.",
    };
  }

  const arChanges = [];
  const enChanges = [];

  if (phaseChanged) {
    arChanges.push(
      `<div style="padding:10px 0;border-top:1px solid #e5edf5;">
        <strong>المرحلة:</strong>
        ${escapeHtml(oldPhase || "—")} ← ${escapeHtml(newPhase || "—")}
      </div>`
    );

    enChanges.push(
      `<div style="padding:10px 0;border-top:1px solid #e5edf5;">
        <strong>Phase:</strong>
        ${escapeHtml(oldPhase || "—")} → ${escapeHtml(newPhase || "—")}
      </div>`
    );
  }

  if (statusChanged) {
    arChanges.push(
      `<div style="padding:10px 0;border-top:1px solid #e5edf5;">
        <strong>الحالة:</strong>
        ${escapeHtml(oldStatus || "—")} ← ${escapeHtml(newStatus || "—")}
      </div>`
    );

    enChanges.push(
      `<div style="padding:10px 0;border-top:1px solid #e5edf5;">
        <strong>Status:</strong>
        ${escapeHtml(oldStatus || "—")} → ${escapeHtml(newStatus || "—")}
      </div>`
    );
  }

  const subject = applicationId
    ? `Rita - تحديث الطلب #${applicationId} | Application update`
    : "Rita - تحديث على طلبك | Application update";

  const html = `
<!doctype html>
<html>
  <body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#0e3149;">
    <div style="max-width:680px;margin:0 auto;padding:30px 16px;">
      <div style="background:#173e56;color:#fff;padding:22px 26px;border-radius:18px 18px 0 0;">
        <div style="font-size:22px;font-weight:800;">Rita Digital Services</div>
      </div>

      <div style="background:#fff;border:1px solid #dbe4ee;border-top:0;border-radius:0 0 18px 18px;padding:26px;">
        <div dir="rtl" style="text-align:right;">
          <h2 style="margin:0 0 10px;">
            مرحباً${safeName ? ` ${safeName}` : ""}
          </h2>

          <p style="line-height:1.8;color:#64748b;">
            تم تحديث طلبك من طرف فريق Rita.
          </p>

          <div style="margin:18px 0;padding:16px;border-radius:14px;background:#f8fafc;border:1px solid #e5edf5;">
            ${
              safeApplicationId
                ? `<div style="font-weight:800;margin-bottom:8px;">الطلب #${safeApplicationId}</div>`
                : ""
            }

            ${
              safeServiceName
                ? `<div style="color:#64748b;margin-bottom:12px;">الخدمة: ${safeServiceName}</div>`
                : ""
            }

            ${arChanges.join("")}
          </div>

          <p style="line-height:1.8;color:#64748b;">
            يمكنك الدخول إلى لوحة العميل لمشاهدة آخر التحديثات.
          </p>
        </div>

        <div style="height:1px;background:#e5edf5;margin:28px 0;"></div>

        <div dir="ltr" style="text-align:left;">
          <h2 style="margin:0 0 10px;">
            Hello${safeName ? ` ${safeName}` : ""}
          </h2>

          <p style="line-height:1.8;color:#64748b;">
            Your Rita application has been updated.
          </p>

          <div style="margin:18px 0;padding:16px;border-radius:14px;background:#f8fafc;border:1px solid #e5edf5;">
            ${
              safeApplicationId
                ? `<div style="font-weight:800;margin-bottom:8px;">Application #${safeApplicationId}</div>`
                : ""
            }

            ${
              safeServiceName
                ? `<div style="color:#64748b;margin-bottom:12px;">Service: ${safeServiceName}</div>`
                : ""
            }

            ${enChanges.join("")}
          </div>

          <p style="line-height:1.8;color:#64748b;">
            Sign in to your client dashboard to see the latest update.
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`;

  const textLines = [
    "Rita Digital Services",
    "",
    userName ? `Hello ${userName}` : "Hello",
    applicationId ? `Application #${applicationId}` : "",
    serviceName ? `Service: ${serviceName}` : "",
    "",
  ];

  if (phaseChanged) {
    textLines.push(
      `Phase: ${oldPhase || "—"} -> ${newPhase || "—"}`
    );
  }

  if (statusChanged) {
    textLines.push(
      `Status: ${oldStatus || "—"} -> ${newStatus || "—"}`
    );
  }

  const info = await transporter.sendMail({
    from: {
      name: process.env.MAIL_FROM_NAME || "Rita Digital Services",
      address: process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER,
    },
    to,
    subject,
    text: textLines.filter(Boolean).join("\n"),
    html,
  });

  return {
    skipped: false,
    messageId: info.messageId,
  };
}
