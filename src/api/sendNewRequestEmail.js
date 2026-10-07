const EMAIL_API_URL =
  import.meta.env.VITE_EMAIL_API_URL ||
  "/api";

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
  const response = await fetch(
    `${EMAIL_API_URL}/send-new-request-email`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
      }),
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Could not send new request email."
    );
  }

  return data;
}
