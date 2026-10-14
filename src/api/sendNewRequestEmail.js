
import { auth } from "../firebase.js";

// Works with both:
// VITE_EMAIL_API_URL=http://127.0.0.1:5010
// VITE_EMAIL_API_URL=http://127.0.0.1:5010/api

const RAW_API_URL =
  import.meta.env.VITE_EMAIL_API_URL ||
  "http://127.0.0.1:5010";

const API_BASE = RAW_API_URL
  .trim()
  .replace(/\/+$/, "")
  .replace(/(?:\/api)+$/, "");

const EMAIL_ENDPOINT =
  `${API_BASE}/api/send-new-request-email`;

async function getFirebaseToken() {
  if (typeof auth.authStateReady === "function") {
    await auth.authStateReady();
  }

  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "Please sign in before requesting a service."
    );
  }

  return user.getIdToken();
}

export async function sendNewRequestEmailRequest({
  userName = "",
  userEmail = "",
  phone = "",
  country = "",
  applicationId = "",
  serviceName = "",
  packageName = "",
  packagePrice = "",
  desiredCompanyName = "",
  businessActivity = "",
  requestedSolutions = "",
  extraNotes = "",
}) {
  const payload = {
    userName,
    userEmail,
    phone,
    country,
    applicationId,
    serviceName,
    packageName,
    packagePrice,
    desiredCompanyName,
    businessActivity,
    requestedSolutions,
    extraNotes,
  };

  let token = await getFirebaseToken();

  async function sendRequest() {
    return fetch(EMAIL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  }

  let response;

  try {
    response = await sendRequest();

    // Refresh the login token once if needed.
    if (
      response.status === 401 &&
      auth.currentUser
    ) {
      token = await auth.currentUser.getIdToken(true);
      response = await sendRequest();
    }
  } catch (error) {
    console.error(
      "NEW_REQUEST_EMAIL_CONNECTION_ERROR:",
      error
    );

    throw new Error(
      "Cannot connect to the email server."
    );
  }

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok || data.success !== true) {
    console.error(
      "NEW_REQUEST_EMAIL_SERVER_ERROR:",
      {
        url: EMAIL_ENDPOINT,
        status: response.status,
        message: data.message,
      }
    );

    throw new Error(
      data.message ||
      `Could not send the admin email (${response.status}).`
    );
  }

  if (data.emailStatus === "sent") {
    console.log(
      "ADMIN_EMAIL_SMTP_ACCEPTED:",
      data.messageId
    );
  } else if (data.emailStatus === "pending") {
    console.warn(
      "ADMIN_EMAIL_PENDING_RETRY:",
      data.jobId
    );
  }

  return data;
}
