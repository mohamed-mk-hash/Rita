import {
  mailTransporter,
  validateMailEnvironment,
} from "../config/mailer.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanHeader(value, fallback = "Website contact message") {
  const cleaned = String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, 180);

  return cleaned || fallback;
}

function formatMultilineHtml(value) {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

export async function sendContactMessageEmail({
  fullName,
  email,
  phone,
  subject,
  message,
  ipAddress,
  userAgent,
}) {
  validateMailEnvironment();

  const safeSubject = cleanHeader(subject);
  const fromName = cleanHeader(
    process.env.SMTP_FROM_NAME,
    "Website Contact Form"
  );

  const mail = {
    from: {
      name: fromName,
      address: process.env.SMTP_FROM,
    },
    to: process.env.SMTP_TO,
    replyTo: email,
    subject: `[Contact Form] ${safeSubject}`,
    text: [
      "New contact-form message",
      "",
      `Name: ${fullName}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      `Subject: ${safeSubject}`,
      "",
      "Message:",
      message,
      "",
      `IP: ${ipAddress || "Unknown"}`,
      `User-Agent: ${userAgent || "Unknown"}`,
    ].join("\n"),
    html: `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>New contact message</title>
        </head>
        <body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#102a43;">
          <div style="max-width:680px;margin:0 auto;padding:32px 16px;">
            <div style="background:#173e56;color:#fff;border-radius:18px 18px 0 0;padding:24px 28px;">
              <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;opacity:.75;">Website contact form</div>
              <h1 style="margin:8px 0 0;font-size:25px;">New message received</h1>
            </div>

            <div style="background:#fff;border:1px solid #e4eaf1;border-top:0;border-radius:0 0 18px 18px;padding:28px;">
              <table role="presentation" style="width:100%;border-collapse:collapse;font-size:15px;">
                <tr>
                  <td style="padding:8px 0;font-weight:700;width:120px;vertical-align:top;">Name</td>
                  <td style="padding:8px 0;">${escapeHtml(fullName)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:700;vertical-align:top;">Email</td>
                  <td style="padding:8px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:700;vertical-align:top;">Phone</td>
                  <td style="padding:8px 0;">${escapeHtml(phone || "Not provided")}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:700;vertical-align:top;">Subject</td>
                  <td style="padding:8px 0;">${escapeHtml(safeSubject)}</td>
                </tr>
              </table>

              <div style="height:1px;background:#e8edf3;margin:22px 0;"></div>

              <div style="font-size:14px;font-weight:700;margin-bottom:10px;">Message</div>
              <div style="background:#f7f9fc;border-radius:12px;padding:18px;line-height:1.75;font-size:15px;">
                ${formatMultilineHtml(message)}
              </div>

              <div style="margin-top:22px;font-size:12px;color:#8292a6;line-height:1.6;">
                IP: ${escapeHtml(ipAddress || "Unknown")}<br />
                User-Agent: ${escapeHtml(userAgent || "Unknown")}
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  return mailTransporter.sendMail(mail);
}
