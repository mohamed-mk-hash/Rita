import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";

import { pool } from "../config/db.js";
import { requireAdmin } from "../middleware/admin.middleware.js";

const router = express.Router();

router.use(requireAdmin);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "../..");
const uploadRoot = path.resolve(
  backendRoot,
  "uploads",
  "documents"
);

const allowedApplicationStatuses = [
  "draft",
  "submitted",
  "in_review",
  "waiting_documents",
  "processing",
  "completed",
  "rejected",
];

const allowedDocumentStatuses = [
  "uploaded",
  "in_review",
  "approved",
  "rejected",
];

function cleanText(value, maxLength = 2000) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function toPositiveInteger(value) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : null;
}

function clampPagination(value, fallback, maximum) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, maximum);
}

function normalizeStoredPath(filePath) {
  return String(filePath || "").replaceAll("\\", "/");
}

function getAbsoluteDocumentPath(filePath) {
  const normalizedPath = normalizeStoredPath(filePath);

  if (!normalizedPath) {
    return null;
  }

  const absolutePath = path.resolve(
    backendRoot,
    normalizedPath
  );

  const uploadRootWithSeparator =
    `${uploadRoot}${path.sep}`;

  if (
    absolutePath !== uploadRoot &&
    !absolutePath.startsWith(
      uploadRootWithSeparator
    )
  ) {
    return null;
  }

  return absolutePath;
}

/*
  التقدم الديناميكي:

  10% عند إرسال الطلب.
  +40% بحسب الوثائق المطلوبة المرفوعة.
  +30% بحسب الوثائق المطلوبة المقبولة.
  80% على الأقل عند بدء المعالجة.
  100% عند اكتمال الطلب.

  إذا رفع Admin نسبة التقدم يدوياً، نحتفظ بالقيمة
  الأكبر بين التقدم اليدوي والتقدم المحسوب من الوثائق.
*/
async function attachDynamicProgress(
  applications,
  database = pool
) {
  if (
    !Array.isArray(applications) ||
    applications.length === 0
  ) {
    return applications || [];
  }

  const applicationIds = applications
    .map((application) => Number(application.id))
    .filter(
      (id) =>
        Number.isInteger(id) &&
        id > 0
    );

  if (applicationIds.length === 0) {
    return applications;
  }

  const placeholders = applicationIds
    .map(() => "?")
    .join(", ");

  const [progressRows] = await database.query(
    `
    SELECT
      a.id AS application_id,

      COUNT(
        DISTINCT CASE
          WHEN dr.is_required = 1
          THEN dr.id
        END
      ) AS required_count,

      COUNT(
        DISTINCT CASE
          WHEN dr.is_required = 1
            AND ad.id IS NOT NULL
          THEN dr.id
        END
      ) AS uploaded_count,

      COUNT(
        DISTINCT CASE
          WHEN dr.is_required = 1
            AND ad.status = 'approved'
          THEN dr.id
        END
      ) AS approved_count

    FROM applications a

    LEFT JOIN document_requirements dr
      ON dr.service_type COLLATE utf8mb4_unicode_ci
       = a.service_type COLLATE utf8mb4_unicode_ci
      AND dr.is_active = 1

    LEFT JOIN application_documents ad
      ON ad.application_id = a.id
      AND ad.requirement_id = dr.id

    WHERE a.id IN (${placeholders})

    GROUP BY a.id
    `,
    applicationIds
  );

  const progressMap = new Map();

  for (const row of progressRows) {
    const required = Number(
      row.required_count || 0
    );

    const uploaded = Number(
      row.uploaded_count || 0
    );

    const approved = Number(
      row.approved_count || 0
    );

    const uploadRatio =
      required > 0
        ? Math.min(uploaded / required, 1)
        : 0;

    const approvalRatio =
      required > 0
        ? Math.min(approved / required, 1)
        : 0;

    progressMap.set(
      Number(row.application_id),
      {
        required,
        uploaded,
        approved,

        calculatedProgress:
          10 +
          Math.round(uploadRatio * 40) +
          Math.round(approvalRatio * 30),
      }
    );
  }

  return applications.map((application) => {
    const documentData =
      progressMap.get(
        Number(application.id)
      ) || {
        required: 0,
        uploaded: 0,
        approved: 0,
        calculatedProgress: 10,
      };

    const storedProgress = Number(
      application.progress || 0
    );

    let progress = Math.max(
      storedProgress,
      documentData.calculatedProgress
    );

    if (application.status === "processing") {
      progress = Math.max(progress, 80);
    }

    if (application.status === "completed") {
      progress = 100;
    }

    return {
      ...application,

      progress: Math.max(
        0,
        Math.min(progress, 100)
      ),

      documentProgress: {
        required: documentData.required,
        uploaded: documentData.uploaded,
        approved: documentData.approved,
      },
    };
  });
}

