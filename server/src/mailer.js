
import nodemailer from "nodemailer";

const smtpPort = Number(
  process.env.SMTP_PORT || 465
);

const smtpSecure =
  String(
    process.env.SMTP_SECURE || "true"
  ).toLowerCase() === "true";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true,
  maxConnections: 2,
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
});

export async function verifyMailer() {
  await transporter.verify();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sender() {
  return {
    name:
      process.env.MAIL_FROM_NAME ||
      "Rita Digital Services",
    address:
      process.env.MAIL_FROM_EMAIL ||
      process.env.SMTP_USER,
  };
}

function detailsTable(rows) {
  return rows.map(([label, value]) => `
    <tr>
      <td style="padding:13px 12px;border-bottom:1px solid #e7edf4;color:#64748b;font-size:13px;vertical-align:top;width:38%">
        ${escapeHtml(label)}
      </td>
      <td style="padding:13px 12px;border-bottom:1px solid #e7edf4;color:#173e56;font-size:14px;font-weight:700;vertical-align:top;word-break:break-word;white-space:pre-wrap">
        ${escapeHtml(value || "—")}
      </td>
    </tr>
  `).join("");
}

function layout({
  eyebrow,
  heading,
  description,
  table,
  actionText,
  actionUrl,
  footer,
}) {
  const action =
    actionText &&
    actionUrl &&
    /^https:\/\//i.test(actionUrl)
      ? `
        <div style="padding:12px 0 6px;text-align:center">
          <a href="${escapeHtml(actionUrl)}"
             style="display:inline-block;background:#e83445;color:#ffffff;text-decoration:none;padding:15px 27px;border-radius:11px;font-weight:bold">
             ${escapeHtml(actionText)}
          </a>
        </div>
      `
      : "";

  return `
<!doctype html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f2f6fa;font-family:Arial,Tahoma,sans-serif;color:#173e56">
  <div style="display:none;font-size:1px;color:#f2f6fa">
    ${escapeHtml(description)}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0"
         style="width:100%;background:#f2f6fa">
    <tr>
      <td align="center" style="padding:36px 14px">
        <table role="presentation" cellpadding="0" cellspacing="0"
               style="width:100%;max-width:620px;background:white;border-radius:18px;overflow:hidden;border:1px solid #e1e8ef">
          <tr>
            <td style="background:#173e56;padding:27px 30px;color:white">
              <div style="font-size:23px;font-weight:800">
                Rita Digital Services
              </div>
              <div style="font-size:12px;margin-top:7px;letter-spacing:1px;color:#bfd6e5">
                ${escapeHtml(eyebrow)}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 30px">
              <div dir="rtl" style="text-align:right">
                <h1 style="font-size:25px;line-height:1.5;margin:0 0 10px;color:#10364f">
                  ${escapeHtml(heading)}
                </h1>
                <p style="font-size:15px;line-height:1.9;color:#516a7d;margin:0 0 24px">
                  ${escapeHtml(description)}
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0"
                       style="border-collapse:collapse;width:100%;background:#f8fafc;border:1px solid #e7edf4;border-radius:12px"
                       dir="ltr">
                  ${table}
                </table>
                ${action}
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:20px 30px;border-top:1px solid #e7edf4;text-align:center">
              <p style="font-size:12px;line-height:1.8;color:#7890a2;margin:0">
                ${escapeHtml(footer || "Rita Digital Services")}
              </p>
              <p style="font-size:11px;color:#7890a2;margin:7px 0 0">
                This is an automated notification from Rita Digital Services.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildNewRequestAdminEmail(data = {}) {
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
  } = data;

  const rows = [
    ["رقم الطلب | Application", applicationId],
    ["العميل | Client", userName],
    ["البريد | Email", userEmail],
    ["الهاتف | Phone", phone],
    ["الدولة | Country", country],
    ["الخدمة | Service", serviceName],
    ["الباقة | Package", packageName],
    ["السعر | Price", packagePrice],
    ["اسم الشركة | Company", desiredCompanyName],
    ["الخدمات الإضافية | Solutions", requestedSolutions],
    ["النشاط التجاري | Activity", businessActivity],
    ["ملاحظات | Notes", extraNotes],
  ];

  return {
    subject:
      `Rita | طلب خدمة جديد #${applicationId || "New"}`,
    text: [
      "طلب خدمة جديد | New Service Request",
      "",
      ...rows.map(([key, value]) => `${key}: ${value || "—"}`),
    ].join("\n"),
    html: layout({
      eyebrow: "NEW SERVICE REQUEST",
      heading: "وصلك طلب خدمة جديد!",
      description:
        "قام عميل بإرسال طلب جديد. يمكنك مراجعة بياناته ووثائقه من لوحة الإدارة.",
      table: detailsTable(rows),
      footer:
        "إشعار داخلي موجه إلى إدارة Rita Digital Services.",
    }),
  };
}

