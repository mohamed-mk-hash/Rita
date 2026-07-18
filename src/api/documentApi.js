const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function readJsonSafely(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    ...options,
  });

  const data = await readJsonSafely(response);

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

export function getApplicationDocumentsRequest(applicationId) {
  return requestJson(
    `${API_BASE_URL}/documents/application/${applicationId}`
  );
}

export function uploadApplicationDocumentRequest(
  applicationId,
  requirementId,
  file
) {
  const formData = new FormData();
  formData.append("document", file);

  return requestJson(
    `${API_BASE_URL}/documents/application/${applicationId}/requirement/${requirementId}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );
}

export async function downloadApplicationDocumentRequest(documentId) {
  const response = await fetch(
    `${API_BASE_URL}/documents/${documentId}/download`,
    {
      credentials: "include",
    }
  );

  if (!response.ok) {
    const data = await readJsonSafely(response);
    throw new Error(data?.message || "Could not download the document");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const regularMatch = disposition.match(/filename="?([^";]+)"?/i);

  let filename = `document-${documentId}`;

  try {
    if (utf8Match?.[1]) {
      filename = decodeURIComponent(utf8Match[1]);
    } else if (regularMatch?.[1]) {
      filename = regularMatch[1];
    }
  } catch {
    filename = regularMatch?.[1] || filename;
  }

  return { blob, filename };
}

export function deleteApplicationDocumentRequest(documentId) {
  return requestJson(`${API_BASE_URL}/documents/${documentId}/file`, {
    method: "DELETE",
  });
}