function cleanApplication(application) {
  return {
    id: application.id,
    userId: application.user_id,

    serviceType: application.service_type,
    status: application.status,
    currentStep: application.current_step,
    progress: Number(
      application.progress || 0
    ),

    documentProgress:
      application.documentProgress || {
        required: 0,
        uploaded: 0,
        approved: 0,
      },

    notes: application.notes,
    createdAt: application.created_at,
    updatedAt: application.updated_at,

    client: {
      id: application.client_id,
      fullName: application.client_name,
      companyName:
        application.client_company,
      email: application.client_email,
    },

    intake: application.intake_id
      ? {
          id: application.intake_id,
          phone: application.phone,
          country: application.country,

          businessActivity:
            application.business_activity,

          desiredCompanyName:
            application.desired_company_name,

          needsEin: Boolean(
            application.needs_ein
          ),

          needsStripe: Boolean(
            application.needs_stripe
          ),

          needsPaypal: Boolean(
            application.needs_paypal
          ),

          needsWise: Boolean(
            application.needs_wise
          ),

          needsMercury: Boolean(
            application.needs_mercury
          ),

          needsRelay: Boolean(
            application.needs_relay
          ),

          needsPayoneer: Boolean(
            application.needs_payoneer
          ),

          needsShopify: Boolean(
            application.needs_shopify
          ),

          extraNotes:
            application.extra_notes,
        }
      : null,
  };
}

function cleanDocument(document) {
  return {
    id: document.id,
    applicationId:
      document.application_id,

    requirementId:
      document.requirement_id,

    originalName:
      document.original_name,

    mimeType: document.mime_type,

    fileSize: Number(
      document.file_size || 0
    ),

    status: document.status,
    reviewNote: document.review_note,
    uploadedAt: document.uploaded_at,
    reviewedAt: document.reviewed_at,

    titleEn: document.title_en,
    titleAr: document.title_ar,

    descriptionEn:
      document.description_en,

    descriptionAr:
      document.description_ar,

    isRequired: Boolean(
      document.is_required
    ),

    serviceType: document.service_type,

    client: {
      id: document.client_id,
      fullName: document.client_name,

      companyName:
        document.client_company,

      email: document.client_email,
    },
  };
}

const applicationSelect = `
  SELECT
    a.id,
    a.user_id,
    a.service_type,
    a.status,
    a.current_step,
    a.progress,
    a.notes,
    a.created_at,
    a.updated_at,

    u.id AS client_id,
    u.full_name AS client_name,
    u.company_name AS client_company,
    u.email AS client_email,

    ai.id AS intake_id,
    ai.phone,
    ai.country,
    ai.business_activity,
    ai.desired_company_name,

    ai.needs_ein,
    ai.needs_stripe,
    ai.needs_paypal,
    ai.needs_wise,
    ai.needs_mercury,
    ai.needs_relay,
    ai.needs_payoneer,
    ai.needs_shopify,

    ai.extra_notes

  FROM applications a

  INNER JOIN users u
    ON u.id = a.user_id

  LEFT JOIN application_intake ai
    ON ai.application_id = a.id
`;

/* =====================================
   GET all client applications
===================================== */

