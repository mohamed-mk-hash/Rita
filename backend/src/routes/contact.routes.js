import express from "express";

import { pool } from "../config/db.js";

const router = express.Router();

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/", async (req, res) => {
  try {
    const fullName = normalizeText(req.body.fullName);
    const email = normalizeText(req.body.email).toLowerCase();
    const phone = normalizeText(req.body.phone);
    const subject = normalizeText(req.body.subject);
    const message = normalizeText(req.body.message);

    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({
        message:
          "Full name, email, subject, and message are required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address",
      });
    }

    if (fullName.length > 150) {
      return res.status(400).json({
        message: "Full name is too long",
      });
    }

    if (email.length > 255) {
      return res.status(400).json({
        message: "Email address is too long",
      });
    }

    if (phone.length > 50) {
      return res.status(400).json({
        message: "Phone number is too long",
      });
    }

    if (subject.length > 200) {
      return res.status(400).json({
        message: "Subject is too long",
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        message: "Message must not exceed 5000 characters",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO contact_messages (
        full_name,
        email,
        phone,
        subject,
        message,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        fullName,
        email,
        phone || null,
        subject,
        message,
        "new",
      ]
    );

    return res.status(201).json({
      message: "Message sent successfully",
      contactMessage: {
        id: result.insertId,
        fullName,
        email,
        phone: phone || null,
        subject,
        status: "new",
      },
    });
  } catch (error) {
    console.error("CONTACT_MESSAGE_ERROR:", error);

    return res.status(500).json({
      message: "Server error while sending your message",
    });
  }
});

export default router;