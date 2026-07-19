import express from "express";

import { pool } from "../config/db.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

const VALID_STATUSES = [
  "new",
  "read",
  "replied",
  "archived",
];

function mapMessageSummary(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    messagePreview: row.message_preview,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapFullMessage(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/*
  جميع المسارات الموجودة في هذا الملف
  تتطلب تسجيل دخول Admin أو Staff.
*/
router.use(requireAdmin);

/* =========================
   Get contact messages
========================= */

router.get("/", async (req, res) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : "";

    const status =
      typeof req.query.status === "string"
        ? req.query.status.trim()
        : "";

    if (
      status &&
      !VALID_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        message: "Invalid contact message status",
      });
    }

    const whereConditions = [];
    const queryValues = [];

    if (status) {
      whereConditions.push("status = ?");
      queryValues.push(status);
    }

    if (search) {
      const searchValue = `%${search}%`;

      whereConditions.push(`
        (
          CAST(id AS CHAR) LIKE ?
          OR full_name LIKE ?
          OR email LIKE ?
          OR phone LIKE ?
          OR subject LIKE ?
          OR message LIKE ?
        )
      `);

      queryValues.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue
      );
    }

    const whereSql =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const [rows] = await pool.execute(
      `
      SELECT
        id,
        full_name,
        email,
        phone,
        subject,
        LEFT(message, 180) AS message_preview,
        status,
        created_at,
        updated_at
      FROM contact_messages
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT 500
      `,
      queryValues
    );

    return res.json({
      messages: rows.map(mapMessageSummary),
    });
  } catch (error) {
    console.error(
      "ADMIN_CONTACT_MESSAGES_ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while loading contact messages",
    });
  }
});

/* =========================
   Get one contact message
========================= */

router.get("/:messageId", async (req, res) => {
  try {
    const messageId = Number(
      req.params.messageId
    );

    if (
      !Number.isInteger(messageId) ||
      messageId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid message ID",
      });
    }

    const [rows] = await pool.execute(
      `
      SELECT
        id,
        full_name,
        email,
        phone,
        subject,
        message,
        status,
        created_at,
        updated_at
      FROM contact_messages
      WHERE id = ?
      LIMIT 1
      `,
      [messageId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Contact message was not found",
      });
    }

    return res.json({
      message: mapFullMessage(rows[0]),
    });
  } catch (error) {
    console.error(
      "ADMIN_CONTACT_MESSAGE_DETAILS_ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while loading the contact message",
    });
  }
});

/* =========================
   Update message status
========================= */

router.patch(
  "/:messageId/status",
  async (req, res) => {
    try {
      const messageId = Number(
        req.params.messageId
      );

      const status =
        typeof req.body?.status === "string"
          ? req.body.status.trim()
          : "";

      if (
        !Number.isInteger(messageId) ||
        messageId <= 0
      ) {
        return res.status(400).json({
          message: "Invalid message ID",
        });
      }

      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          message: "Invalid contact message status",
        });
      }

      const [updateResult] =
        await pool.execute(
          `
          UPDATE contact_messages
          SET status = ?
          WHERE id = ?
          `,
          [status, messageId]
        );

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({
          message:
            "Contact message was not found",
        });
      }

      const [rows] = await pool.execute(
        `
        SELECT
          id,
          full_name,
          email,
          phone,
          subject,
          message,
          status,
          created_at,
          updated_at
        FROM contact_messages
        WHERE id = ?
        LIMIT 1
        `,
        [messageId]
      );

      return res.json({
        message: mapFullMessage(rows[0]),
      });
    } catch (error) {
      console.error(
        "ADMIN_UPDATE_CONTACT_MESSAGE_ERROR:",
        errors
      );

      return res.status(500).json({
        message:
          "Server error while updating the contact message",
      });
    }
  }
);

export default router;