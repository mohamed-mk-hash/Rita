import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentReference,
} from "firebase/firestore";

import { db } from "../../firebase";

export type AdminDocumentStatus =
  | "uploaded"
  | "in_review"
  | "approved"
  | "rejected";

export type AdminServiceType =
  | "us_llc"
  | "ein_assistance"
  | "banking_payment_setup"
  | "compliance_support";

export interface AdminDocument {
  /**
   * Public/business id stored inside the Firestore document.
   * It can be an old numeric id or the Firestore document id.
   */
  id: number | string;

  /**
   * Real Firestore document id. This is what review/update uses.
   */
  firestoreId: string;

  applicationId: number;
  requirementId: number;

  originalName: string;
  mimeType: string;
  fileSize: number;

  /**
   * Direct Cloudinary URL saved when the client uploaded the file.
   */
  fileUrl: string;

  status: AdminDocumentStatus;
  reviewNote: string | null;
  uploadedAt: string | null;
  reviewedAt: string | null;

  titleEn: string;
  titleAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  isRequired: boolean;

  serviceType: AdminServiceType;

  client: {
    id: string;
    fullName: string;
    companyName: string | null;
    email: string;
  };
}

export interface AdminDocumentsResponse {
  documents: AdminDocument[];

  stats: {
    total: number;
    uploaded: number;
    inReview: number;
    approved: number;
    rejected: number;
  };

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminDocumentsFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  applicationId?: number;
}

type FirestoreData = Record<string, unknown>;

function toIsoString(value: unknown): string | null {
  if (!value) return null;

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
    return (value as { toDate: () => Date })
      .toDate()
      .toISOString();
  }

  return null;
}

function stringValue(
  value: unknown,
  fallback = ""
): string {
  return typeof value === "string"
    ? value
    : fallback;
}

function stringOrNull(
  value: unknown
): string | null {
  return typeof value === "string" &&
    value.trim()
    ? value
    : null;
}

function numberValue(
  value: unknown,
  fallback = 0
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function booleanValue(
  value: unknown
): boolean {
  return (
    value === true ||
    value === 1 ||
    value === "1"
  );
}

function normalizeStatus(
  value: unknown
): AdminDocumentStatus {
  if (
    value === "in_review" ||
    value === "approved" ||
    value === "rejected"
  ) {
    return value;
  }

  return "uploaded";
}

function getFileUrl(
  data: FirestoreData
): string {
  /**
   * Supports both the new field and the field names that may already
   * exist in your Firestore from previous versions.
   */
  const candidates = [
    data.file_url,
    data.secure_url,
    data.cloudinary_url,
    data.url,
    data.fileUrl,
  ];

  for (const value of candidates) {
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value;
    }
  }

  return "";
}

async function getClient(
  userId: string
) {
  if (!userId) {
    return {
      id: "",
      fullName: "",
      companyName: null,
      email: "",
    };
  }

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
      stringValue(data.full_name),
    companyName:
      stringOrNull(data.company_name),
    email:
      stringValue(data.email),
  };
}

async function findApplicationData(
  applicationId: number
): Promise<FirestoreData | null> {
  const direct = await getDoc(
    doc(
      db,
      "applications",
      String(applicationId)
    )
  );

  if (direct.exists()) {
    return direct.data() as FirestoreData;
  }

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
        where(
          "id",
          "==",
          String(applicationId)
        )
      )
    );
  }

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0]
    .data() as FirestoreData;
}

async function getRequirement(
  requirementId: number
) {
  const direct = await getDoc(
    doc(
      db,
      "document_requirements",
      String(requirementId)
    )
  );

  if (direct.exists()) {
    return direct.data() as FirestoreData;
  }

  let snapshot = await getDocs(
    query(
      collection(
        db,
        "document_requirements"
      ),
      where("id", "==", requirementId)
    )
  );

  if (snapshot.empty) {
    snapshot = await getDocs(
      query(
        collection(
          db,
          "document_requirements"
        ),
        where(
          "id",
          "==",
          String(requirementId)
        )
      )
    );
  }

  if (snapshot.empty) {
    return {};
  }

  return snapshot.docs[0]
    .data() as FirestoreData;
}

