
import { getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const configuredApi =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "";

function getApiBase() {
  if (configuredApi.trim()) {
    return configuredApi
      .trim()
      .replace(/\/api\/?$/, "")
      .replace(/\/$/, "");
  }

  if (
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(
      window.location.hostname
    )
  ) {
    return "http://127.0.0.1:5010";
  }

  // Production uses the site's /api reverse proxy.
  return "";
}

async function getFirebaseIdToken() {
  const app = getApps()[0];

  if (!app) return null;

  const auth = getAuth(app);

  if (typeof auth.authStateReady === "function") {
    await auth.authStateReady();
  }

  return auth.currentUser
    ? await auth.currentUser.getIdToken()
    : null;
}

async function apiRequest(path, options = {}) {
  const headers = new Headers(
    options.headers || {}
  );

  const token = await getFirebaseIdToken();

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const url = `${getApiBase()}${path}`;
  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch (cause) {
    console.error(
      "STRIPE_RECEIPT_NETWORK_ERROR",
      { url, cause }
    );

    throw new Error(
      "تعذر الاتصال بخادم Rita. تأكد أن Express يعمل على المنفذ 5010 وأن عنوان API صحيح."
    );
  }

  const contentType =
    response.headers.get("content-type") || "";

  const data = contentType.includes(
    "application/json"
  )
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    console.error(
      "STRIPE_RECEIPT_HTTP_ERROR",
      {
        url,
        status: response.status,
        details:
          data?.error ||
          data?.message ||
          "",
      }
    );

    const reason =
      data?.error ||
      data?.message ||
      `HTTP ${response.status}`;

    if (response.status === 401) {
      throw new Error(
        `يجب تسجيل الدخول بجلسة يقبلها خادم Rita. (${reason})`
      );
    }

    if (response.status === 403) {
      throw new Error(
        `لا تملك صلاحية رفع الإيصال لهذا الطلب أو أن المصدر مرفوض. (${reason})`
      );
    }

    if (response.status === 404) {
      throw new Error(
        `الطلب أو مسار API غير موجود. تحقق من رقم الطلب وربط Express. (${reason})`
      );
    }

    if (response.status === 409) {
      throw new Error(
        `حالة الطلب لا تسمح بالرفع الآن. (${reason})`
      );
    }

    throw new Error(
      `تعذر إرسال إثبات الدفع: ${reason}`
    );
  }

  if (!data || typeof data !== "object") {
    throw new Error(
      "أعاد الخادم ردًا غير متوقع بدل JSON. تأكد أن الطلب وصل إلى Express لا إلى Vite."
    );
  }

  return data;
}

function proofUrl(applicationId) {
  if (
    !/^\d{1,20}$/.test(String(applicationId))
  ) {
    throw new Error(
      "رقم الطلب غير صالح."
    );
  }

  return (
    `/api/applications/` +
    `${encodeURIComponent(String(applicationId))}` +
    `/stripe-proof`
  );
}

export function getStripeProofRequest(
  applicationId
) {
  return apiRequest(
    proofUrl(applicationId)
  );
}

export function submitStripeProofRequest(
  applicationId,
  { screenshot, reference, payerEmail }
) {
  const body = new FormData();

  body.set("screenshot", screenshot);
  body.set("reference", reference.trim());
  body.set("payerEmail", payerEmail.trim());

  // Do not set Content-Type manually.
  // Fetch automatically adds the multipart boundary.
  return apiRequest(
    proofUrl(applicationId),
    {
      method: "POST",
      body,
    }
  );
}
