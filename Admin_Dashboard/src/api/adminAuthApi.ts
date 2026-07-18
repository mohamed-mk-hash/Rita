const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

interface AdminUser {
  id: number;
  fullName: string;
  companyName: string | null;
  email: string;
  role: "admin" | "staff";
  status: string;
}

interface LoginResponse {
  message: string;
  admin: AdminUser;
}

interface CurrentAdminResponse {
  admin: AdminUser;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,

    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },

    // مهم جداً حتى يرسل المتصفح Cookie الإدارة
    credentials: "include",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || "The request could not be completed"
    );
  }

  return data as T;
}

export function adminLoginRequest(
  email: string,
  password: string
) {
  return request<LoginResponse>("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export function getCurrentAdminRequest() {
  return request<CurrentAdminResponse>("/admin/auth/me");
}

export function adminLogoutRequest() {
  return request<{ message: string }>(
    "/admin/auth/logout",
    {
      method: "POST",
    }
  );
}

export type { AdminUser };