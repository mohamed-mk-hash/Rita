
import { auth } from "../firebase.js";

const RAW_BASE =
  import.meta.env.VITE_PAYPAL_API_URL ||
  import.meta.env.VITE_EMAIL_API_URL ||
  "http://127.0.0.1:5010";

const BASE = String(RAW_BASE)
  .trim()
  .replace(/\/+$/, "")
  .replace(/(?:\/api(?:\/paypal)?)$/, "");

const API = `${BASE}/api/paypal`;

export async function getPayPalClientConfig() {
  const response = await fetch(
    `${API}/client-config`
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok || !data.clientId) {
    throw new Error(
      data.message ||
      "PayPal is not configured."
    );
  }

  return data;
}

async function request(
  path,
  options = {}
) {
  if (
    typeof auth.authStateReady ===
    "function"
  ) {
    await auth.authStateReady();
  }

  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "Please sign in to continue."
    );
  }

  let token =
    await user.getIdToken();

  async function perform() {
    return fetch(`${API}${path}`, {
      ...options,

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,

        ...options.headers,
      },
    });
  }

  let response = await perform();

  if (response.status === 401) {
    token =
      await user.getIdToken(true);

    response = await perform();
  }

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
      `Payment request failed (${response.status}).`
    );
  }

  return data;
}

export function getPaymentQuote(
  applicationId
) {
  return request(
    `/applications/${encodeURIComponent(
      applicationId
    )}/quote`
  );
}

export function createPayPalOrder(
  applicationId
) {
  return request(
    `/applications/${encodeURIComponent(
      applicationId
    )}/create-order`,
    {
      method: "POST",
    }
  );
}

export function capturePayPalOrder(
  applicationId,
  orderId
) {
  return request(
    `/applications/${encodeURIComponent(
      applicationId
    )}/capture-order`,
    {
      method: "POST",

      body: JSON.stringify({
        orderId,
      }),
    }
  );
}
