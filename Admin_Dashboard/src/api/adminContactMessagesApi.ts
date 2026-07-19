const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export type ContactMessageStatus =
  | "new"
  | "read"
  | "replied"
  | "archived";

export interface AdminContactMessageSummary {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  subject: string;
  messagePreview: string;
  status: ContactMessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminContactMessage {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
  updatedAt: string;
}

interface MessagesResponse {
  messages: AdminContactMessageSummary[];
}

interface MessageResponse {
  message: AdminContactMessage;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },

      credentials: "include",
    }
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "The request could not be completed"
    );
  }

  return data as T;
}

export function getAdminContactMessages(
  options: {
    search?: string;
    status?: ContactMessageStatus | "";
  } = {}
) {
  const query = new URLSearchParams();

  if (options.search?.trim()) {
    query.set(
      "search",
      options.search.trim()
    );
  }

  if (options.status) {
    query.set("status", options.status);
  }

  const queryString = query.toString();

  return request<MessagesResponse>(
    `/admin/contact-messages${
      queryString ? `?${queryString}` : ""
    }`
  );
}

export function getAdminContactMessage(
  messageId: number
) {
  return request<MessageResponse>(
    `/admin/contact-messages/${messageId}`
  );
}

export function updateAdminContactMessageStatus(
  messageId: number,
  status: ContactMessageStatus
) {
  return request<MessageResponse>(
    `/admin/contact-messages/${messageId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
      }),
    }
  );
}