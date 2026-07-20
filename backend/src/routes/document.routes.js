import crypto from "crypto";
import path from "path";
import express from "express";
import multer from "multer";

import { pool } from "../config/db.js";
import {
  supabaseAdmin,
  SUPABASE_STORAGE_BUCKET,
} from "../config/supabase.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const allowedExtensions = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
]);

/*
  These are the default important documents for every service.
  They are inserted automatically only after the admin changes the
  application to a document-requesting workflow/status.
*/
const DEFAULT_DOCUMENT_REQUIREMENTS = {
  us_llc: [
    {
      documentCode: "us_llc_passport",
      titleEn: "Passport copy",
      titleAr: "نسخة من جواز السفر",
      descriptionEn:
        "Upload a clear copy of the passport information page.",
      descriptionAr:
        "ارفع نسخة واضحة من صفحة المعلومات في جواز السفر.",
      required: true,
      sortOrder: 1,
      maxSizeMb: 5,
    },
    {
      documentCode: "us_llc_proof_of_address",
      titleEn: "Proof of address",
      titleAr: "إثبات العنوان",
      descriptionEn:
        "Upload a recent utility bill, bank statement, or official document showing your address.",
      descriptionAr:
        "ارفع فاتورة خدمات حديثة أو كشف حساب بنكي أو وثيقة رسمية تظهر عنوانك.",
      required: true,
      sortOrder: 2,
      maxSizeMb: 5,
    },
  ],

  ein_assistance: [
    {
      documentCode: "ein_assistance_passport",
      titleEn: "Passport copy",
      titleAr: "نسخة من جواز السفر",
      descriptionEn:
        "Upload a clear copy of the passport information page.",
      descriptionAr:
        "ارفع نسخة واضحة من صفحة المعلومات في جواز السفر.",
      required: true,
      sortOrder: 1,
      maxSizeMb: 5,
    },
    {
      documentCode: "ein_company_formation_document",
      titleEn: "Company formation document",
      titleAr: "وثيقة تأسيس الشركة",
      descriptionEn:
        "Upload the company formation certificate or Articles of Organization.",
      descriptionAr:
        "ارفع شهادة تأسيس الشركة أو وثيقة Articles of Organization.",
      required: true,
      sortOrder: 2,
      maxSizeMb: 5,
    },
  ],

  banking_payment_setup: [
    {
      documentCode: "banking_passport",
      titleEn: "Passport copy",
      titleAr: "نسخة من جواز السفر",
      descriptionEn:
        "Upload a clear copy of the passport information page.",
      descriptionAr:
        "ارفع نسخة واضحة من صفحة المعلومات في جواز السفر.",
      required: true,
      sortOrder: 1,
      maxSizeMb: 5,
    },
    {
      documentCode: "banking_proof_of_address",
      titleEn: "Proof of address",
      titleAr: "إثبات العنوان",
      descriptionEn:
        "Upload a recent document showing your residential address.",
      descriptionAr:
        "ارفع وثيقة حديثة تظهر عنوان إقامتك.",
      required: true,
      sortOrder: 2,
      maxSizeMb: 5,
    },
    {
      documentCode: "banking_formation_document",
      titleEn: "Company formation document",
      titleAr: "وثيقة تأسيس الشركة",
      descriptionEn:
        "Upload the company formation certificate or Articles of Organization.",
      descriptionAr:
        "ارفع شهادة تأسيس الشركة أو وثيقة Articles of Organization.",
      required: true,
      sortOrder: 3,
      maxSizeMb: 5,
    },
    {
      documentCode: "banking_ein_letter",
      titleEn: "EIN confirmation letter",
      titleAr: "خطاب تأكيد EIN",
      descriptionEn:
        "Upload the EIN confirmation letter issued for the company.",
      descriptionAr:
        "ارفع خطاب تأكيد EIN الصادر للشركة.",
      required: true,
      sortOrder: 4,
      maxSizeMb: 5,
    },
  ],

  compliance_support: [
    {
      documentCode: "compliance_formation_document",
      titleEn: "Company formation document",
      titleAr: "وثيقة تأسيس الشركة",
      descriptionEn:
        "Upload the company formation certificate or Articles of Organization.",
      descriptionAr:
        "ارفع شهادة تأسيس الشركة أو وثيقة Articles of Organization.",
      required: true,
      sortOrder: 1,
      maxSizeMb: 5,
    },
    {
      documentCode: "compliance_ein_letter",
      titleEn: "EIN confirmation letter",
      titleAr: "خطاب تأكيد EIN",
      descriptionEn:
        "Upload the EIN confirmation letter issued for the company.",
      descriptionAr:
        "ارفع خطاب تأكيد EIN الصادر للشركة.",
      required: true,
      sortOrder: 2,
      maxSizeMb: 5,
    },
    {
      documentCode: "compliance_previous_report",
      titleEn: "Previous compliance document",
      titleAr: "وثيقة امتثال سابقة",
      descriptionEn:
        "Upload a previous annual report or compliance notice, if available.",
      descriptionAr:
        "ارفع تقريرًا سنويًا سابقًا أو إشعار امتثال إن كان متوفرًا.",
      required: false,
      sortOrder: 3,
      maxSizeMb: 5,
    },
  ],
};

