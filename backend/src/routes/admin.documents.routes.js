import express from "express";

import { pool } from "../config/db.js";
import {
  supabaseAdmin,
  SUPABASE_STORAGE_BUCKET,
} from "../config/supabase.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

const DOCUMENT_STATUSES = new Set([
  "uploaded",
  "in_review",
  "approved",
  "rejected",
]);

function cleanPositiveInteger(value, fallback = null) {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return fallback;
  }

  return number;
}

function normalizeStoragePath(filePath) {
  let normalized = String(filePath || "")
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\/+/, "");

  const bucketPrefix = `${SUPABASE_STORAGE_BUCKET}/`;

  if (normalized.startsWith(bucketPrefix)) {
    normalized = normalized.slice(bucketPrefix.length);
  }

  return normalized;
}

function mapDocument(row) {
  return {
    id: Number(row.id),
    applicationId: Number(row.application_id),
    requirementId: Number(row.requirement_id),

    originalName: row.original_name,
    mimeType: row.mime_type,
    fileSize: Number(row.file_size || 0),

    status: row.status,
    reviewNote: row.review_note,
    uploadedAt: row.uploaded_at,
    reviewedAt: row.reviewed_at,

    titleEn: row.title_en,
    titleAr: row.title_ar,
    descriptionEn: row.description_en,
    descriptionAr: row.description_ar,
    isRequired: Boolean(row.is_required),

    serviceType: row.service_type,

    client: {
      id: Number(row.client_id),
      fullName: row.client_full_name,
      companyName: row.client_company_name,
      email: row.client_email,
    },
  };
}

router.use(requireAdmin);

/* =========================
   List uploaded documents
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

    const page = cleanPositiveInteger(req.query.page, 1);
    const requestedLimit = cleanPositiveInteger(req.query.limit, 12);
    const limit = Math.min(requestedLimit, 100);
    const offset = (page - 1) * limit;

    if (status && !DOCUMENT_STATUSES.has(status)) {
      return res.status(400).json({
        message: "Invalid document status",
      });
    }

    const where = [];
    const values = [];

    if (status) {
      where.push("ad.status = ?");
      values.push(status);
    }

    if (search) {
      const searchValue = `%${search}%`;

      where.push(`
        (
          u.full_name LIKE ?
          OR u.email LIKE ?
          OR ad.original_name LIKE ?
          OR dr.title_en LIKE ?
          OR dr.title_ar LIKE ?
          OR CAST(a.id AS CHAR) LIKE ?
        )
      `);

      values.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue
      );
    }

    const whereSql =
      where.length > 0
        ? `WHERE ${where.join(" AND ")}`
        : "";

    const [countRows] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM application_documents ad
      INNER JOIN applications a
        ON a.id = ad.application_id
      INNER JOIN users u
        ON u.id = a.user_id
      INNER JOIN document_requirements dr
        ON dr.id = ad.requirement_id
      ${whereSql}
      `,
      values
    );

    const total = Number(countRows[0]?.total || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const [rows] = await pool.query(
      `
      SELECT
        ad.id,
        ad.application_id,
        ad.requirement_id,
        ad.original_name,
        ad.mime_type,
        ad.file_size,
        ad.status,
        ad.review_note,
        ad.uploaded_at,
        ad.reviewed_at,

        dr.title_en,
        dr.title_ar,
        dr.description_en,
        dr.description_ar,
        dr.is_required,

        a.service_type,

        u.id AS client_id,
        u.full_name AS client_full_name,
        u.company_name AS client_company_name,
        u.email AS client_email

      FROM application_documents ad

      INNER JOIN applications a
        ON a.id = ad.application_id

      INNER JOIN users u
        ON u.id = a.user_id

      INNER JOIN document_requirements dr
        ON dr.id = ad.requirement_id

      ${whereSql}

      ORDER BY ad.uploaded_at DESC, ad.id DESC
      LIMIT ? OFFSET ?
      `,
      [...values, limit, offset]
    );

    const [statsRows] = await pool.query(
      `
      SELECT
        COUNT(*) AS total,
        SUM(status = 'uploaded') AS uploaded,
        SUM(status = 'in_review') AS in_review,
        SUM(status = 'approved') AS approved,
        SUM(status = 'rejected') AS rejected
      FROM application_documents
      `
    );

    const statsRow = statsRows[0] || {};

    return res.json({
      documents: rows.map(mapDocument),

      stats: {
        total: Number(statsRow.total || 0),
        uploaded: Number(statsRow.uploaded || 0),
        inReview: Number(statsRow.in_review || 0),
        approved: Number(statsRow.approved || 0),
        rejected: Number(statsRow.rejected || 0),
      },

      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("ADMIN_DOCUMENTS_LIST_ERROR:", error);

    return res.status(500).json({
      message: "Server error while loading documents",
    });
  }
});

/* =========================
   Review document
========================= */

