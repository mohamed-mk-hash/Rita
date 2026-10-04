import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebase.js";

const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

function toDateString(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (value?.toDate) {
    return value.toDate().toISOString();
  }

  return null;
}

async function getCurrentUser() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Not logged in");
  }

  return user;
}

async function getOwnedApplication(applicationId) {
  const user =
    await getCurrentUser();

  const snapshot =
    await getDoc(
      doc(
        db,
        "applications",
        String(applicationId)
      )
    );

  if (!snapshot.exists()) {
    throw new Error(
      "Application not found"
    );
  }

  const application =
    snapshot.data();

  if (
    application.user_id !==
    user.uid
  ) {
    throw new Error(
      "You cannot access this application"
    );
  }

  return application;
}

function mapDocument(
  requirement,
  uploadedDocument
) {
  return {
    requirementId:
      requirement.id,

    documentId:
      uploadedDocument?.id ??
      null,

    documentCode:
      requirement.document_code,

    titleEn:
      requirement.title_en ||
      "",

    titleAr:
      requirement.title_ar ||
      "",

    descriptionEn:
      requirement.description_en ||
      "",

    descriptionAr:
      requirement.description_ar ||
      "",

    required:
      Boolean(
        Number(
          requirement.is_required
        )
      ),

    sortOrder:
      Number(
        requirement.sort_order ||
        0
      ),

    acceptedTypes:
      requirement.accepted_types ||
      "",

    maxSizeMb:
      Number(
        requirement.max_size_mb ||
        5
      ),

    status:
      uploadedDocument?.status ||
      "missing",

    originalName:
      uploadedDocument?.original_name ||
      null,

    storedName:
      uploadedDocument?.stored_name ||
      null,

    filePath:
      uploadedDocument?.file_path ||
      null,

    secureUrl:
      uploadedDocument?.secure_url ||
      null,

    mimeType:
      uploadedDocument?.mime_type ||
      null,

    fileSize:
      Number(
        uploadedDocument?.file_size ||
        0
      ),

    reviewNote:
      uploadedDocument?.review_note ||
      null,

    uploadedAt:
      toDateString(
        uploadedDocument?.uploaded_at
      ),

    reviewedAt:
      toDateString(
        uploadedDocument?.reviewed_at
      ),
  };
}

function createSummary(documents) {
  const requiredDocuments =
    documents.filter(
      (item) => item.required
    );

  const uploadedDocuments =
    documents.filter(
      (item) =>
        item.status !== "missing"
    );

  const uploadedRequired =
    requiredDocuments.filter(
      (item) =>
        item.status !== "missing"
    );

  const approved =
    documents.filter(
      (item) =>
        item.status === "approved"
    );

  const inReview =
    documents.filter(
      (item) =>
        item.status === "in_review" ||
        item.status === "uploaded"
    );

  const rejected =
    documents.filter(
      (item) =>
        item.status === "rejected"
    );

  const missing =
    documents.filter(
      (item) =>
        item.status === "missing"
    );

  return {
    total:
      documents.length,

    required:
      requiredDocuments.length,

    uploaded:
      uploadedDocuments.length,

    uploadedRequired:
      uploadedRequired.length,

    approved:
      approved.length,

    inReview:
      inReview.length,

    rejected:
      rejected.length,

    missing:
      missing.length,

    progress:
      requiredDocuments.length > 0
        ? Math.round(
            (uploadedRequired.length /
              requiredDocuments.length) *
              100
          )
        : 100,

    approvalProgress:
      requiredDocuments.length > 0
        ? Math.round(
            (approved.length /
              requiredDocuments.length) *
              100
          )
        : 100,
  };
}

export async function getApplicationDocumentsRequest(
  applicationId
) {
  const application =
    await getOwnedApplication(
      applicationId
    );

  const requirementsQuery =
    query(
      collection(
        db,
        "document_requirements"
      ),

      where(
        "service_type",
        "==",
        application.service_type
      )
    );

 const documentsQuery =
  query(
    collection(
      db,
      "application_documents"
    ),

    where(
      "application_id",
      "==",
      Number(applicationId)
    ),

    where(
      "user_id",
      "==",
      auth.currentUser.uid
    )
  );

  const [
    requirementsSnapshot,
    documentsSnapshot,
  ] = await Promise.all([
    getDocs(requirementsQuery),
    getDocs(documentsQuery),
  ]);

  const requirements =
    requirementsSnapshot.docs
      .map((item) =>
        item.data()
      )
      .filter(
        (item) =>
          Number(item.is_active) !==
          0
      )
      .sort(
        (a, b) =>
          Number(
            a.sort_order || 0
          ) -
          Number(
            b.sort_order || 0
          )
      );

  const uploadedDocuments =
    documentsSnapshot.docs.map(
      (item) =>
        item.data()
    );

  const documents =
    requirements.map(
      (requirement) => {
        const uploaded =
          uploadedDocuments.find(
            (document) =>
              Number(
                document.requirement_id
              ) ===
              Number(
                requirement.id
              )
          );

        return mapDocument(
          requirement,
          uploaded
        );
      }
    );

  return {
    documents,

    summary:
      createSummary(
        documents
      ),
  };
}