const DOCUMENT_VISIBLE_STEPS = new Set([
  "document_review",
  "waiting_required_documents",
  "document_corrections_required",
  "documents_approved",
  "preparing_filing",
  "filing_submitted",
  "ein_processing",
  "banking_setup",
  "compliance_review",
  "completed",
]);

const upload = multer({
  storage: multer.memoryStorage(),
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

function shouldShowDocuments(application) {
  if (!application) {
    return false;
  }

  if (
    ["waiting_documents", "processing", "completed"].includes(
      application.status
    )
  ) {
    return true;
  }

  return DOCUMENT_VISIBLE_STEPS.has(application.current_step);
}

function createStoragePath({
  userId,
  applicationId,
  requirementId,
  originalName,
}) {
  const extension = path.extname(originalName).toLowerCase();
  const generatedName = `${Date.now()}-${crypto.randomUUID()}${extension}`;

  return [
    `user-${userId}`,
    `application-${applicationId}`,
    `requirement-${requirementId}`,
    generatedName,
  ].join("/");
}

async function deleteStoredFileSafely(filePath) {
  if (!filePath) {
    return;
  }

  try {
    const { error } = await supabaseAdmin.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error("DELETE_SUPABASE_FILE_ERROR:", error);
    }
  } catch (error) {
    console.error("DELETE_SUPABASE_FILE_ERROR:", error);
  }
}

async function ensureDefaultDocumentRequirements(serviceType) {
  const requirements = DEFAULT_DOCUMENT_REQUIREMENTS[serviceType] || [];

  for (const requirement of requirements) {
    const [existingRows] = await pool.query(
      `
      SELECT id
      FROM document_requirements
      WHERE service_type = ?
        AND document_code = ?
      LIMIT 1
      `,
      [serviceType, requirement.documentCode]
    );

    if (existingRows.length > 0) {
      /*
        If an older row exists but was disabled, reactivate and update it.
      */
      await pool.query(
        `
        UPDATE document_requirements
        SET
          title_en = ?,
          title_ar = ?,
          description_en = ?,
          description_ar = ?,
          is_required = ?,
          sort_order = ?,
          accepted_types = ?,
          max_size_mb = ?,
          is_active = 1
        WHERE id = ?
        `,
        [
          requirement.titleEn,
          requirement.titleAr,
          requirement.descriptionEn,
          requirement.descriptionAr,
          requirement.required ? 1 : 0,
          requirement.sortOrder,
          "application/pdf,image/jpeg,image/png",
          requirement.maxSizeMb,
          existingRows[0].id,
        ]
      );

      continue;
    }

    await pool.query(
      `
      INSERT INTO document_requirements (
        service_type,
        document_code,
        title_en,
        title_ar,
        description_en,
        description_ar,
        is_required,
        sort_order,
        accepted_types,
        max_size_mb,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `,
      [
        serviceType,
        requirement.documentCode,
        requirement.titleEn,
        requirement.titleAr,
        requirement.descriptionEn,
        requirement.descriptionAr,
        requirement.required ? 1 : 0,
        requirement.sortOrder,
        "application/pdf,image/jpeg,image/png",
        requirement.maxSizeMb,
      ]
    );
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
      SELECT
        id,
        user_id,
        service_type,
        status,
        current_step
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
        : 0,
    approvalProgress:
      requiredDocuments.length > 0
        ? Math.round((approvedRequired / requiredDocuments.length) * 100)
        : 0,
  };
}

function runUpload(req, res, next) {
  upload.single("document")(req, res, (error) => {
    if (!error) {
      return next();
    }

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

/* =========================
   Get application documents
========================= */

router.get(
  "/application/:applicationId",
  requireAuth,
  loadApplication,
  async (req, res) => {
    try {
      const application = req.applicationRecord;
      const documentRequestActive = shouldShowDocuments(application);

      if (!documentRequestActive) {
        const documents = [];

        return res.json({
          application: {
            id: application.id,
            serviceType: application.service_type,
            status: application.status,
            currentStep: application.current_step,
          },
          documentRequestActive: false,
          documents,
          summary: buildSummary(documents),
        });
      }

      await ensureDefaultDocumentRequirements(application.service_type);

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
          currentStep: application.current_step,
        },
        documentRequestActive: true,
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

/* =========================
   Upload document to Supabase
========================= */

router.post(
  "/application/:applicationId/requirement/:requirementId/upload",
  requireAuth,
  loadApplication,
  runUpload,
  async (req, res) => {
    let connection = null;
    let newStoragePath = null;
    let databaseCommitted = false;

    try {
      const application = req.applicationRecord;

      if (!shouldShowDocuments(application)) {
        return res.status(409).json({
          message: "Documents have not been requested for this application yet",
        });
      }

      const requirementId = cleanInteger(req.params.requirementId);

      if (!requirementId) {
        return res.status(400).json({ message: "Invalid requirement ID" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Choose a file to upload" });
      }

      await ensureDefaultDocumentRequirements(application.service_type);

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
        return res.status(404).json({
          message: "Document requirement not found for this service",
        });
      }

      const requirement = requirements[0];
      const requirementMaxBytes =
        Number(requirement.max_size_mb || 5) * 1024 * 1024;

      if (req.file.size > requirementMaxBytes) {
        return res.status(400).json({
          message: `The file is larger than ${
            requirement.max_size_mb || 5
          } MB`,
        });
      }

      newStoragePath = createStoragePath({
        userId: req.user.id,
        applicationId: application.id,
        requirementId,
        originalName: req.file.originalname,
      });

      const { error: uploadError } = await supabaseAdmin.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .upload(newStoragePath, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: "0",
          upsert: false,
        });

      if (uploadError) {
        console.error("SUPABASE_UPLOAD_ERROR:", uploadError);
        throw new Error(uploadError.message || "Could not upload file");
      }

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

      const previousStoragePath = existingRows[0]?.file_path || null;
      const storedName = path.posix.basename(newStoragePath);

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
          storedName,
          newStoragePath,
          req.file.mimetype,
          req.file.size,
        ]
      );

      const documentId = saveResult.insertId;

      await connection.commit();
      databaseCommitted = true;

      if (
        previousStoragePath &&
        previousStoragePath !== newStoragePath
      ) {
        await deleteStoredFileSafely(previousStoragePath);
      }

      return res.status(201).json({
        message: "Document uploaded successfully",
        documentId,
      });
    } catch (error) {
      if (connection && !databaseCommitted) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error("DOCUMENT_UPLOAD_ROLLBACK_ERROR:", rollbackError);
        }
      }

      if (newStoragePath && !databaseCommitted) {
        await deleteStoredFileSafely(newStoragePath);
      }

      console.error("UPLOAD_APPLICATION_DOCUMENT_ERROR:", error);
      return res.status(500).json({
        message: "Server error while uploading the document",
      });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
);

/* =========================
   Download document
========================= */

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
        ad.mime_type,
        ad.file_size,
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

    const { data: storedFile, error: downloadError } =
      await supabaseAdmin.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .download(document.file_path);

    if (downloadError || !storedFile) {
      console.error("SUPABASE_DOWNLOAD_ERROR:", downloadError);
      return res.status(404).json({ message: "Stored file not found" });
    }

    const fileBuffer = Buffer.from(await storedFile.arrayBuffer());

    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader(
      "Content-Type",
      document.mime_type || "application/octet-stream"
    );
    res.setHeader("Content-Length", String(fileBuffer.length));
    res.attachment(document.original_name);

    return res.send(fileBuffer);
  } catch (error) {
    console.error("DOWNLOAD_APPLICATION_DOCUMENT_ERROR:", error);
    return res.status(500).json({
      message: "Server error while downloading the document",
    });
  }
});

/* =========================
   Delete document
========================= */

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
      "DELETE FROM application_documents WHERE id = ?",
      [documentId]
    );

    await connection.commit();
    await deleteStoredFileSafely(document.file_path);

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
    if (connection) {
      connection.release();
    }
  }
});

export default router;
