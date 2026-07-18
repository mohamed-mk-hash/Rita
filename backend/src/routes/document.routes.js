import crypto from "crypto";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import multer from "multer";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "../..");
const uploadRoot = path.join(backendRoot, "uploads", "documents");

fs.mkdirSync(uploadRoot, { recursive: true });

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);
const allowedExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png"]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadRoot);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (
      !allowedMimeTypes.has(file.mimetype) ||
      !allowedExtensions.has(extension)
    ) {
      return callback(
        new multer.MulterError(
          "LIMIT_UNEXPECTED_FILE",
          "Only PDF, JPG, JPEG, and PNG files are allowed"
        )
      );
    }

    return callback(null, true);
  },
});

function isAdminOrStaff(user) {
  return user?.role === "admin" || user?.role === "staff";
}

function cleanInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function normalizeStoredPath(filePath) {
  return String(filePath || "").replaceAll("\\", "/");
}

function absoluteStoredPath(filePath) {
  const normalized = normalizeStoredPath(filePath);
  const absolutePath = path.resolve(backendRoot, normalized);
  const normalizedUploadRoot = `${path.resolve(uploadRoot)}${path.sep}`;

  if (
    absolutePath !== path.resolve(uploadRoot) &&
    !absolutePath.startsWith(normalizedUploadRoot)
  ) {
    return null;
  }

  return absolutePath;
}

async function deleteFileSafely(filePath) {
  if (!filePath) return;

  const absolutePath = absoluteStoredPath(filePath);
  if (!absolutePath) return;

  try {
    await fsPromises.unlink(absolutePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("DELETE_DOCUMENT_FILE_ERROR:", error);
    }
  }
}

async function loadApplication(req, res, next) {
  try {
    const applicationId = cleanInteger(req.params.applicationId);

    if (!applicationId) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    const [applications] = await pool.query(
      `
      SELECT id, user_id, service_type, status
      FROM applications
      WHERE id = ?
      LIMIT 1
      `,
      [applicationId]
    );

    if (applications.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    const application = applications[0];
    const isOwner = Number(application.user_id) === Number(req.user.id);

    if (!isOwner && !isAdminOrStaff(req.user)) {
      return res.status(403).json({
        message: "You do not have permission to access these documents",
      });
    }

    req.applicationRecord = application;
    return next();
  } catch (error) {
    console.error("LOAD_DOCUMENT_APPLICATION_ERROR:", error);
    return res.status(500).json({
      message: "Server error while checking the application",
    });
  }
}

function cleanDocumentRow(row) {
  const hasUploadedFile = Boolean(row.document_id && row.file_path);

  return {
    requirementId: row.requirement_id,
    documentId: hasUploadedFile ? row.document_id : null,
    code: row.document_code,
    titleEn: row.title_en,
    titleAr: row.title_ar,
    descriptionEn: row.description_en,
    descriptionAr: row.description_ar,
    required: Boolean(row.is_required),
    sortOrder: row.sort_order,
    acceptedTypes: row.accepted_types,
    maxSizeMb: row.max_size_mb,
    status: hasUploadedFile ? row.document_status : "missing",
    originalName: hasUploadedFile ? row.original_name : null,
    mimeType: hasUploadedFile ? row.mime_type : null,
    fileSize: hasUploadedFile ? row.file_size : null,
    reviewNote: hasUploadedFile ? row.review_note : null,
    uploadedAt: hasUploadedFile ? row.uploaded_at : null,
    reviewedAt: hasUploadedFile ? row.reviewed_at : null,
    canDownload: hasUploadedFile,
  };
}

function buildSummary(documents) {
  const requiredDocuments = documents.filter((document) => document.required);
  const uploadedRequired = requiredDocuments.filter(
    (document) => document.status !== "missing"
  ).length;
  const approvedRequired = requiredDocuments.filter(
    (document) => document.status === "approved"
  ).length;

  return {
    total: documents.length,
    required: requiredDocuments.length,
    uploaded: documents.filter((document) => document.status !== "missing")
      .length,
    uploadedRequired,
    approved: documents.filter((document) => document.status === "approved")
      .length,
    inReview: documents.filter(
      (document) =>
        document.status === "uploaded" || document.status === "in_review"
    ).length,
    rejected: documents.filter((document) => document.status === "rejected")
      .length,
    missing: documents.filter((document) => document.status === "missing")
      .length,
    progress:
      requiredDocuments.length > 0
        ? Math.round((uploadedRequired / requiredDocuments.length) * 100)
        : 100,
    approvalProgress:
      requiredDocuments.length > 0
        ? Math.round((approvedRequired / requiredDocuments.length) * 100)
        : 100,
  };
}

function runUpload(req, res, next) {
  upload.single("document")(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "The file is larger than 5 MB",
        });
      }

      return res.status(400).json({
        message: "Only PDF, JPG, JPEG, and PNG files are allowed",
      });
    }

    console.error("DOCUMENT_UPLOAD_MIDDLEWARE_ERROR:", error);
    return res.status(500).json({
      message: "Could not process the uploaded file",
    });
  });
}

