
import { getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const configuredApi =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "";

const IMAGE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHED_IMAGES = 3;

type ImageCacheEntry = {
  blob: Blob;
  savedAt: number;
};

const imageCache = new Map<string, ImageCacheEntry>();
const pendingImages = new Map<string, Promise<Blob>>();

let lastIdentity = "";

function apiBase(): string {
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

  return "";
}

function currentIdentity(): string {
  const app = getApps()[0];

  if (!app) return "";

  return getAuth(app).currentUser?.uid || "";
}

function imageKey(applicationId: number): string {
  const identity = currentIdentity();

  if (identity !== lastIdentity) {
    imageCache.clear();
    pendingImages.clear();
    lastIdentity = identity;
  }

  return `${identity || "unidentified"}:${applicationId}`;
}

async function authHeaders(
  existing?: HeadersInit
): Promise<Headers> {
  const headers = new Headers(existing);

  const app = getApps()[0];

  if (!app) return headers;

  const auth = getAuth(app);

  if (
    typeof auth.authStateReady === "function"
  ) {
    await auth.authStateReady();
  }

  if (auth.currentUser) {
    headers.set(
      "Authorization",
      `Bearer ${await auth.currentUser.getIdToken()}`
    );
  }

  return headers;
}

async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = `${apiBase()}${path}`;

  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      credentials: "include",
      headers: await authHeaders(init.headers),
    });
  } catch (error) {
    console.error(
      "STRIPE_ADMIN_NETWORK_ERROR",
      { path, error }
    );

    throw new Error(
      "تعذر الاتصال بخادم Rita. تحقق من اتصال الإنترنت أو Express."
    );
  }

  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({}));

    const reason =
      body?.error ||
      body?.message ||
      `HTTP ${response.status}`;

    throw new Error(
      response.status === 401
        ? `جلسة الإدارة غير صالحة: ${reason}`
        : reason
    );
  }

  return response;
}

async function jsonRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await apiFetch(path, init);

  if (
    !(
      response.headers.get("content-type") || ""
    ).includes("application/json")
  ) {
    throw new Error(
      "الخادم لم يعد JSON. تأكد من إعداد مسار /api."
    );
  }

  return (await response.json()) as T;
}

export type StripeProof = {
  status: "pending" | "approved" | "rejected";
  reference: string;
  payerEmail: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewNote?: string;
  verifiedTransactionId?: string;
};

function appPath(applicationId: number): string {
  if (
    !Number.isSafeInteger(applicationId) ||
    applicationId <= 0
  ) {
    throw new Error("Invalid application ID");
  }

  return `/api/admin/applications/${applicationId}/stripe-proof`;
}

export function getAdminStripeProof(
  applicationId: number
) {
  return jsonRequest<{
    proof: StripeProof | null;
  }>(appPath(applicationId));
}

export function listPendingStripeProofs() {
  return jsonRequest<{
    applicationIds: string[];
  }>("/api/admin/stripe-proofs/pending");
}

export function reviewAdminStripeProof(
  applicationId: number,
  payload: {
    decision: "approve" | "reject";
    verificationConfirmed?: boolean;
    amountConfirmed?: boolean;
    verifiedTransactionId?: string;
    note?: string;
  }
) {
  return jsonRequest<{
    success: boolean;
    status: string;
  }>(`${appPath(applicationId)}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

async function receiptBlob(
  applicationId: number
): Promise<Blob> {
  const key = imageKey(applicationId);
  const existing = imageCache.get(key);

  if (
    existing &&
    Date.now() - existing.savedAt < IMAGE_TTL_MS
  ) {
    return existing.blob;
  }

  if (pendingImages.has(key)) {
    return pendingImages.get(key)!;
  }

  const request = (async () => {
    const response = await apiFetch(
      `${appPath(applicationId)}/image`
    );

    const blob = await response.blob();

    if (!blob.type.startsWith("image/")) {
      throw new Error(
        "الإيصال المسترجع ليس صورة."
      );
    }

    if (
      currentIdentity() &&
      key === imageKey(applicationId)
    ) {
      imageCache.set(key, {
        blob,
        savedAt: Date.now(),
      });

      while (
        imageCache.size > MAX_CACHED_IMAGES
      ) {
        const firstKey = imageCache
          .keys()
          .next()
          .value;

        if (firstKey) {
          imageCache.delete(firstKey);
        } else {
          break;
        }
      }
    }

    return blob;
  })();

  pendingImages.set(key, request);

  try {
    return await request;
  } finally {
    pendingImages.delete(key);
  }
}

export function preloadAdminStripeProofImage(
  applicationId: number
): void {
  void receiptBlob(applicationId).catch(() => {
    // Errors appear when admin opens the image.
  });
}

export function clearAdminStripeProofImageCache(
  applicationId?: number
): void {
  if (applicationId === undefined) {
    imageCache.clear();
    pendingImages.clear();
    return;
  }

  for (const key of imageCache.keys()) {
    if (key.endsWith(`:${applicationId}`)) {
      imageCache.delete(key);
    }
  }
}

function extension(blob: Blob): string {
  return blob.type.includes("jpeg")
    ? "jpg"
    : blob.type.includes("webp")
      ? "webp"
      : "png";
}

export async function openAdminStripeProofImage(
  applicationId: number
): Promise<void> {
  const tab = window.open("", "_blank");

  if (tab) {
    tab.document.title = "Rita Stripe receipt";
    tab.document.body.textContent = "Loading receipt...";
  }

  try {
    const blob = await receiptBlob(applicationId);
    const objectUrl = URL.createObjectURL(blob);

    if (tab) {
      tab.location.replace(objectUrl);
    } else {
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download =
        `rita-stripe-receipt-${applicationId}.${extension(blob)}`;
      link.click();
    }

    window.setTimeout(
      () => URL.revokeObjectURL(objectUrl),
      5 * 60 * 1000
    );
  } catch (error) {
    tab?.close();
    throw error;
  }
}

export async function downloadAdminStripeProofImage(
  applicationId: number
): Promise<void> {
  const blob = await receiptBlob(applicationId);
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = objectUrl;
  link.download =
    `rita-stripe-receipt-${applicationId}.${extension(blob)}`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(
    () => URL.revokeObjectURL(objectUrl),
    60 * 1000
  );
}
