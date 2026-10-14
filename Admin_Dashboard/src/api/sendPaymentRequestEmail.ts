const API_URL = (import.meta.env.VITE_EMAIL_API_URL || "http://127.0.0.1:5010").replace(/\/+$/, "");

export async function sendPaymentRequestEmail(
  applicationId: number | string,
  to: string,
  userName = "",
  serviceName = "Service"
) {
  const email = String(to || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("A valid notification email is required.");
  }
  const response = await fetch(
    `${API_URL}/api/applications/${encodeURIComponent(applicationId)}/send-payment-request-email`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, to: email, userName, serviceName }),
    }
  );
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success !== true) {
    throw new Error(result.message || `Email server failed (${response.status}).`);
  }
  return result;
}
