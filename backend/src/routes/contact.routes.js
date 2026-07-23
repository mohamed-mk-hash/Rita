import { Router } from "express";
import { pool } from "../config/db.js";
import { sendContactMessageEmail } from "../services/contactEmail.service.js";

const router = Router();

function cleanText(value, maxLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || null;
}

router.post("/", async (req, res) => {
  const fullName = cleanText(req.body?.fullName, 150);
  const email = cleanText(req.body?.email, 255).toLowerCase();
  const phone = cleanText(req.body?.phone, 50);
  const subject = cleanText(req.body?.subject, 200);
  const message = cleanText(req.body?.message, 5000);

  if (!fullName || !email || !subject || !message) {
    return res.status(422).json({
      message: "Full name, email, subject, and message are required",
    });
  }

  if (!isValidEmail(email)) {
    return res.status(422).json({
      message: "Please enter a valid email address",
    });
  }

  let messageId = null;

  try {
    const [result] = await pool.execute(
      `
      INSERT INTO contact_messages (
        full_name,
        email,
        phone,
        subject,
        message,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, 'new', NOW(), NOW())
      `,
      [
        fullName,
        email,
        phone || null,
        subject,
        message,
      ]
    );

    messageId = result.insertId;
  } catch (databaseError) {
    console.error("CONTACT_MESSAGE_DATABASE_ERROR:", databaseError);

    return res.status(500).json({
      message: "Could not save the contact message",
    });
  }

  try {
    const emailInfo = await sendContactMessageEmail({
      fullName,
      email,
      phone,
      subject,
      message,
      ipAddress: getClientIp(req),
      userAgent: req.get("user-agent") || null,
    });

    console.log("CONTACT_EMAIL_SENT:", {
      contactMessageId: messageId,
      smtpMessageId: emailInfo.messageId,
      accepted: emailInfo.accepted,
      rejected: emailInfo.rejected,
    });
  } catch (emailError) {
    console.error("CONTACT_EMAIL_SEND_ERROR:", {
      contactMessageId: messageId,
      code: emailError?.code,
      command: emailError?.command,
      response: emailError?.response,
      message: emailError?.message,
    });

    return res.status(502).json({
      message:
        "Your message was saved, but the email notification could not be sent. Please try again later.",
    });
  }

  return res.status(201).json({
    message: "Contact message sent successfully",
    contactMessageId: messageId,
  });
});

export default router;