router.get(
  "/applications",
  async (_req, res) => {
    try {
      const [applications] =
        await pool.query(
          `
          ${applicationSelect}

          ORDER BY a.created_at DESC
          `
        );

      const applicationsWithProgress =
        await attachDynamicProgress(
          applications
        );

      return res.json({
        applications:
          applicationsWithProgress.map(
            cleanApplication
          ),

        total:
          applicationsWithProgress.length,
      });
    } catch (error) {
      console.error(
        "ADMIN_GET_APPLICATIONS_ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Server error while loading applications",
      });
    }
  }
);

/* =====================================
   GET one application with its documents
===================================== */

router.get(
  "/applications/:id",
  async (req, res) => {
    try {
      const applicationId =
        toPositiveInteger(req.params.id);

      if (!applicationId) {
        return res.status(400).json({
          message:
            "Invalid application ID",
        });
      }

      const [applications] =
        await pool.execute(
          `
          ${applicationSelect}

          WHERE a.id = ?

          LIMIT 1
          `,
          [applicationId]
        );

      if (applications.length === 0) {
        return res.status(404).json({
          message:
            "Application not found",
        });
      }

      const [applicationWithProgress] =
        await attachDynamicProgress(
          applications
        );

      const [documents] =
        await pool.execute(
          `
          SELECT
            dr.id AS requirement_id,
            dr.title_en,
            dr.title_ar,
            dr.description_en,
            dr.description_ar,
            dr.is_required,

            ad.id,
            ad.application_id,
            ad.original_name,
            ad.mime_type,
            ad.file_size,

            COALESCE(
              ad.status,
              'missing'
            ) AS status,

            ad.review_note,
            ad.uploaded_at,
            ad.reviewed_at

          FROM document_requirements dr

          LEFT JOIN application_documents ad
            ON ad.requirement_id = dr.id
            AND ad.application_id = ?

          WHERE
  dr.service_type = ?

            AND dr.is_active = 1

          ORDER BY
            dr.is_required DESC,
            dr.id ASC
          `,
          [
            applicationId,
            applicationWithProgress.service_type,
          ]
        );

      const application =
        cleanApplication(
          applicationWithProgress
        );

      application.documents =
        documents.map((document) => ({
          id: document.id,
          requirementId:
            document.requirement_id,

          titleEn: document.title_en,
          titleAr: document.title_ar,

          descriptionEn:
            document.description_en,

          descriptionAr:
            document.description_ar,

          isRequired: Boolean(
            document.is_required
          ),

          status: document.status,

          originalName:
            document.original_name,

          mimeType: document.mime_type,

          fileSize:
            document.file_size === null
              ? null
              : Number(
                  document.file_size
                ),

          reviewNote:
            document.review_note,

          uploadedAt:
            document.uploaded_at,

          reviewedAt:
            document.reviewed_at,
        }));

      return res.json({
        application,
      });
    } catch (error) {
      console.error(
        "ADMIN_GET_APPLICATION_ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Server error while loading application details",
      });
    }
  }
);

/* =====================================
   UPDATE one application
===================================== */