router.patch("/:documentId/review", async (req, res) => {
  try {
    const documentId = cleanPositiveInteger(
      req.params.documentId
    );

    if (!documentId) {
      return res.status(400).json({
        message: "Invalid document ID",
      });
    }

    const status =
      typeof req.body?.status === "string"
        ? req.body.status.trim()
        : "";

    const reviewNote =
      typeof req.body?.reviewNote === "string"
        ? req.body.reviewNote.trim()
        : "";

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Review status must be approved or rejected",
      });
    }

    if (status === "rejected" && !reviewNote) {
      return res.status(400).json({
        message: "A review note is required when rejecting a document",
      });
    }

    const [result] = await pool.query(
      `
      UPDATE application_documents
      SET
        status = ?,
        review_note = ?,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        status,
        reviewNote || null,
        documentId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    return res.json({
      message:
        status === "approved"
          ? "Document approved successfully"
          : "Document rejected successfully",

      document: {
        id: documentId,
        status,
        reviewNote: reviewNote || null,
      },
    });
  } catch (error) {
    console.error("ADMIN_DOCUMENT_REVIEW_ERROR:", error);

    return res.status(500).json({
      message: "Server error while reviewing the document",
    });
  }
});

/* =========================
   Download from Supabase
========================= */

router.get("/:documentId/download", async (req, res) => {
  try {
    const documentId = cleanPositiveInteger(
      req.params.documentId
    );

    if (!documentId) {
      return res.status(400).json({
        message: "Invalid document ID",
      });
    }

    const [documents] = await pool.query(
      `
      SELECT
        id,
        original_name,
        file_path,
        mime_type,
        file_size
      FROM application_documents
      WHERE id = ?
      LIMIT 1
      `,
      [documentId]
    );

    if (documents.length === 0) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const document = documents[0];
    const storagePath = normalizeStoragePath(
      document.file_path
    );

    if (!storagePath) {
      return res.status(404).json({
        message: "The document storage path is missing",
      });
    }

    if (storagePath.startsWith("uploads/")) {
      return res.status(409).json({
        message:
          "This is a legacy locally stored file. Upload it again so it is saved in Supabase.",
      });
    }

    const {
      data: storedFile,
      error: downloadError,
    } = await supabaseAdmin.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .download(storagePath);

    if (downloadError || !storedFile) {
      console.error(
        "ADMIN_SUPABASE_DOCUMENT_DOWNLOAD_ERROR:",
        {
          documentId,
          storagePath,
          downloadError,
        }
      );

      return res.status(404).json({
        message:
          downloadError?.message ||
          "The document could not be found in Supabase Storage",
      });
    }

    const fileBuffer = Buffer.from(
      await storedFile.arrayBuffer()
    );

    res.setHeader(
      "Cache-Control",
      "private, no-store, max-age=0"
    );

    res.setHeader("Pragma", "no-cache");

    res.setHeader(
      "Content-Type",
      document.mime_type ||
        storedFile.type ||
        "application/octet-stream"
    );

    res.setHeader(
      "Content-Length",
      String(fileBuffer.length)
    );

    res.attachment(
      document.original_name ||
        `document-${documentId}`
    );

    return res.send(fileBuffer);
  } catch (error) {
    console.error("ADMIN_DOCUMENT_DOWNLOAD_ERROR:", error);

    if (res.headersSent) {
      return res.end();
    }

    return res.status(500).json({
      message: "Server error while downloading the document",
    });
  }
});

export default router;