export async function uploadApplicationDocumentRequest(
  applicationId,
  requirementId,
  file
) {
  const user =
    await getCurrentUser();

  await getOwnedApplication(
    applicationId
  );

  if (
    !CLOUDINARY_CLOUD_NAME ||
    !CLOUDINARY_UPLOAD_PRESET
  ) {
    throw new Error(
      "Cloudinary configuration is missing"
    );
  }

  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  formData.append(
    "upload_preset",
    CLOUDINARY_UPLOAD_PRESET
  );

  formData.append(
    "folder",
    `rita/user-${user.uid}/application-${applicationId}/requirement-${requirementId}`
  );

  const uploadResponse =
    await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

  const uploadData =
    await uploadResponse.json();

  if (!uploadResponse.ok) {
    throw new Error(
      uploadData?.error?.message ||
      "Could not upload document"
    );
  }

const existingQuery =
  query(
    collection(
      db,
      "application_documents"
    ),

    where(
      "application_id",
      "==",
      Number(applicationId)
    ),

    where(
      "requirement_id",
      "==",
      Number(requirementId)
    ),

    where(
      "user_id",
      "==",
      user.uid
    )
  );
  const existingSnapshot =
    await getDocs(
      existingQuery
    );

  let documentId;

  if (
    !existingSnapshot.empty
  ) {
    documentId =
      existingSnapshot.docs[0]
        .data()
        .id;
  } else {
    documentId =
      Date.now();
  }

  const documentData = {
    id:
      documentId,

    application_id:
      Number(
        applicationId
      ),

    requirement_id:
      Number(
        requirementId
      ),

    user_id:
      user.uid,

    original_name:
      file.name,

    stored_name:
      uploadData.public_id,

    file_path:
      uploadData.public_id,

    secure_url:
      uploadData.secure_url,

    resource_type:
      uploadData.resource_type ||
      null,

    cloudinary_asset_id:
      uploadData.asset_id ||
      null,

    mime_type:
      file.type ||
      uploadData.format ||
      "",

    file_size:
      file.size,

    status:
      "in_review",

    review_note:
      null,

    uploaded_at:
      serverTimestamp(),

    reviewed_at:
      null,

    created_at:
      serverTimestamp(),

    updated_at:
      serverTimestamp(),
  };

  await setDoc(
    doc(
      db,
      "application_documents",
      String(documentId)
    ),

    documentData,

    {
      merge: true,
    }
  );

  return {
    success: true,

    document: {
      ...documentData,

      uploaded_at:
        new Date().toISOString(),

      created_at:
        new Date().toISOString(),

      updated_at:
        new Date().toISOString(),
    },
  };
}

export async function downloadApplicationDocumentRequest(
  documentId
) {
  const user =
    await getCurrentUser();

  const snapshot =
    await getDoc(
      doc(
        db,
        "application_documents",
        String(documentId)
      )
    );

  if (!snapshot.exists()) {
    throw new Error(
      "Document not found"
    );
  }

  const documentData =
    snapshot.data();

  if (
    documentData.user_id !==
    user.uid
  ) {
    throw new Error(
      "You cannot access this document"
    );
  }

  if (
    !documentData.secure_url
  ) {
    throw new Error(
      "Document URL not found"
    );
  }

  const response =
    await fetch(
      documentData.secure_url
    );

  if (!response.ok) {
    throw new Error(
      "Could not download document"
    );
  }

  const blob =
    await response.blob();

  return {
    blob,

    filename:
      documentData.original_name ||
      `document-${documentId}`,
  };
}

export async function deleteApplicationDocumentRequest(
  documentId
) {
  const user =
    await getCurrentUser();

  const reference =
    doc(
      db,
      "application_documents",
      String(documentId)
    );

  const snapshot =
    await getDoc(
      reference
    );

  if (!snapshot.exists()) {
    throw new Error(
      "Document not found"
    );
  }

  const documentData =
    snapshot.data();

  if (
    documentData.user_id !==
    user.uid
  ) {
    throw new Error(
      "You cannot delete this document"
    );
  }

  /*
    Important:
    this removes the Firestore record only.

    The actual file stays in Cloudinary
    because deleting Cloudinary assets
    securely requires the API secret.
  */
  await deleteDoc(
    reference
  );

  return {
    success: true,
  };
}