router.patch(
  "/applications/:id",
  async (req, res) => {
    try {
      const applicationId =
        toPositiveInteger(req.params.id);

      if (!applicationId) {
        return res.status(400).json({
          message:
            "Invalid application ID",
        });
      }

      const fields = [];
      const values = [];

      if (req.body?.status !== undefined) {
        const status = cleanText(
          req.body.status,
          50
        );

        if (
          !allowedApplicationStatuses.includes(
            status
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid application status",
          });
        }

        fields.push("status = ?");
        values.push(status);
      }

      if (
        req.body?.currentStep !== undefined
      ) {
        const currentStep = cleanText(
          req.body.currentStep,
          150
        );

        fields.push("current_step = ?");
        values.push(currentStep || null);
      }

      if (req.body?.notes !== undefined) {
        const notes = cleanText(
          req.body.notes,
          5000
        );

        fields.push("notes = ?");
        values.push(notes || null);
      }

      if (req.body?.progress !== undefined) {
        const progress = Number(
          req.body.progress
        );

        if (
          !Number.isInteger(progress) ||
          progress < 0 ||
          progress > 100
        ) {
          return res.status(400).json({
            message:
              "Progress must be an integer between 0 and 100",
          });
        }

        fields.push("progress = ?");
        values.push(progress);
      }

      if (fields.length === 0) {
        return res.status(400).json({
          message:
            "No valid changes were provided",
        });
      }

      const [currentRows] =
        await pool.execute(
          `
          SELECT
            id,
            status

          FROM applications

          WHERE id = ?

          LIMIT 1
          `,
          [applicationId]
        );

      if (currentRows.length === 0) {
        return res.status(404).json({
          message:
            "Application not found",
        });
      }

      /*
        completed تعني 100%.
        processing تعني 80% على الأقل.
      */
      const requestedStatus =
        req.body?.status !== undefined
          ? cleanText(
              req.body.status,
              50
            )
          : currentRows[0].status;

      const progressFieldIndex =
        fields.indexOf("progress = ?");

      if (
        requestedStatus === "completed"
      ) {
        if (progressFieldIndex >= 0) {
          values[progressFieldIndex] = 100;
        } else {
          fields.push("progress = ?");
          values.push(100);
        }
      }

      if (
        requestedStatus === "processing"
      ) {
        if (progressFieldIndex >= 0) {
          values[progressFieldIndex] =
            Math.max(
              Number(
                values[
                  progressFieldIndex
                ]
              ),
              80
            );
        } else {
          fields.push(
            "progress = GREATEST(progress, ?)"
          );

          values.push(80);
        }
      }

      values.push(applicationId);

      await pool.execute(
        `
        UPDATE applications

        SET ${fields.join(", ")}

        WHERE id = ?
        `,
        values
      );

      const [updatedRows] =
        await pool.execute(
          `
          ${applicationSelect}

          WHERE a.id = ?

          LIMIT 1
          `,
          [applicationId]
        );

      const [updatedApplication] =
        await attachDynamicProgress(
          updatedRows
        );

      return res.json({
        message:
          "Application updated successfully",

        application:
          cleanApplication(
            updatedApplication
          ),
      });
    } catch (error) {
      console.error(
        "ADMIN_UPDATE_APPLICATION_ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Server error while updating the application",
      });
    }
  }
);

/* =====================================
   GET uploaded documents for Admin
===================================== */

