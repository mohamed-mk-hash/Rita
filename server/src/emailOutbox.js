
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import { transporter } from "./mailer.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const dataDir = path.resolve(
  currentDir,
  "../private-data"
);

const outboxPath = path.join(
  dataDir,
  "email-outbox.json"
);

const RETRY_DELAY = 60 * 1000;
const MAX_DELAY = 60 * 60 * 1000;

fs.mkdirSync(dataDir, {
  recursive: true,
  mode: 0o700,
});

function loadOutbox() {
  try {
    if (!fs.existsSync(outboxPath)) {
      return [];
    }

    const data = JSON.parse(
      fs.readFileSync(outboxPath, "utf8")
    );

    return Array.isArray(data) ? data : [];
  } catch (error) {
    // Never overwrite an unreadable outbox.
    throw new Error(
      `Cannot read email outbox: ${error.message}`
    );
  }
}

let messages = loadOutbox();
let processing = null;

function saveOutbox() {
  const temporaryPath = `${outboxPath}.tmp`;

  fs.writeFileSync(
    temporaryPath,
    JSON.stringify(messages, null, 2),
    {
      encoding: "utf8",
      mode: 0o600,
    }
  );

  fs.renameSync(temporaryPath, outboxPath);
}

function emailAddress(value) {
  return String(value || "").trim();
}

function getSender() {
  const address = emailAddress(
    process.env.MAIL_FROM_EMAIL ||
      process.env.SMTP_USER
  );

  if (!address) {
    throw new Error(
      "MAIL_FROM_EMAIL or SMTP_USER is missing."
    );
  }

  return {
    name:
      process.env.MAIL_FROM_NAME ||
      "Rita Digital Services",
    address,
  };
}

export function getAdminEmail() {
  const email = emailAddress(
    process.env.ADMIN_EMAIL
  );

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(
      "ADMIN_EMAIL is missing or invalid in server/.env"
    );
  }

  return email;
}

function retryTime(attempts) {
  const delay = Math.min(
    MAX_DELAY,
    RETRY_DELAY * 2 ** Math.min(attempts - 1, 6)
  );

  return new Date(Date.now() + delay).toISOString();
}

/*
 * Store before attempting SMTP.
 *
 * key is used to prevent repeated queue entries.
 * It is not proof of mailbox delivery.
 */
export function enqueueEmail({
  key,
  to,
  subject,
  text,
  html,
  replyTo,
  kind = "general",
}) {
  const target = emailAddress(to);
  const normalizedKey = String(key || randomUUID());

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
    throw new Error("Invalid email recipient.");
  }

  const existing = messages.find(
    (item) => item.key === normalizedKey
  );

  if (existing) {
    return {
      id: existing.id,
      status: existing.status,
      duplicate: true,
    };
  }

  const item = {
    id: randomUUID(),
    key: normalizedKey,
    kind,
    to: target,
    subject: String(subject || ""),
    text: String(text || ""),
    html: String(html || ""),
    replyTo: replyTo || null,
    status: "pending",
    attempts: 0,
    createdAt: new Date().toISOString(),
    nextAttemptAt: new Date().toISOString(),
    lastError: null,
    sentAt: null,
    messageId: null,
  };

  messages.push(item);
  saveOutbox();

  console.log("EMAIL_QUEUED:", {
    id: item.id,
    kind: item.kind,
    to: item.to,
  });

  return {
    id: item.id,
    status: item.status,
    duplicate: false,
  };
}

async function performFlush() {
  const now = Date.now();

  const due = messages.filter(
    (item) =>
      item.status === "pending" &&
      new Date(item.nextAttemptAt).getTime() <= now
  );

  for (const item of due) {
    try {
      const info = await transporter.sendMail({
        from: getSender(),
        to: item.to,
        subject: item.subject,
        text: item.text,
        html: item.html,
        ...(item.replyTo
          ? { replyTo: item.replyTo }
          : {}),
      });

      const accepted = Array.isArray(info.accepted)
        ? info.accepted
        : [];

      if (accepted.length === 0) {
        throw new Error(
          "SMTP did not accept any recipient."
        );
      }

      item.status = "sent";
      item.sentAt = new Date().toISOString();
      item.messageId = info.messageId || null;
      item.lastError = null;

      saveOutbox();

      console.log("EMAIL_SMTP_ACCEPTED:", {
        kind: item.kind,
        to: item.to,
        messageId: item.messageId,
      });
    } catch (error) {
      item.attempts += 1;
      item.lastError = String(
        error?.message || error
      );
      item.nextAttemptAt = retryTime(item.attempts);

      saveOutbox();

      console.error("EMAIL_RETRY_SCHEDULED:", {
        kind: item.kind,
        to: item.to,
        attempts: item.attempts,
        nextAttemptAt: item.nextAttemptAt,
        error: item.lastError,
      });
    }
  }

  return {
    pending: messages.filter(
      (item) => item.status === "pending"
    ).length,
    sent: messages.filter(
      (item) => item.status === "sent"
    ).length,
  };
}

export function flushEmailOutbox() {
  if (processing) {
    return processing;
  }

  processing = performFlush().finally(() => {
    processing = null;
  });

  return processing;
}

export function getEmailJob(id) {
  const item = messages.find(
    (message) => message.id === String(id)
  );

  if (!item) {
    return null;
  }

  return {
    id: item.id,
    kind: item.kind,
    status: item.status,
    attempts: item.attempts,
    nextAttemptAt: item.nextAttemptAt,
    lastError: item.lastError,
    sentAt: item.sentAt,
    messageId: item.messageId,
  };
}

export function startEmailOutbox() {
  // Retry pending messages after a server restart.
  void flushEmailOutbox().catch((error) => {
    console.error("EMAIL_OUTBOX_START_ERROR:", error);
  });

  const interval = setInterval(() => {
    void flushEmailOutbox().catch((error) => {
      console.error("EMAIL_OUTBOX_ERROR:", error);
    });
  }, 30 * 1000);

  interval.unref();

  return interval;
}
