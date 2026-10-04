import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../firebase";

export type AdminApplicationStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "waiting_documents"
  | "processing"
  | "completed"
  | "rejected";

export type AdminServiceType =
  | "us_llc"
  | "ein_assistance"
  | "banking_payment_setup"
  | "compliance_support";

export type ApplicationDocumentStatus =
  | "missing"
  | "uploaded"
  | "in_review"
  | "approved"
  | "rejected";

export interface AdminApplicationDocument {
  /**
   * Value stored in the document's `id` field, when one exists.
   * The Firestore document id is kept separately in `firestoreId`.
   */
  id: number | string | null;
  firestoreId: string | null;

  requirementId: number;

  titleEn: string;
  titleAr: string;

  descriptionEn: string | null;
  descriptionAr: string | null;

  isRequired: boolean;
  status: ApplicationDocumentStatus;

  originalName: string | null;
  mimeType: string | null;
  fileSize: number | null;

  /**
   * Direct Cloudinary/file URL.
   * Several old field names are supported while reading Firestore.
   */
  fileUrl: string | null;

  reviewNote: string | null;
  uploadedAt: string | null;
  reviewedAt: string | null;
}

export interface AdminApplication {
  id: number;
  userId: string;

  serviceType: AdminServiceType;
  status: AdminApplicationStatus;

  currentStep: string | null;
  progress: number;

  documentProgress: {
    required: number;
    uploaded: number;
    approved: number;
  };

  notes: string | null;

  createdAt: string;
  updatedAt: string;

  client: {
    id: string;
    fullName: string;
    companyName: string | null;
    email: string;
  };

  intake: {
    id: number;
    phone: string | null;
    country: string | null;
    businessActivity: string | null;
    desiredCompanyName: string | null;
    needsEin: boolean;
    needsStripe: boolean;
    needsPaypal: boolean;
    needsWise: boolean;
    needsMercury: boolean;
    needsRelay: boolean;
    needsPayoneer: boolean;
    needsShopify: boolean;
    extraNotes: string | null;
  } | null;

  documents: AdminApplicationDocument[];
}

export interface UpdateAdminApplicationPayload {
  status?: AdminApplicationStatus;
  currentStep?: string;
  progress?: number;
  notes?: string;
}

type FirestoreData = Record<string, unknown>;

function toIsoString(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return "";
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim()
    ? value
    : null;
}

