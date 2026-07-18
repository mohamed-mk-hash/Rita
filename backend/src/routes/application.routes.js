import express from "express";
import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

const allowedServiceTypes = [
  "us_llc",
  "ein_assistance",
  "banking_payment_setup",
  "compliance_support",
];

/*
  حساب التقدم الديناميكي:

  10%  عند إرسال الطلب
  +40% حسب عدد الوثائق المطلوبة التي تم رفعها
  +30% حسب عدد الوثائق المطلوبة التي تمت الموافقة عليها
  80%  على الأقل عندما تصبح الحالة processing
  100% عندما تصبح الحالة completed

  نبقي أيضاً على قيمة progress المخزنة في applications إذا كانت أكبر،
  حتى يستطيع فريق الإدارة رفع التقدم في المراحل اللاحقة.
*/
async function attachDynamicProgress(applications, database = pool) {
  if (!Array.isArray(applications) || applications.length === 0) {
    return applications || [];
  }

  const applicationIds = applications
    .map((application) => Number(application.id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (applicationIds.length === 0) {
    return applications;
  }

  const placeholders = applicationIds.map(() => "?").join(", ");

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
    const required = Number(row.required_count || 0);
    const uploaded = Number(row.uploaded_count || 0);
    const approved = Number(row.approved_count || 0);

    const uploadRatio =
      required > 0 ? Math.min(uploaded / required, 1) : 0;

    const approvalRatio =
      required > 0 ? Math.min(approved / required, 1) : 0;

    const calculatedProgress =
      10 +
      Math.round(uploadRatio * 40) +
      Math.round(approvalRatio * 30);

    progressMap.set(Number(row.application_id), {
      required,
      uploaded,
      approved,
      calculatedProgress,
    });
  }

  return applications.map((application) => {
    const documentData = progressMap.get(Number(application.id)) || {
      required: 0,
      uploaded: 0,
      approved: 0,
      calculatedProgress: 10,
    };

    const storedProgress = Number(application.progress || 0);

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

    progress = Math.max(0, Math.min(progress, 100));

    return {
      ...application,
      progress,
      documentProgress: {
        required: documentData.required,
        uploaded: documentData.uploaded,
        approved: documentData.approved,
      },
    };
  });
}

function cleanApplication(row) {
  return {
    id: row.id,
    userId: row.user_id,
    serviceType: row.service_type,
    status: row.status,
    currentStep: row.current_step,
    progress: Number(row.progress || 0),
    documentProgress: row.documentProgress || {
      required: 0,
      uploaded: 0,
      approved: 0,
    },
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,

    intake: row.intake_id
      ? {
          id: row.intake_id,
          phone: row.phone,
          country: row.country,
          businessActivity: row.business_activity,
          desiredCompanyName: row.desired_company_name,

          needsEin: Boolean(row.needs_ein),
          needsStripe: Boolean(row.needs_stripe),
          needsPaypal: Boolean(row.needs_paypal),
          needsWise: Boolean(row.needs_wise),
          needsMercury: Boolean(row.needs_mercury),
          needsRelay: Boolean(row.needs_relay),
          needsPayoneer: Boolean(row.needs_payoneer),
          needsShopify: Boolean(row.needs_shopify),

          extraNotes: row.extra_notes,
        }
      : null,
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

  LEFT JOIN application_intake ai
    ON ai.application_id = a.id
`;

/* =====================================
   GET logged-in user's applications
===================================== */

router.get("/my", requireAuth, async (req, res) => {
  try {
    const [applications] = await pool.query(
      `
      ${applicationSelect}

      WHERE a.user_id = ?

      ORDER BY a.created_at DESC
      `,
      [req.user.id]
    );

    const applicationsWithProgress =
      await attachDynamicProgress(applications);

    const cleanedApplications =
      applicationsWithProgress.map(cleanApplication);

    const activeApplication =
      cleanedApplications.find(
        (application) =>
          !["completed", "rejected"].includes(application.status)
      ) ||
      cleanedApplications[0] ||
      null;

    return res.json({
      applications: cleanedApplications,
      activeApplication,
    });
  } catch (error) {
    console.error("GET_MY_APPLICATIONS_ERROR:", error);

    return res.status(500).json({
      message: "Server error while loading applications",
    });
  }
});

/* =====================================
   CREATE a new application
===================================== */

router.post("/", requireAuth, async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      serviceType,
      phone,
      country,
      businessActivity,
      desiredCompanyName,

      needsEin,
      needsStripe,
      needsPaypal,
      needsWise,
      needsMercury,
      needsRelay,
      needsPayoneer,
      needsShopify,

      extraNotes,
    } = req.body;

    if (!serviceType) {
      return res.status(400).json({
        message: "Service type is required",
      });
    }

    if (!allowedServiceTypes.includes(serviceType)) {
      return res.status(400).json({
        message: "Invalid service type",
      });
    }

    await connection.beginTransaction();

    const [insertApplicationResult] = await connection.query(
      `
      INSERT INTO applications (
        user_id,
        service_type,
        status,
        current_step,
        progress,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        req.user.id,
        serviceType,
        "submitted",
        "intake_submitted",
        10,
        extraNotes?.trim() || null,
      ]
    );

    const applicationId = insertApplicationResult.insertId;

    await connection.query(
      `
      INSERT INTO application_intake (
        application_id,
        user_id,
        phone,
        country,
        business_activity,
        desired_company_name,

        needs_ein,
        needs_stripe,
        needs_paypal,
        needs_wise,
        needs_mercury,
        needs_relay,
        needs_payoneer,
        needs_shopify,

        extra_notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        applicationId,
        req.user.id,
        phone?.trim() || null,
        country?.trim() || null,
        businessActivity?.trim() || null,
        desiredCompanyName?.trim() || null,

        needsEin ? 1 : 0,
        needsStripe ? 1 : 0,
        needsPaypal ? 1 : 0,
        needsWise ? 1 : 0,
        needsMercury ? 1 : 0,
        needsRelay ? 1 : 0,
        needsPayoneer ? 1 : 0,
        needsShopify ? 1 : 0,

        extraNotes?.trim() || null,
      ]
    );

    await connection.commit();

    const [applications] = await pool.query(
      `
      ${applicationSelect}

      WHERE a.id = ?

      LIMIT 1
      `,
      [applicationId]
    );

    const applicationsWithProgress =
      await attachDynamicProgress(applications);

    return res.status(201).json({
      message: "Application created successfully",
      application: cleanApplication(applicationsWithProgress[0]),
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error("CREATE_APPLICATION_ROLLBACK_ERROR:", rollbackError);
    }

    console.error("CREATE_APPLICATION_ERROR:", error);

    return res.status(500).json({
      message: "Server error while creating application",
    });
  } finally {
    connection.release();
  }
});

/* =====================================
   GET one application
===================================== */

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const applicationId = Number(req.params.id);

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      return res.status(400).json({
        message: "Invalid application ID",
      });
    }

    const [applications] = await pool.query(
      `
      ${applicationSelect}

      WHERE a.id = ?

      LIMIT 1
      `,
      [applicationId]
    );

    if (applications.length === 0) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    const applicationsWithProgress =
      await attachDynamicProgress(applications);

    const application = applicationsWithProgress[0];

    const isOwner =
      Number(application.user_id) === Number(req.user.id);

    const isAdmin =
      req.user.role === "admin" ||
      req.user.role === "staff";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You do not have permission to view this application",
      });
    }

    return res.json({
      application: cleanApplication(application),
    });
  } catch (error) {
    console.error("GET_APPLICATION_ERROR:", error);

    return res.status(500).json({
      message: "Server error while loading application",
    });
  }
});

export default router;
