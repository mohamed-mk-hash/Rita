
import dotenv from "dotenv";
import { readFile } from "node:fs/promises";

// Read the existing .env files automatically.
const ENV_FILES = [
  new URL("../.env", import.meta.url),
  new URL("../../.env", import.meta.url),
  new URL("../../Admin_Dashboard/.env", import.meta.url),
];

const MIME_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

let settingsPromise;

async function getSettings() {
  if (!settingsPromise) {
    settingsPromise = (async () => {
      const values = { ...process.env };

      for (const path of ENV_FILES) {
        try {
          const parsed = dotenv.parse(await readFile(path));

          for (const key of [
            "VITE_CLOUDINARY_CLOUD_NAME",
            "VITE_CLOUDINARY_UPLOAD_PRESET",
          ]) {
            if (!values[key] && parsed[key]) {
              values[key] = parsed[key];
            }
          }
        } catch (error) {
          if (error.code !== "ENOENT") {
            throw error;
          }
        }
      }

      const cloudName = String(
        values.VITE_CLOUDINARY_CLOUD_NAME || ""
      ).trim();

      const uploadPreset = String(
        values.VITE_CLOUDINARY_UPLOAD_PRESET || ""
      ).trim();

      if (
        !/^[a-zA-Z0-9_-]+$/.test(cloudName) ||
        !/^[a-zA-Z0-9_-]+$/.test(uploadPreset)
      ) {
        throw new Error(
          "Cloudinary configuration missing in .env"
        );
      }

      return { cloudName, uploadPreset };
    })();
  }

  return settingsPromise;
}

// Verify configuration before enabling receipt uploads.
export async function configureStripeCloudinary() {
  if (
    typeof fetch !== "function" ||
    typeof FormData !== "function" ||
    typeof Blob !== "function" ||
    typeof AbortSignal.timeout !== "function"
  ) {
    console.error("Node.js 18+ is required.");
    return false;
  }

  try {
    await getSettings();
    return true;
  } catch (error) {
    console.error(
      "CLOUDINARY_CONFIGURATION_ERROR:",
      error.message
    );
    return false;
  }
}

function validPublicId(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 400 &&
    /^[a-zA-Z0-9_/-]+$/.test(value) &&
    value.split("/").every(
      segment =>
        segment &&
        segment !== "." &&
        segment !== ".."
    )
  );
}

function checkedDeliveryUrl(
  raw,
  { cloudName, publicId, format }
) {
  const url = new URL(raw);

  if (
    url.protocol !== "https:" ||
    url.hostname !== "res.cloudinary.com" ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.pathname.startsWith(
      `/${cloudName}/image/upload/`
    ) ||
    !url.pathname.endsWith(
      `/${publicId}.${format}`
    )
  ) {
    throw new Error(
      "Unexpected Cloudinary image URL."
    );
  }

  return url.toString();
}

// Upload receipt using UNSIGNED preset.
export async function uploadStripeReceipt({
  buffer,
  mime,
}) {
  const { cloudName, uploadPreset } =
    await getSettings();

  const extension = MIME_EXTENSIONS[mime];

  if (
    !extension ||
    !Buffer.isBuffer(buffer) ||
    !buffer.length ||
    buffer.length > 5 * 1024 * 1024
  ) {
    throw new Error(
      "Receipt must be JPEG, PNG or WEBP, max 5 MB."
    );
  }

  const body = new FormData();

  body.set("upload_preset", uploadPreset);

  body.set(
    "file",
    new Blob([buffer], { type: mime }),
    `receipt.${extension}`
  );

  body.set("folder", "rita/stripe-receipts");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body,
      signal: AbortSignal.timeout(30000),
    }
  );

  const result = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `Cloudinary upload failed (${response.status}): ${
        String(
          result?.error?.message ||
          "Check the unsigned preset"
        ).slice(0, 180)
      }`
    );
  }

  if (
    !validPublicId(result.public_id) ||
    !["jpg", "jpeg", "png", "webp"].includes(
      result.format
    ) ||
    result.resource_type !== "image" ||
    result.type !== "upload" ||
    !Number.isSafeInteger(result.bytes) ||
    result.bytes > 5 * 1024 * 1024
  ) {
    throw new Error(
      "Unexpected Cloudinary upload response."
    );
  }

  return {
    publicId: result.public_id,
    format: result.format,
    bytes: result.bytes,
    secureUrl: checkedDeliveryUrl(
      result.secure_url,
      {
        cloudName,
        publicId: result.public_id,
        format: result.format,
      }
    ),
  };
}

// Retrieve receipt so admin can view or download it.
export async function readStripeReceipt({
  publicId,
  format,
  secureUrl,
}) {
  const { cloudName } = await getSettings();

  if (
    !validPublicId(publicId) ||
    !["jpg", "jpeg", "png", "webp"].includes(
      format
    )
  ) {
    throw new Error(
      "Invalid stored receipt reference."
    );
  }

  const fallback =
    `https://res.cloudinary.com/${cloudName}` +
    `/image/upload/${publicId}.${format}`;

  const url = checkedDeliveryUrl(
    secureUrl || fallback,
    { cloudName, publicId, format }
  );

  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(20000),
  });

  if (
    !response.ok ||
    !(response.headers.get("content-type") || "")
      .toLowerCase()
      .startsWith("image/")
  ) {
    throw new Error(
      "Cloudinary image cannot be downloaded."
    );
  }

  const chunks = [];
  let size = 0;

  for await (const chunk of response.body) {
    size += chunk.byteLength;

    if (size > 8 * 1024 * 1024) {
      throw new Error(
        "Receipt image is too large."
      );
    }

    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

// Unsigned uploads cannot delete Cloudinary assets.
export async function destroyStripeReceipt() {
  return false;
}
