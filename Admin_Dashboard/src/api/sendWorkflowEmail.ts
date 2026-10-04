const EMAIL_API_URL =
  import.meta.env.VITE_EMAIL_API_URL ||
  "http://localhost:5000/api";

export interface SendWorkflowEmailPayload {
  to: string;
  userName?: string;
  applicationId?: string | number;
  serviceName?: string;
  oldPhase?: string;
  newPhase?: string;
  oldStatus?: string;
  newStatus?: string;
}

export interface SendWorkflowEmailResponse {
  success: boolean;
  skipped?: boolean;
  message?: string;
  messageId?: string;
}

export async function sendWorkflowEmailRequest({
  to,
  userName = "",
  applicationId = "",
  serviceName = "",
  oldPhase = "",
  newPhase = "",
  oldStatus = "",
  newStatus = "",
}: SendWorkflowEmailPayload): Promise<SendWorkflowEmailResponse> {
  const response = await fetch(
    `${EMAIL_API_URL}/send-workflow-email`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        to,
        userName,
        applicationId,
        serviceName,
        oldPhase,
        newPhase,
        oldStatus,
        newStatus,
      }),
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Could not send workflow email."
    );
  }

  return data;
}
