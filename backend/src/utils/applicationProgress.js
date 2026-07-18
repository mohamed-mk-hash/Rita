import { pool } from "../config/db.js";

/*
  توزيع التقدم:

  إرسال الطلب                       = 10%
  رفع جميع الوثائق المطلوبة         = +40%
  قبول جميع الوثائق المطلوبة        = +30%
  دخول الطلب مرحلة المعالجة         = 80% على الأقل
  اكتمال الطلب                      = 100%
*/

export async function addDynamicProgress(
  applications,
  database = pool
) {
  if (!Array.isArray(applications)) {
    return [];
  }

  if (applications.length === 0) {
    return [];
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
        CASE
          WHEN dr.is_required = 1
          THEN 1
        END
      ) AS required_count,

      SUM(
        CASE
          WHEN
            dr.is_required = 1
            AND ad.id IS NOT NULL
            AND ad.original_name IS NOT NULL
          THEN 1
          ELSE 0
        END
      ) AS uploaded_count,

      SUM(
        CASE
          WHEN
            dr.is_required = 1
            AND ad.status = 'approved'
          THEN 1
          ELSE 0
        END
      ) AS approved_count

    FROM applications a

    LEFT JOIN document_requirements dr
      ON dr.service_type = a.service_type

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
    const requiredCount = Number(
      row.required_count || 0
    );

    const uploadedCount = Number(
      row.uploaded_count || 0
    );

    const approvedCount = Number(
      row.approved_count || 0
    );

    const uploadPercentage =
      requiredCount > 0
        ? uploadedCount / requiredCount
        : 0;

    const approvalPercentage =
      requiredCount > 0
        ? approvedCount / requiredCount
        : 0;

    const documentProgress =
      10 +
      Math.round(uploadPercentage * 40) +
      Math.round(approvalPercentage * 30);

    progressMap.set(
      Number(row.application_id),
      {
        requiredCount,
        uploadedCount,
        approvedCount,
        documentProgress,
      }
    );
  }

  return applications.map((application) => {
    const storedProgress = Number(
      application.progress || 0
    );

    const documentData = progressMap.get(
      Number(application.id)
    ) || {
      requiredCount: 0,
      uploadedCount: 0,
      approvedCount: 0,
      documentProgress: 10,
    };

    let progress = Math.max(
      storedProgress,
      documentData.documentProgress
    );

    /*
      عندما يبدأ فريق Rita معالجة الطلب،
      لا يجب أن يكون التقدم أقل من 80%.
    */
    if (application.status === "processing") {
      progress = Math.max(progress, 80);
    }

    /*
      الطلب المكتمل دائماً 100%.
    */
    if (application.status === "completed") {
      progress = 100;
    }

    /*
      حماية من القيم الأكبر من 100.
    */
    progress = Math.min(progress, 100);

    return {
      ...application,
      progress,

      documentProgress: {
        required: documentData.requiredCount,
        uploaded: documentData.uploadedCount,
        approved: documentData.approvedCount,
      },
    };
  });
}