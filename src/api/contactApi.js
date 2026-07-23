const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "Could not send the contact message"
    );
  }

  return data;
}

export function sendContactMessageRequest(payload) {
  return request("/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