router.get(
  "/application/:applicationId",
  requireAuth,
  loadApplication,
  async (req, res) => {
    try {
      const application = req.applicationRecord;

      const [rows] = await pool.query(
        `
        SELECT
          dr.id AS requirement_id,
          dr.document_code,
          dr.title_en,
          dr.title_ar,
          dr.description_en,
          dr.description_ar,
          dr.is_required,
          dr.sort_order,
          dr.accepted_types,
          dr.max_size_mb,

          ad.id AS document_id,
          ad.original_name,
          ad.file_path,
          ad.mime_type,
          ad.file_size,
          ad.status AS document_status,
          ad.review_note,
          ad.uploaded_at,
          ad.reviewed_at
        FROM document_requirements dr
        LEFT JOIN application_documents ad
          ON ad.requirement_id = dr.id
          AND ad.application_id = ?
        WHERE dr.service_type = ?
          AND dr.is_active = 1
        ORDER BY dr.sort_order ASC, dr.id ASC
        `,
        [application.id, application.service_type]
      );

      const documents = rows.map(cleanDocumentRow);

      return res.json({
        application: {
          id: application.id,
          serviceType: application.service_type,
          status: application.status,
        },
        documents,
        summary: buildSummary(documents),
      });
    } catch (error) {
      console.error("GET_APPLICATION_DOCUMENTS_ERROR:", error);
      return res.status(500).json({
        message: "Server error while loading documents",
      });
    }
  }
);

router.post(
  "/application/:applicationId/requirement/:requirementId/upload",
  requireAuth,
  loadApplication,
  runUpload,
  async (req, res) => {
    let connection = null;

    try {
      const application = req.applicationRecord;
      const requirementId = cleanInteger(req.params.requirementId);

      if (!requirementId) {
        if (req.file) await deleteFileSafely(req.file.path);
        return res.status(400).json({ message: "Invalid requirement ID" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Choose a file to upload" });
      }

      const [requirements] = await pool.query(
        `
        SELECT id, service_type, max_size_mb
        FROM document_requirements
        WHERE id = ?
          AND service_type = ?
          AND is_active = 1
        LIMIT 1
        `,
        [requirementId, application.service_type]
      );

      if (requirements.length === 0) {
        await deleteFileSafely(req.file.path);
        return res.status(404).json({
          message: "Document requirement not found for this service",
        });
      }

      const requirement = requirements[0];
      const requirementMaxBytes = Number(requirement.max_size_mb || 5) * 1024 * 1024;

      if (req.file.size > requirementMaxBytes) {
        await deleteFileSafely(req.file.path);
        return res.status(400).json({
          message: `The file is larger than ${requirement.max_size_mb || 5} MB`,
        });
      }

      const relativePath = normalizeStoredPath(
        path.relative(backendRoot, req.file.path)
      );

      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [existingRows] = await connection.query(
        `
        SELECT id, file_path
        FROM application_documents
        WHERE application_id = ?
          AND requirement_id = ?
        LIMIT 1
        FOR UPDATE
        `,
        [application.id, requirementId]
      );

      const previousPath = existingRows[0]?.file_path || null;

      const [saveResult] = await connection.query(
        `
        INSERT INTO application_documents (
          application_id,
          requirement_id,
          user_id,
          original_name,
          stored_name,
          file_path,
          mime_type,
          file_size,
          status,
          review_note,
          uploaded_at,
          reviewed_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_review', NULL, NOW(), NULL)
        ON DUPLICATE KEY UPDATE
          id = LAST_INSERT_ID(id),
          user_id = VALUES(user_id),
          original_name = VALUES(original_name),
          stored_name = VALUES(stored_name),
          file_path = VALUES(file_path),
          mime_type = VALUES(mime_type),
          file_size = VALUES(file_size),
          status = 'in_review',
          review_note = NULL,
          uploaded_at = NOW(),
          reviewed_at = NULL,
          updated_at = NOW()
        `,
        [
          application.id,
          requirementId,
          req.user.id,
          req.file.originalname,
          req.file.filename,
          relativePath,
          req.file.mimetype,
          req.file.size,
        ]
      );

      const documentId = saveResult.insertId;

      await connection.commit();

      if (previousPath && previousPath !== relativePath) {
        await deleteFileSafely(previousPath);
      }

      return res.status(201).json({
        message: "Document uploaded successfully",
        documentId,
      });
    } catch (error) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("DOCUMENT_UPLOAD_ROLLBACK_ERROR:", rollbackError);
        }
      }

      if (req.file) {
        await deleteFileSafely(req.file.path);
      }

      console.error("UPLOAD_APPLICATION_DOCUMENT_ERROR:", error);
      return res.status(500).json({
        message: "Server error while uploading the document",
      });
    } finally {
      if (connection) connection.release();
    }
  }
);

