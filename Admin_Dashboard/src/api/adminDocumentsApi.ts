const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

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
  id: number;
  applicationId: number;
  requirementId: number;

  originalName: string;
  mimeType: string;
  fileSize: number;

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
    id: number;
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
}

async function readErrorMessage(
  response: Response
) {
  try {
    const data = await response.json();

    return (
      data?.message ||
      "The request could not be completed"
    );
  } catch {
    return "The request could not be completed";
  }
}

export async function getAdminDocuments(
  filters: AdminDocumentsFilters = {}
): Promise<AdminDocumentsResponse> {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.page) {
    params.set("page", String(filters.page));
  }

  if (filters.limit) {
    params.set("limit", String(filters.limit));
  }

  const response = await fetch(
    `${API_URL}/admin/documents?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response)
    );
  }

  return response.json();
}

export async function reviewAdminDocument(
  documentId: number,
  status: "approved" | "rejected",
  reviewNote: string
) {
  const response = await fetch(
    `${API_URL}/admin/documents/${documentId}/review`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        status,
        reviewNote,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response)
    );
  }

  return response.json();
}

export async function downloadAdminDocument(
  documentId: number,
  fallbackFileName: string
) {
  const response = await fetch(
    `${API_URL}/admin/documents/${documentId}/download`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response)
    );
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const anchor =
    window.document.createElement("a");

  anchor.href = objectUrl;
  anchor.download =
    fallbackFileName || "document";

  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(objectUrl);
}