router.get(
  "/documents",
  async (req, res) => {
    try {
      const page = clampPagination(
        req.query.page,
        1,
        100000
      );

      const limit = clampPagination(
        req.query.limit,
        12,
        50
      );

      const offset =
        (page - 1) * limit;

      const search = cleanText(
        req.query.search,
        150
      );

      const status = cleanText(
        req.query.status,
        50
      );

      const conditions = [];
      const values = [];

      if (search) {
        const searchValue =
          `%${search}%`;

        conditions.push(
          `(
            client.full_name LIKE ?
            OR client.email LIKE ?
            OR client.company_name LIKE ?
            OR ad.original_name LIKE ?
            OR dr.title_en LIKE ?
            OR dr.title_ar LIKE ?
            OR CAST(a.id AS CHAR) LIKE ?
          )`
        );

        values.push(
          searchValue,
          searchValue,
          searchValue,
          searchValue,
          searchValue,
          searchValue,
          searchValue
        );
      }

      if (
        status &&
        allowedDocumentStatuses.includes(
          status
        )
      ) {
        conditions.push(
          "ad.status = ?"
        );

        values.push(status);
      }

      const whereClause =
        conditions.length > 0
          ? `WHERE ${conditions.join(
              " AND "
            )}`
          : "";

      const [countRows] =
        await pool.execute(
          `
          SELECT COUNT(*) AS total

          FROM application_documents ad

          INNER JOIN applications a
            ON a.id =
               ad.application_id

          INNER JOIN users client
            ON client.id =
               a.user_id

          INNER JOIN document_requirements dr
            ON dr.id =
               ad.requirement_id

          ${whereClause}
          `,
          values
        );

      const [documents] =
        await pool.execute(
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

            client.id AS client_id,
            client.full_name AS client_name,
            client.company_name AS client_company,
            client.email AS client_email

          FROM application_documents ad

          INNER JOIN applications a
            ON a.id =
               ad.application_id

          INNER JOIN users client
            ON client.id =
               a.user_id

          INNER JOIN document_requirements dr
            ON dr.id =
               ad.requirement_id

          ${whereClause}

          ORDER BY
            CASE ad.status
              WHEN 'in_review' THEN 1
              WHEN 'uploaded' THEN 2
              WHEN 'rejected' THEN 3
              WHEN 'approved' THEN 4
              ELSE 5
            END,

            ad.uploaded_at ASC,
            ad.id DESC

          LIMIT ${limit}
          OFFSET ${offset}
          `,
          values
        );

      const [statRows] =
        await pool.query(
          `
          SELECT
            COUNT(*) AS total,

            SUM(
              status = 'uploaded'
            ) AS uploaded,

            SUM(
              status = 'in_review'
            ) AS in_review,

            SUM(
              status = 'approved'
            ) AS approved,

            SUM(
              status = 'rejected'
            ) AS rejected

          FROM application_documents
          `
        );

      const total = Number(
        countRows[0]?.total || 0
      );

      const stats =
        statRows[0] || {};

      return res.json({
        documents:
          documents.map(cleanDocument),

        stats: {
          total: Number(
            stats.total || 0
          ),

          uploaded: Number(
            stats.uploaded || 0
          ),

          inReview: Number(
            stats.in_review || 0
          ),

          approved: Number(
            stats.approved || 0
          ),

          rejected: Number(
            stats.rejected || 0
          ),
        },

        pagination: {
          page,
          limit,
          total,

          totalPages: Math.max(
            1,
            Math.ceil(total / limit)
          ),
        },
      });
    } catch (error) {
      console.error(
        "ADMIN_DOCUMENTS_ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Server error while loading documents",
      });
    }
  }
);

/* =====================================
   REVIEW one uploaded document
===================================== */

router.patch(
  "/documents/:id/review",
  async (req, res) => {
    const connection =
      await pool.getConnection();

    try {
      const documentId =
        toPositiveInteger(
          req.params.id
        );

      const status = cleanText(
        req.body?.status,
        50
      );

      const reviewNote = cleanText(
        req.body?.reviewNote,
        2000
      );

      if (!documentId) {
        return res.status(400).json({
          message:
            "Invalid document ID",
        });
      }

      if (
        ![
          "approved",
          "rejected",
        ].includes(status)
      ) {
        return res.status(400).json({
          message:
            "Document status must be approved or rejected",
        });
      }

      if (
        status === "rejected" &&
        !reviewNote
      ) {
        return res.status(400).json({
          message:
            "A review note is required when rejecting a document",
        });
      }

      await connection.beginTransaction();

      const [documentRows] =
        await connection.execute(
          `
          SELECT
            ad.id,
            ad.application_id,

            ad.status AS
              old_document_status,

            a.status AS
              application_status

          FROM application_documents ad

          INNER JOIN applications a
            ON a.id =
               ad.application_id

          WHERE ad.id = ?

          LIMIT 1

          FOR UPDATE
          `,
          [documentId]
        );

      if (
        documentRows.length === 0
      ) {
        await connection.rollback();

        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      const currentDocument =
        documentRows[0];

      if (
        currentDocument.application_status ===
        "completed"
      ) {
        await connection.rollback();

        return res.status(409).json({
          message:
            "Documents of a completed application cannot be changed",
        });
      }

      await connection.execute(
        `
        UPDATE application_documents

        SET
          status = ?,
          review_note = ?,
          reviewed_at = NOW()

        WHERE id = ?
        `,
        [
          status,
          reviewNote || null,
          documentId,
        ]
      );

      const [reviewRows] =
        await connection.execute(
          `
          SELECT
            COUNT(
              DISTINCT CASE
                WHEN dr.is_required = 1
                THEN dr.id
              END
            ) AS required_count,

            COUNT(
              DISTINCT CASE
                WHEN dr.is_required = 1
                  AND ad.id IS NOT NULL
                THEN dr.id
              END
            ) AS uploaded_required_count,

            COUNT(
              DISTINCT CASE
                WHEN dr.is_required = 1
                  AND ad.status = 'approved'
                THEN dr.id
              END
            ) AS approved_required_count,

            COUNT(
              DISTINCT CASE
                WHEN dr.is_required = 1
                  AND ad.status = 'rejected'
                THEN dr.id
              END
            ) AS rejected_required_count

          FROM applications a

          LEFT JOIN document_requirements dr
            ON dr.service_type = a.service_type
            AND dr.is_active = 1

          LEFT JOIN application_documents ad
            ON ad.application_id = a.id
            AND ad.requirement_id = dr.id

          WHERE a.id = ?

          GROUP BY a.id
          `,
          [
            currentDocument.application_id,
          ]
        );

      const summary =
        reviewRows[0] || {};

      const requiredCount = Number(
        summary.required_count || 0
      );

      const uploadedCount = Number(
        summary.uploaded_required_count || 0
      );

      const approvedCount = Number(
        summary.approved_required_count || 0
      );

      const rejectedCount = Number(
        summary.rejected_required_count || 0
      );

      let applicationStatus =
        "in_review";

      let currentStep =
        "document_review";

      if (rejectedCount > 0) {
        applicationStatus =
          "waiting_documents";

        currentStep =
          "document_corrections_required";
      } else if (
        requiredCount > 0 &&
        approvedCount >= requiredCount
      ) {
        applicationStatus =
          "processing";

        currentStep =
          "documents_approved";
      } else if (
        requiredCount > 0 &&
        uploadedCount < requiredCount
      ) {
        applicationStatus =
          "waiting_documents";

        currentStep =
          "waiting_required_documents";
      }

      await connection.execute(
        `
        UPDATE applications

        SET
          status = ?,
          current_step = ?

        WHERE id = ?
        `,
        [
          applicationStatus,
          currentStep,
          currentDocument.application_id,
        ]
      );

      await connection.commit();

      return res.json({
        message:
          status === "approved"
            ? "Document approved successfully"
            : "Document rejected successfully",

        document: {
          id: documentId,
          status,
          reviewNote:
            reviewNote || null,
        },

        application: {
          id:
            currentDocument.application_id,

          status:
            applicationStatus,

          currentStep,
        },

        documentProgress: {
          required:
            requiredCount,

          uploaded:
            uploadedCount,

          approved:
            approvedCount,

          rejected:
            rejectedCount,
        },
      });
    } catch (error) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "ADMIN_DOCUMENT_REVIEW_ROLLBACK_ERROR:",
          rollbackError
        );
      }

      console.error(
        "ADMIN_REVIEW_DOCUMENT_ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Server error while reviewing the document",
      });
    } finally {
      connection.release();
    }
  }
);

/* =====================================
   DOWNLOAD one document securely
===================================== */

router.get(
  "/documents/:id/download",
  async (req, res) => {
    try {
      const documentId =
        toPositiveInteger(
          req.params.id
        );

      if (!documentId) {
        return res.status(400).json({
          message:
            "Invalid document ID",
        });
      }

      const [documents] =
        await pool.execute(
          `
          SELECT
            original_name,
            file_path

          FROM application_documents

          WHERE id = ?

          LIMIT 1
          `,
          [documentId]
        );

      if (
        documents.length === 0
      ) {
        return res.status(404).json({
          message:
            "Document not found",
        });
      }

      const document =
        documents[0];

      const absolutePath =
        getAbsoluteDocumentPath(
          document.file_path
        );

      if (
        !absolutePath ||
        !fs.existsSync(absolutePath)
      ) {
        return res.status(404).json({
          message:
            "The stored document file was not found",
        });
      }

      return res.download(
        absolutePath,

        document.original_name ||
          `document-${crypto.randomUUID()}`
      );
    } catch (error) {
      console.error(
        "ADMIN_DOWNLOAD_DOCUMENT_ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Server error while downloading the document",
      });
    }
  }
);

export default router;
