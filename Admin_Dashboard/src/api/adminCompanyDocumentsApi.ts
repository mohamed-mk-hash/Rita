
import { getAuth } from "firebase/auth";

export type CompanyDocument = {
  id: string;
  applicationId: number;
  userId: string;
  title: string;
  description: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileUrl: string;
  storagePath: string;
  published: boolean;
  createdAt: string | null;
};

const SERVER_URL = (
  import.meta.env.VITE_EMAIL_API_URL ||
  "http://127.0.0.1:5010"
).replace(/\/+$/, "");

const CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
  "";

const UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
  "";

const MAX_SIZE = 15 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const user = getAuth().currentUser;

  if (!user) {
    throw new Error("Admin is not signed in.");
  }

  const token = await user.getIdToken();

  const response = await fetch(
    `${SERVER_URL}${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    }
  );

  const result = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message ||
      `Server error ${response.status}`
    );
  }

  return result as T;
}

type DocumentsResponse = {
  success: boolean;
  documents: CompanyDocument[];
};

export async function getAdminCompanyDocuments(
  applicationId: number
): Promise<CompanyDocument[]> {
  const result = await apiRequest<DocumentsResponse>(
    `/api/admin/applications/${encodeURIComponent(
      applicationId
    )}/company-documents`
  );

  return result.documents || [];
}

async function uploadToCloudinary(
  file: File
): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary configuration is missing."
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(
      "Only PDF, PNG and JPEG files are allowed."
    );
  }

  if (file.size <= 0 || file.size > MAX_SIZE) {
    throw new Error(
      "File must be between 1 byte and 15 MB."
    );
  }

  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(
      CLOUD_NAME
    )}/auto/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const result = await response
    .json()
    .catch(() => ({}));

  if (!response.ok || !result.secure_url) {
    throw new Error(
      result.error?.message ||
      "Cloudinary upload failed."
    );
  }

  return String(result.secure_url);
}

export async function uploadAdminCompanyDocument(
  args: {
    applicationId: number;
    file: File;
    title: string;
    description?: string;
  }
): Promise<string> {
  const {
    applicationId,
    file,
    title,
    description = "",
  } = args;

  if (!title.trim()) {
    throw new Error("Document title is required.");
  }

  // Upload the document using the existing
  // unsigned Cloudinary upload preset.
  const fileUrl = await uploadToCloudinary(file);

  // Save its metadata and ownership on the server.
  const result = await apiRequest<{
    success: boolean;
    document: CompanyDocument;
  }>(
    `/api/admin/applications/${encodeURIComponent(
      applicationId
    )}/company-documents`,
    {
      method: "POST",
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        fileUrl,
      }),
    }
  );

  return result.document.id;
}

export async function setAdminCompanyDocumentPublished(
  documentId: string,
  published: boolean
): Promise<void> {
  await apiRequest(
    `/api/admin/company-documents/${encodeURIComponent(
      documentId
    )}`,
    {
      method: "PATCH",
      body: JSON.stringify({ published }),
    }
  );
}

export async function deleteAdminCompanyDocument(
  documentId: string
): Promise<void> {
  await apiRequest(
    `/api/admin/company-documents/${encodeURIComponent(
      documentId
    )}`,
    {
      method: "DELETE",
    }
  );
}

export async function openAdminCompanyDocument(
  documentId: string
): Promise<void> {
  const result = await apiRequest<{
    success: boolean;
    url: string;
  }>(
    `/api/company-documents/${encodeURIComponent(
      documentId
    )}/file`
  );

  const anchor = document.createElement("a");

  anchor.href = result.url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export async function downloadAdminCompanyDocument(
  documentId: string
): Promise<void> {
  const result = await apiRequest<{
    success: boolean;
    url: string;
    fileName: string;
  }>(
    `/api/company-documents/${encodeURIComponent(
      documentId
    )}/file`
  );

  try {
    const response = await fetch(result.url);

    if (!response.ok) {
      throw new Error("Download failed.");
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = result.fileName || "document";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  } catch {
    // Cloudinary may block cross-origin fetches.
    window.open(
      result.url,
      "_blank",
      "noopener,noreferrer"
    );
  }
}
