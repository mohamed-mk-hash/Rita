const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export function getPublicPage(pageKey) {
  return request(`/pages/${encodeURIComponent(pageKey)}`, {
    cache: "no-store",
  });
}

export function getPublicHomePage() {
  return getPublicPage("home");
}

export function getPublicAboutPage() {
  return getPublicPage("about");
}

export function getPublicContactPage() {
  return getPublicPage("contact");
}

export function getPublicPricingPage() {
  return getPublicPage("pricing");
}

export function getPublicServicesPage() {
  return getPublicPage("services");
}
