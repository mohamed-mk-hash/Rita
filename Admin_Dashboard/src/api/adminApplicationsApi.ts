const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

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
  id: number | null;
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

  reviewNote: string | null;
  uploadedAt: string | null;
  reviewedAt: string | null;
}

export interface AdminApplication {
  id: number;
  userId: number;

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
    id: number;
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

  documents?: AdminApplicationDocument[];
}

export interface UpdateAdminApplicationPayload {
  status?: AdminApplicationStatus;
  currentStep?: string;
  progress?: number;
  notes?: string;
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

export async function getAdminApplications() {
  const response = await fetch(
    `${API_URL}/admin/applications`,
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

  return response.json() as Promise<{
    applications: AdminApplication[];
    total: number;
  }>;
}

export async function getAdminApplication(
  applicationId: number
) {
  const response = await fetch(
    `${API_URL}/admin/applications/${applicationId}`,
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

  return response.json() as Promise<{
    application: AdminApplication;
  }>;
}

export async function updateAdminApplication(
  applicationId: number,
  payload: UpdateAdminApplicationPayload
) {
  const response = await fetch(
    `${API_URL}/admin/applications/${applicationId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response)
    );
  }

  return response.json() as Promise<{
    message: string;
    application: AdminApplication;
  }>;
}