async function mapDocument(
  firestoreId: string,
  data: FirestoreData
): Promise<AdminDocument> {
  const applicationId = numberValue(
    data.application_id
  );

  const requirementId = numberValue(
    data.requirement_id
  );

  const application =
    await findApplicationData(
      applicationId
    );

  const requirement =
    await getRequirement(
      requirementId
    );

  const userId = String(
    data.user_id ||
      application?.user_id ||
      ""
  );

  const client =
    await getClient(userId);

  const rawId =
    data.id !== undefined &&
    data.id !== null
      ? data.id
      : firestoreId;

  return {
    id:
      typeof rawId === "number"
        ? rawId
        : String(rawId),

    firestoreId,

    applicationId,
    requirementId,

    originalName:
      stringValue(
        data.original_name ??
          data.originalName,
        "document"
      ),

    mimeType:
      stringValue(
        data.mime_type ??
          data.mimeType,
        "application/octet-stream"
      ),

    fileSize:
      numberValue(
        data.file_size ??
          data.fileSize
      ),

    fileUrl: getFileUrl(data),

    status:
      normalizeStatus(data.status),

    reviewNote:
      stringOrNull(
        data.review_note ??
          data.reviewNote
      ),

    uploadedAt:
      toIsoString(
        data.uploaded_at ??
          data.uploadedAt
      ),

    reviewedAt:
      toIsoString(
        data.reviewed_at ??
          data.reviewedAt
      ),

    titleEn:
      stringValue(
        data.title_en ??
          requirement.title_en,
        "Uploaded document"
      ),

    titleAr:
      stringValue(
        data.title_ar ??
          requirement.title_ar,
        "وثيقة مرفوعة"
      ),

    descriptionEn:
      stringOrNull(
        data.description_en ??
          requirement.description_en
      ),

    descriptionAr:
      stringOrNull(
        data.description_ar ??
          requirement.description_ar
      ),

    isRequired:
      booleanValue(
        data.is_required ??
          requirement.is_required
      ),

    serviceType:
      String(
        application?.service_type ||
          requirement.service_type ||
          "us_llc"
      ) as AdminServiceType,

    client,
  };
}