function booleanValue(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function documentFileUrl(data: FirestoreData): string | null {
  const candidates = [
    data.file_url,
    data.secure_url,
    data.cloudinary_url,
    data.url,
    data.fileUrl,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function normalizeDocumentStatus(
  value: unknown
): ApplicationDocumentStatus {
  if (
    value === "uploaded" ||
    value === "in_review" ||
    value === "approved" ||
    value === "rejected"
  ) {
    return value;
  }

  return "missing";
}

async function getClient(userId: string) {
  const snapshot = await getDoc(
    doc(db, "users", userId)
  );

  if (!snapshot.exists()) {
    return {
      id: userId,
      fullName: "",
      companyName: null,
      email: "",
    };
  }

  const data = snapshot.data();

  return {
    id: userId,
    fullName:
      typeof data.full_name === "string"
        ? data.full_name
        : "",
    companyName:
      typeof data.company_name === "string"
        ? data.company_name
        : null,
    email:
      typeof data.email === "string"
        ? data.email
        : "",
  };
}

async function getIntake(
  applicationId: number,
  userId: string
) {
  const intakeQuery = query(
    collection(db, "application_intake"),
    where("application_id", "==", applicationId),
    where("user_id", "==", userId)
  );

  let snapshot = await getDocs(intakeQuery);

  /**
   * Compatibility with old rows where application_id was saved
   * as a string.
   */
  if (snapshot.empty) {
    const stringIdQuery = query(
      collection(db, "application_intake"),
      where("application_id", "==", String(applicationId)),
      where("user_id", "==", userId)
    );

    snapshot = await getDocs(stringIdQuery);
  }

  if (snapshot.empty) {
    return null;
  }

  const data = snapshot.docs[0].data();

  return {
    id:
      numberOrNull(data.id) ??
      numberOrNull(snapshot.docs[0].id) ??
      0,

    phone: stringOrNull(data.phone),
    country: stringOrNull(data.country),

    businessActivity:
      stringOrNull(data.business_activity),

    desiredCompanyName:
      stringOrNull(data.desired_company_name),

    needsEin: booleanValue(data.needs_ein),
    needsStripe: booleanValue(data.needs_stripe),
    needsPaypal: booleanValue(data.needs_paypal),
    needsWise: booleanValue(data.needs_wise),
    needsMercury: booleanValue(data.needs_mercury),
    needsRelay: booleanValue(data.needs_relay),
    needsPayoneer: booleanValue(data.needs_payoneer),
    needsShopify: booleanValue(data.needs_shopify),

    extraNotes: stringOrNull(data.extra_notes),
  };
}

async function getRequirements(
  serviceType: AdminServiceType
) {
  const requirementsQuery = query(
    collection(db, "document_requirements"),
    where("service_type", "==", serviceType)
  );

  const snapshot = await getDocs(requirementsQuery);

  return snapshot.docs
    .map((item) => {
      const data = item.data();

      return {
        firestoreId: item.id,
        id:
          numberOrNull(data.id) ??
          numberOrNull(item.id) ??
          0,

        titleEn:
          typeof data.title_en === "string"
            ? data.title_en
            : "",

        titleAr:
          typeof data.title_ar === "string"
            ? data.title_ar
            : "",

        descriptionEn:
          stringOrNull(data.description_en),

        descriptionAr:
          stringOrNull(data.description_ar),

        isRequired:
          booleanValue(data.is_required),

        isActive:
          data.is_active === undefined
            ? true
            : booleanValue(data.is_active),

        sortOrder:
          numberOrNull(data.sort_order) ?? 0,
      };
    })
    .filter((item) => item.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

async function getUploadedDocuments(
  applicationId: number
) {
  const documentsCollection = collection(
    db,
    "application_documents"
  );

  let snapshot = await getDocs(
    query(
      documentsCollection,
      where("application_id", "==", applicationId)
    )
  );

  /**
   * Compatibility with documents created before application_id
   * was consistently stored as a number.
   */
  if (snapshot.empty) {
    snapshot = await getDocs(
      query(
        documentsCollection,
        where(
          "application_id",
          "==",
          String(applicationId)
        )
      )
    );
  }

  return snapshot.docs.map((item) => ({
    firestoreId: item.id,
    data: item.data() as FirestoreData,
  }));
}

async function getApplicationDocuments(
  applicationId: number,
  serviceType: AdminServiceType
): Promise<AdminApplicationDocument[]> {
  const [requirements, uploadedDocuments] =
    await Promise.all([
      getRequirements(serviceType),
      getUploadedDocuments(applicationId),
    ]);

  const byRequirement = new Map<
    number,
    {
      firestoreId: string;
      data: FirestoreData;
    }
  >();

  for (const item of uploadedDocuments) {
    const requirementId = numberOrNull(
      item.data.requirement_id
    );

    if (requirementId !== null) {
      byRequirement.set(requirementId, item);
    }
  }

  /**
   * First return every requirement for the service. This means the
   * admin can also see required documents that are still missing.
   */
  const result: AdminApplicationDocument[] =
    requirements.map((requirement) => {
      const uploaded = byRequirement.get(
        requirement.id
      );

      if (!uploaded) {
        return {
          id: null,
          firestoreId: null,
          requirementId: requirement.id,

          titleEn: requirement.titleEn,
          titleAr: requirement.titleAr,

          descriptionEn: requirement.descriptionEn,
          descriptionAr: requirement.descriptionAr,

          isRequired: requirement.isRequired,
          status: "missing",

          originalName: null,
          mimeType: null,
          fileSize: null,
          fileUrl: null,

          reviewNote: null,
          uploadedAt: null,
          reviewedAt: null,
        };
      }

      const data = uploaded.data;

      return {
        id:
          numberOrNull(data.id) ??
          stringOrNull(data.id) ??
          uploaded.firestoreId,

        firestoreId: uploaded.firestoreId,
        requirementId: requirement.id,

        titleEn:
          stringOrNull(data.title_en) ??
          requirement.titleEn,

        titleAr:
          stringOrNull(data.title_ar) ??
          requirement.titleAr,

        descriptionEn:
          stringOrNull(data.description_en) ??
          requirement.descriptionEn,

        descriptionAr:
          stringOrNull(data.description_ar) ??
          requirement.descriptionAr,

        isRequired: requirement.isRequired,

        status: normalizeDocumentStatus(
          data.status
        ),

        originalName:
          stringOrNull(data.original_name) ??
          stringOrNull(data.originalName),

        mimeType:
          stringOrNull(data.mime_type) ??
          stringOrNull(data.mimeType),

        fileSize:
          numberOrNull(data.file_size) ??
          numberOrNull(data.fileSize),

        fileUrl: documentFileUrl(data),

        reviewNote:
          stringOrNull(data.review_note) ??
          stringOrNull(data.reviewNote),

        uploadedAt:
          toIsoString(data.uploaded_at) ||
          toIsoString(data.uploadedAt) ||
          null,

        reviewedAt:
          toIsoString(data.reviewed_at) ||
          toIsoString(data.reviewedAt) ||
          null,
      };
    });

  /**
   * Also keep orphan uploads visible instead of silently hiding them.
   * This protects you if an old uploaded document points to a requirement
   * that has since been removed or changed.
   */
  for (const uploaded of uploadedDocuments) {
    const requirementId =
      numberOrNull(
        uploaded.data.requirement_id
      ) ?? 0;

    if (
      result.some(
        (item) =>
          item.requirementId === requirementId
      )
    ) {
      continue;
    }

    const data = uploaded.data;

    result.push({
      id:
        numberOrNull(data.id) ??
        stringOrNull(data.id) ??
        uploaded.firestoreId,

      firestoreId: uploaded.firestoreId,
      requirementId,

      titleEn:
        stringOrNull(data.title_en) ??
        "Uploaded document",

      titleAr:
        stringOrNull(data.title_ar) ??
        "وثيقة مرفوعة",

      descriptionEn:
        stringOrNull(data.description_en),

      descriptionAr:
        stringOrNull(data.description_ar),

      isRequired: booleanValue(data.is_required),

      status: normalizeDocumentStatus(
        data.status
      ),

      originalName:
        stringOrNull(data.original_name) ??
        stringOrNull(data.originalName),

      mimeType:
        stringOrNull(data.mime_type) ??
        stringOrNull(data.mimeType),

      fileSize:
        numberOrNull(data.file_size) ??
        numberOrNull(data.fileSize),

      fileUrl: documentFileUrl(data),

      reviewNote:
        stringOrNull(data.review_note) ??
        stringOrNull(data.reviewNote),

      uploadedAt:
        toIsoString(data.uploaded_at) ||
        toIsoString(data.uploadedAt) ||
        null,

      reviewedAt:
        toIsoString(data.reviewed_at) ||
        toIsoString(data.reviewedAt) ||
        null,
    });
  }

  return result;
}

async function findApplicationSnapshot(
  applicationId: number
) {
  /**
   * Your current app normally stores the application with the numeric
   * id as the Firestore document id.
   */
  const directReference = doc(
    db,
    "applications",
    String(applicationId)
  );

  const directSnapshot = await getDoc(
    directReference
  );

  if (directSnapshot.exists()) {
    return directSnapshot;
  }

  /**
   * Fallback for older documents with an auto-generated Firestore id.
   */
  let snapshot = await getDocs(
    query(
      collection(db, "applications"),
      where("id", "==", applicationId)
    )
  );

  if (snapshot.empty) {
    snapshot = await getDocs(
      query(
        collection(db, "applications"),
        where("id", "==", String(applicationId))
      )
    );
  }

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0];
}

async function mapApplication(
  data: FirestoreData
): Promise<AdminApplication> {
  const id = Number(data.id);
  const userId = String(data.user_id || "");
  const serviceType =
    data.service_type as AdminServiceType;

  const [client, intake, documents] =
    await Promise.all([
      getClient(userId),
      getIntake(id, userId),
      getApplicationDocuments(
        id,
        serviceType
      ),
    ]);

  const required = documents.filter(
    (item) => item.isRequired
  ).length;

  const uploaded = documents.filter(
    (item) =>
      item.originalName !== null &&
      item.status !== "missing"
  ).length;

  const approved = documents.filter(
    (item) => item.status === "approved"
  ).length;

  return {
    id,
    userId,
    serviceType,

    status:
      (data.status as AdminApplicationStatus) ||
      "submitted",

    currentStep:
      typeof data.current_step === "string"
        ? data.current_step
        : null,

    progress: Number(data.progress || 0),

    documentProgress: {
      required,
      uploaded,
      approved,
    },

    notes:
      typeof data.notes === "string"
        ? data.notes
        : null,

    createdAt: toIsoString(
      data.created_at
    ),

    updatedAt: toIsoString(
      data.updated_at
    ),

    client,
    intake,
    documents,
  };
}

export async function getAdminApplications() {
  const snapshot = await getDocs(
    collection(db, "applications")
  );

  const applications =
    await Promise.all(
      snapshot.docs.map(async (item) =>
        mapApplication(
          item.data() as FirestoreData
        )
      )
    );

  applications.sort(
    (a, b) =>
      new Date(
        b.createdAt || 0
      ).getTime() -
      new Date(
        a.createdAt || 0
      ).getTime()
  );

  return {
    applications,
    total: applications.length,
  };
}

export async function getAdminApplication(
  applicationId: number
) {
  const snapshot =
    await findApplicationSnapshot(
      applicationId
    );

  if (!snapshot) {
    throw new Error(
      "Application not found."
    );
  }

  const application =
    await mapApplication(
      snapshot.data() as FirestoreData
    );

  return {
    application,
  };
}

export async function updateAdminApplication(
  applicationId: number,
  payload: UpdateAdminApplicationPayload
) {
  const snapshot =
    await findApplicationSnapshot(
      applicationId
    );

  if (!snapshot) {
    throw new Error(
      "Application not found."
    );
  }

  const reference = snapshot.ref;

  const updates: Record<
    string,
    unknown
  > = {
    updated_at: serverTimestamp(),
  };

  if (payload.status !== undefined) {
    updates.status = payload.status;
  }

  if (
    payload.currentStep !== undefined
  ) {
    updates.current_step =
      payload.currentStep;
  }

  if (payload.progress !== undefined) {
    updates.progress = payload.progress;
  }

  if (payload.notes !== undefined) {
    updates.notes = payload.notes;
  }

  await updateDoc(reference, updates);

  const updatedSnapshot =
    await getDoc(reference);

  const application =
    await mapApplication(
      updatedSnapshot.data() as FirestoreData
    );

  return {
    message:
      "Application updated successfully.",
    application,
  };
}