router.get("/:documentId/download", requireAuth, async (req, res) => {
  try {
    const documentId = cleanInteger(req.params.documentId);

    if (!documentId) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    const [documents] = await pool.query(
      `
      SELECT
        ad.id,
        ad.original_name,
        ad.file_path,
        a.user_id
      FROM application_documents ad
      INNER JOIN applications a ON a.id = ad.application_id
      WHERE ad.id = ?
      LIMIT 1
      `,
      [documentId]
    );

    if (documents.length === 0) {
      return res.status(404).json({ message: "Document not found" });
    }

    const document = documents[0];
    const isOwner = Number(document.user_id) === Number(req.user.id);

    if (!isOwner && !isAdminOrStaff(req.user)) {
      return res.status(403).json({
        message: "You do not have permission to download this document",
      });
    }

    const absolutePath = absoluteStoredPath(document.file_path);

    if (!absolutePath || !fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: "Stored file not found" });
    }

    return res.download(absolutePath, document.original_name);
  } catch (error) {
    console.error("DOWNLOAD_APPLICATION_DOCUMENT_ERROR:", error);
    return res.status(500).json({
      message: "Server error while downloading the document",
    });
  }
});

router.delete("/:documentId/file", requireAuth, async (req, res) => {
  let connection = null;

  try {
    const documentId = cleanInteger(req.params.documentId);

    if (!documentId) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [documents] = await connection.query(
      `
      SELECT
        ad.id,
        ad.file_path,
        ad.status,
        a.user_id
      FROM application_documents ad
      INNER JOIN applications a ON a.id = ad.application_id
      WHERE ad.id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [documentId]
    );

    if (documents.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Document not found" });
    }

    const document = documents[0];
    const isOwner = Number(document.user_id) === Number(req.user.id);

    if (!isOwner && !isAdminOrStaff(req.user)) {
      await connection.rollback();
      return res.status(403).json({
        message: "You do not have permission to remove this document",
      });
    }

    if (document.status === "approved" && !isAdminOrStaff(req.user)) {
      await connection.rollback();
      return res.status(409).json({
        message: "Approved documents cannot be removed",
      });
    }

    await connection.query(
      `DELETE FROM application_documents WHERE id = ?`,
      [documentId]
    );

    await connection.commit();
    await deleteFileSafely(document.file_path);

    return res.json({ message: "Document removed successfully" });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("DELETE_DOCUMENT_ROLLBACK_ERROR:", rollbackError);
      }
    }

    console.error("DELETE_APPLICATION_DOCUMENT_ERROR:", error);
    return res.status(500).json({
      message: "Server error while removing the document",
    });
  } finally {
    if (connection) connection.release();
  }
});

export default router;