async function loadRawDocuments(
  applicationId?: number
) {
  const documentsCollection =
    collection(
      db,
      "application_documents"
    );

  if (!applicationId) {
    return getDocs(
      documentsCollection
    );
  }

  let snapshot = await getDocs(
    query(
      documentsCollection,
      where(
        "application_id",
        "==",
        applicationId
      )
    )
  );

  /**
   * Compatibility with rows created while application_id was saved
   * as a string.
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

  return snapshot;
}

export async function getAdminDocuments(
  filters: AdminDocumentsFilters = {}
): Promise<AdminDocumentsResponse> {
  const snapshot =
    await loadRawDocuments(
      filters.applicationId
    );

  const allDocuments =
    await Promise.all(
      snapshot.docs.map((item) =>
        mapDocument(
          item.id,
          item.data() as FirestoreData
        )
      )
    );

  let documents = [...allDocuments];

  const search =
    filters.search
      ?.trim()
      .toLowerCase();

  if (search) {
    documents = documents.filter(
      (item) =>
        item.client.fullName
          .toLowerCase()
          .includes(search) ||
        item.client.email
          .toLowerCase()
          .includes(search) ||
        item.originalName
          .toLowerCase()
          .includes(search) ||
        String(item.applicationId)
          .includes(search) ||
        String(item.id)
          .toLowerCase()
          .includes(search)
    );
  }

  if (filters.status) {
    documents = documents.filter(
      (item) =>
        item.status === filters.status
    );
  }

  documents.sort(
    (a, b) =>
      new Date(
        b.uploadedAt || 0
      ).getTime() -
      new Date(
        a.uploadedAt || 0
      ).getTime()
  );

  /**
   * Stats are calculated from the complete selected application/global
   * document set, before the text/status filters are applied.
   */
  const stats = {
    total: allDocuments.length,
    uploaded: allDocuments.filter(
      (item) =>
        item.status === "uploaded"
    ).length,
    inReview: allDocuments.filter(
      (item) =>
        item.status === "in_review"
    ).length,
    approved: allDocuments.filter(
      (item) =>
        item.status === "approved"
    ).length,
    rejected: allDocuments.filter(
      (item) =>
        item.status === "rejected"
    ).length,
  };

  const page = Math.max(
    1,
    Number(filters.page || 1)
  );

  const limit = Math.max(
    1,
    Number(filters.limit || 100)
  );

  const total = documents.length;

  const totalPages = Math.max(
    1,
    Math.ceil(total / limit)
  );

  const start = (page - 1) * limit;

  const paginated =
    documents.slice(
      start,
      start + limit
    );

  return {
    documents: paginated,
    stats,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Convenience helper for ApplicationDetails.
 */
export async function getAdminApplicationDocuments(
  applicationId: number
): Promise<AdminDocument[]> {
  const response =
    await getAdminDocuments({
      applicationId,
      page: 1,
      limit: 100,
    });

  return response.documents;
}

async function resolveDocumentReference(
  documentId: number | string
): Promise<DocumentReference> {
  const directReference = doc(
    db,
    "application_documents",
    String(documentId)
  );

  const directSnapshot =
    await getDoc(directReference);

  if (directSnapshot.exists()) {
    return directReference;
  }

  const numericId =
    Number(documentId);

  if (Number.isFinite(numericId)) {
    const numericSnapshot =
      await getDocs(
        query(
          collection(
            db,
            "application_documents"
          ),
          where("id", "==", numericId)
        )
      );

    if (!numericSnapshot.empty) {
      return numericSnapshot.docs[0].ref;
    }
  }

  const stringSnapshot =
    await getDocs(
      query(
        collection(
          db,
          "application_documents"
        ),
        where(
          "id",
          "==",
          String(documentId)
        )
      )
    );

  if (!stringSnapshot.empty) {
    return stringSnapshot.docs[0].ref;
  }

  throw new Error(
    "Document not found."
  );
}

export async function reviewAdminDocument(
  documentId: number | string,
  status: "approved" | "rejected",
  reviewNote: string
) {
  const reference =
    await resolveDocumentReference(
      documentId
    );

  await updateDoc(reference, {
    status,
    review_note:
      reviewNote.trim() || null,
    reviewed_at:
      serverTimestamp(),
  });

  const snapshot =
    await getDoc(reference);

  return {
    message:
      status === "approved"
        ? "Document approved successfully."
        : "Document rejected successfully.",

    document:
      await mapDocument(
        snapshot.id,
        snapshot.data() as FirestoreData
      ),
  };
}

async function getDocumentForAction(
  documentId: number | string
) {
  const reference =
    await resolveDocumentReference(
      documentId
    );

  const snapshot =
    await getDoc(reference);

  if (!snapshot.exists()) {
    throw new Error(
      "Document not found."
    );
  }

  return mapDocument(
    snapshot.id,
    snapshot.data() as FirestoreData
  );
}

export async function openAdminDocument(
  documentId: number | string
) {
  const document =
    await getDocumentForAction(
      documentId
    );

  if (!document.fileUrl) {
    throw new Error(
      "This document does not contain a file URL."
    );
  }

  /*
   * لا نعتمد على القيمة التي ترجع من window.open().
   *
   * عند استعمال:
   * noopener / noreferrer
   *
   * بعض المتصفحات ترجع null حتى لو تم فتح الرابط بنجاح،
   * وهذا هو السبب الذي كان يظهر رسالة:
   * "The browser blocked the document preview."
   *
   * لذلك نفتح الرابط بواسطة عنصر <a> مؤقت.
   * إذا فتح المتصفح الوثيقة، لن نظهر أي خطأ وهمي.
   */
  const anchor =
    window.document.createElement(
      "a"
    );

  anchor.href =
    document.fileUrl;

  anchor.target = "_blank";

  anchor.rel =
    "noopener noreferrer";

  anchor.style.display =
    "none";

  window.document.body.appendChild(
    anchor
  );

  anchor.click();
  anchor.remove();
}

export async function downloadAdminDocument(
  documentId: number | string,
  fallbackFileName: string
) {
  const document =
    await getDocumentForAction(
      documentId
    );

  if (!document.fileUrl) {
    throw new Error(
      "This document does not contain a file URL."
    );
  }

  try {
    const response = await fetch(
      document.fileUrl
    );

    if (!response.ok) {
      throw new Error(
        "Could not download the file."
      );
    }

    const blob =
      await response.blob();

    const objectUrl =
      URL.createObjectURL(blob);

    const anchor =
      window.document.createElement(
        "a"
      );

    anchor.href = objectUrl;
    anchor.download =
      fallbackFileName ||
      document.originalName ||
      "document";

    anchor.style.display = "none";

    window.document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(
        objectUrl
      );
    }, 0);
  } catch {
    /**
     * Some Cloudinary delivery URLs may refuse a cross-origin blob fetch.
     * Opening the original URL is a safe fallback and still gives the admin
     * direct access to the file.
     */
    window.open(
      document.fileUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }
}
