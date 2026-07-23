import nodemailer from "nodemailer";

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return String(value).trim().toLowerCase() === "true";
}

const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = toBoolean(
  process.env.SMTP_SECURE,
  smtpPort === 465
);

const requiredVariables = [
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "SMTP_TO",
];

export function validateMailEnvironment() {
  const missing = requiredVariables.filter(
    (name) => !String(process.env[name] || "").trim()
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing SMTP environment variables: ${missing.join(", ")}`
    );
  }
}

export const mailTransporter = nodemailer.createTransport({
  pool: true,
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  maxConnections: 3,
  maxMessages: 100,
  connectionTimeout: 15_000,
  greetingTimeout: 15_000,
  socketTimeout: 30_000,
});

export async function verifyMailerConnection() {
  validateMailEnvironment();
  await mailTransporter.verify();
  return true;
}
