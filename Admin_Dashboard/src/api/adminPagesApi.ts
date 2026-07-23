import type {
  AdminWebsitePage,
  JsonObject,
} from "../types/pageContent";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export type WebsitePageKey =
  | "home"
  | "about"
  | "contact"
  | "pricing"
  | "services";

interface PageResponse {
  message?: string;
  page: AdminWebsitePage;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "Something went wrong"
    );
  }

  return data as T;
}

export function getAdminPage(
  pageKey: WebsitePageKey
) {
  return request<PageResponse>(
    `/admin/pages/${pageKey}`
  );
}

export function saveAdminPageDraft(
  pageKey: WebsitePageKey,
  content: JsonObject,
  version: number
) {
  return request<PageResponse>(
    `/admin/pages/${pageKey}/draft`,
    {
      method: "PUT",
      body: JSON.stringify({
        content,
        version,
      }),
    }
  );
}

export function publishAdminPage(
  pageKey: WebsitePageKey,
  version: number
) {
  return request<PageResponse>(
    `/admin/pages/${pageKey}/publish`,
    {
      method: "POST",
      body: JSON.stringify({ version }),
    }
  );
}

export function restoreAdminPageDraft(
  pageKey: WebsitePageKey,
  version: number
) {
  return request<PageResponse>(
    `/admin/pages/${pageKey}/restore`,
    {
      method: "POST",
      body: JSON.stringify({ version }),
    }
  );
}

/* Backward-compatible home helpers. */
export function getAdminHomePage() {
  return getAdminPage("home");
}

export function saveAdminHomePageDraft(
  content: JsonObject,
  version: number
) {
  return saveAdminPageDraft(
    "home",
    content,
    version
  );
}

export function publishAdminHomePage(
  version: number
) {
  return publishAdminPage("home", version);
}

export function restoreAdminHomePageDraft(
  version: number
) {
  return restoreAdminPageDraft(
    "home",
    version
  );
}
