
import { auth } from "../firebase.js";

const RAW_BASE =
  import.meta.env.VITE_EMAIL_API_URL ||
  "http://127.0.0.1:5010";

const BASE = String(RAW_BASE)
  .trim()
  .replace(/\/+$/, "")
  .replace(/(?:\/api)+$/, "");

async function authenticatedRequest(path) {
  if (typeof auth.authStateReady === "function") {
    await auth.authStateReady();
  }

  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please sign in.");
  }

  const token = await user.getIdToken();

  const response = await fetch(`${BASE}/api${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
      `Server error: ${response.status}`
    );
  }

  return data;
}

// ----------------------------------
// LIST COMPANY DOCUMENTS
// ----------------------------------

export async function getCompanyDocumentsRequest(
  applicationId
) {
  const result = await authenticatedRequest(
    `/applications/${encodeURIComponent(
      applicationId
    )}/company-documents`
  );

  return {
    documents: Array.isArray(result.documents)
      ? result.documents
      : [],
  };
}

// ----------------------------------
// GET AUTHORIZED FILE URL
// ----------------------------------

export async function getCompanyDocumentFileRequest(
  documentId
) {
  const result = await authenticatedRequest(
    `/company-documents/${encodeURIComponent(
      documentId
    )}/file`
  );

  if (!result.url) {
    throw new Error(
      "The document does not have a valid file URL."
    );
  }

  return result;
}

// ----------------------------------
// GET FILE AS BLOB
// ----------------------------------

async function getDocumentBlob(documentId) {
  const file = await getCompanyDocumentFileRequest(
    documentId
  );

  const response = await fetch(file.url);

  if (!response.ok) {
    throw new Error(
      `Could not load document: ${response.status}`
    );
  }

  const blob = await response.blob();

  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error(
      "The downloaded document is empty."
    );
  }

  return {
    blob,
    filename:
      file.fileName || "company-document",
  };
}

// ----------------------------------
// DOWNLOAD
// Dashboard.jsx expects:
// { blob, filename }
// ----------------------------------

export async function downloadCompanyDocumentRequest(
  documentId
) {
  return getDocumentBlob(documentId);
}

// ----------------------------------
// OPEN
// Dashboard.jsx expects a Blob
// ----------------------------------

export async function openCompanyDocumentRequest(
  documentId
) {
  const result = await getDocumentBlob(
    documentId
  );

  return result.blob;
}