export function buildPaymentAdminEmail({
  applicationId,
  amount,
  captureId,
}) {
  const rows = [
    ["رقم الطلب | Application", applicationId],
    ["المبلغ | Amount", `${Number(amount).toFixed(2)} USD`],
    ["طريقة الدفع | Provider", "PayPal Sandbox"],
    ["حالة الدفع | Status", "مدفوع تجريبيًا | Paid"],
    ["رقم التحصيل | Capture ID", captureId],
  ];

  return {
    subject: `Rita | تم الدفع للطلب #${applicationId} [Sandbox]`,
    text: [
      "Sandbox payment received.",
      ...rows.map(([key, value]) => `${key}: ${value}`),
      "",
      "The payment is simulated, not real money.",
    ].join("\n"),
    html: layout({
      eyebrow: "PAYMENT CONFIRMED - SANDBOX",
      heading: "تم تأكيد دفع الطلب بنجاح",
      description:
        "تم تحصيل المبلغ بشكل تجريبي عبر PayPal Sandbox. يمكنك مراجعة الطلب والانتقال إلى مرحلة التنفيذ.",
      table: detailsTable(rows),
      footer:
        "عملية اختبار فقط — لم يتم تحصيل أموال حقيقية.",
    }),
  };
}

export function buildWorkflowEmail({
  userName = "",
  applicationId = "",
  serviceName = "",
  oldPhase = "",
  newPhase = "",
  oldStatus = "",
  newStatus = "",
}) {
  const phaseChanged =
    String(oldPhase) !== String(newPhase);

  const statusChanged =
    String(oldStatus) !== String(newStatus);

  if (!phaseChanged && !statusChanged) {
    return null;
  }

  const rows = [
    ["العميل | Client", userName],
    ["رقم الطلب | Application", applicationId],
    ["الخدمة | Service", serviceName],
  ];

  if (phaseChanged) {
    rows.push([
      "المرحلة | Phase",
      `${oldPhase || "—"} → ${newPhase || "—"}`,
    ]);
  }

  if (statusChanged) {
    rows.push([
      "الحالة | Status",
      `${oldStatus || "—"} → ${newStatus || "—"}`,
    ]);
  }

  return {
    subject: `Rita | تحديث طلبك #${applicationId}`,
    text: rows.map(
      ([key, value]) => `${key}: ${value || "—"}`
    ).join("\n"),
    html: layout({
      eyebrow: "APPLICATION UPDATE",
      heading: "تم تحديث حالة طلبك",
      description:
        `مرحبًا ${userName || ""}، قام فريق Rita بتحديث طلبك. يمكنك مراجعة التفاصيل في لوحة العميل.`,
      table: detailsTable(rows),
    }),
  };
}

export function buildPaymentRequestEmail({
  userName = "",
  applicationId = "",
  serviceName = "",
}) {
  const rows = [
    ["العميل | Client", userName],
    ["رقم الطلب | Application", applicationId],
    ["الخدمة | Service", serviceName],
    ["الحالة | Status", "بانتظار الدفع | Awaiting payment"],
  ];

  return {
    subject:
      `Rita | تمت الموافقة على طلبك #${applicationId} — الدفع مطلوب`,
    text: [
      `Hello ${userName},`,
      "Your service request has been accepted.",
      `Application: ${applicationId}`,
      `Service: ${serviceName}`,
      "Please sign in to your dashboard to complete the payment.",
    ].join("\n"),
    html: layout({
      eyebrow: "APPLICATION APPROVED",
      heading: "تم قبول طلبك — حان وقت الدفع",
      description:
        `مرحبًا ${userName}، وافق فريق Rita على طلبك. ادخل إلى لوحة العميل لإتمام الدفع والانتقال إلى مرحلة التنفيذ.`,
      table: detailsTable(rows),
    }),
  };
}

// Keep these exports for older parts of your app.

export async function sendWorkflowEmail(data) {
  const email = buildWorkflowEmail(data);

  if (!email) {
    return {
      skipped: true,
      reason: "No workflow change detected.",
    };
  }

  const info = await transporter.sendMail({
    from: sender(),
    to: data.to,
    ...email,
  });

  return {
    skipped: false,
    messageId: info.messageId,
  };
}

export async function sendPaymentRequestEmail(data) {
  const email = buildPaymentRequestEmail(data);

  const info = await transporter.sendMail({
    from: sender(),
    to: data.to,
    ...email,
  });

  return {
    skipped: false,
    messageId: info.messageId,
  };
}
