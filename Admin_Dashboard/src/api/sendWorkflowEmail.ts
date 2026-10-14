
const EMAIL_API_URL = (
  import.meta.env.VITE_EMAIL_API_URL ||
  "http://127.0.0.1:5010"
)
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

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

export async function sendWorkflowEmailRequest(
  payload: SendWorkflowEmailPayload
): Promise<SendWorkflowEmailResponse> {
  const url = `${EMAIL_API_URL}/api/send-workflow-email`;

  console.log("Sending workflow email to:", url);

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("WORKFLOW_EMAIL_CONNECTION_ERROR:", error);

    throw new Error(
      `Cannot connect to email server: ${url}`
    );
  }

  const data: SendWorkflowEmailResponse =
    await response.json().catch(() => ({
      success: false,
      message: "Invalid server response.",
    }));

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || `Email failed (${response.status}).`
    );
  }

  return data;
}
