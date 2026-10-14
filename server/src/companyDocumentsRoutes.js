
import { Router } from "express";
import { getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
  });
}

const router = Router();
const db = getFirestore();
const firebaseAuth = getAuth();

const allowedTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const MAX_SIZE = 15 * 1024 * 1024;

function error(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function handleError(res, err) {
  console.error("COMPANY_DOCUMENTS_ERROR:", err);

  const status = err.status || 500;

  return res.status(status).json({
    success: false,
    message:
      status === 500
        ? "Company document operation failed."
        : err.message,
  });
}

function validApplicationId(value) {
  const id = String(value || "");

  if (!/^\d{8,20}$/.test(id)) {
    throw error("Invalid application ID.");
  }

  return id;
}

function validDocumentId(value) {
  const id = String(value || "");

  if (!/^[a-zA-Z0-9]{1,100}$/.test(id)) {
    throw error("Invalid document ID.");
  }

  return id;
}

function validCloudinaryUrl(value) {
  try {
    const url = new URL(String(value || ""));

    if (
      url.protocol !== "https:" ||
      url.hostname !== "res.cloudinary.com"
    ) {
      return false;
    }

    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ||
      "dxlwd7nhi";

    return url.pathname.startsWith(
      `/${cloudName}/`
    ) && /\/(image|raw)\/upload\//.test(
      url.pathname
    );
  } catch {
    return false;
  }
}

function isoDate(value) {
  if (typeof value === "string") {
    return value;
  }

  if (value?.toDate) {
    return value.toDate().toISOString();
  }

  return null;
}

function mapDocument(snapshot) {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    applicationId: Number(data.application_id),
    userId: String(data.user_id || ""),
    title: String(data.title || ""),
    description: String(data.description || ""),
    fileName: String(data.file_name || ""),
    mimeType: String(data.mime_type || ""),
    fileSize: Number(data.file_size || 0),
    fileUrl: String(data.file_url || ""),
    storagePath: String(data.storage_path || ""),
    published: data.published === true,
    createdAt: isoDate(data.created_at),
  };
}

// ------------------------------------------------
// LOGIN CHECK
// ------------------------------------------------

async function requireLogin(req, res, next) {
  try {
    const match = /^Bearer (.+)$/i.exec(
      req.get("authorization") || ""
    );

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Please sign in.",
      });
    }

    const decoded = await firebaseAuth.verifyIdToken(
      match[1],
      true
    );

    req.uid = decoded.uid;

    const user = await db
      .collection("users")
      .doc(decoded.uid)
      .get();

    req.staff =
      user.exists &&
      user.get("status") === "active" &&
      ["admin", "staff"].includes(
        user.get("role")
      );

    return next();
  } catch (err) {
    console.error("COMPANY_DOCUMENT_AUTH_ERROR:", err.code);

    return res.status(401).json({
      success: false,
      message: "Invalid Firebase session.",
    });
  }
}

router.use(requireLogin);

function requireStaff(req, res, next) {
  if (!req.staff) {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }

  next();
}

// ------------------------------------------------
// APPLICATION LOOKUP
// ------------------------------------------------

async function getApplication(id) {
  const applicationId = validApplicationId(id);

  const snapshot = await db
    .collection("applications")
    .doc(applicationId)
    .get();

  if (!snapshot.exists) {
    throw error("Application not found.", 404);
  }

  return snapshot;
}

async function getCompanyDocument(id) {
  const snapshot = await db
    .collection("company_documents")
    .doc(validDocumentId(id))
    .get();

  if (!snapshot.exists) {
    throw error("Document not found.", 404);
  }

  return snapshot;
}

function assertOwner(application, req) {
  if (
    !req.staff &&
    application.get("user_id") !== req.uid
  ) {
    throw error("Access denied.", 403);
  }
}

async function getDocumentsForApplication(applicationId) {
  const id = validApplicationId(applicationId);

  const [numeric, textual] = await Promise.all([
    db.collection("company_documents")
      .where("application_id", "==", Number(id))
      .get(),

    db.collection("company_documents")
      .where("application_id", "==", id)
      .get(),
  ]);

  const results = new Map();

  for (const item of [...numeric.docs, ...textual.docs]) {
    results.set(item.id, mapDocument(item));
  }

  return [...results.values()].sort(
    (a, b) =>
      String(b.createdAt || "").localeCompare(
        String(a.createdAt || "")
      )
  );
}

// ------------------------------------------------
// ADMIN: LIST
// ------------------------------------------------

router.get(
  "/admin/applications/:id/company-documents",
  requireStaff,
  async (req, res) => {
    try {
      await getApplication(req.params.id);

      const documents = await getDocumentsForApplication(
        req.params.id
      );

      return res.json({
        success: true,
        documents,
      });
    } catch (err) {
      return handleError(res, err);
    }
  }
);

// ------------------------------------------------
// ADMIN: SAVE UPLOADED DOCUMENT METADATA
// ------------------------------------------------

// The frontend uploads the file using the existing
// unsigned Cloudinary preset first, then sends
// the resulting URL and metadata here.

router.post(
  "/admin/applications/:id/company-documents",
  requireStaff,
  async (req, res) => {
    try {
      const application = await getApplication(
        req.params.id
      );

      const status = String(
        application.get("status") || ""
      );

      if (!["processing", "completed"].includes(status)) {
        throw error(
          "Start processing or complete the service before uploading company documents.",
          409
        );
      }

      const {
        title,
        description,
        fileName,
        mimeType,
        fileSize,
        fileUrl,
      } = req.body || {};

      const safeTitle = String(title || "").trim();
      const safeDescription = String(
        description || ""
      ).trim();
      const safeFileName = String(fileName || "").trim();
      const size = Number(fileSize);

      if (!safeTitle || safeTitle.length > 150) {
        throw error("Invalid document title.");
      }

      if (safeDescription.length > 2000) {
        throw error("Description is too long.");
      }

      if (
        !safeFileName ||
        safeFileName.length > 255
      ) {
        throw error("Invalid file name.");
      }

      if (!allowedTypes.has(mimeType)) {
        throw error("Only PDF, PNG and JPEG are allowed.");
      }

      if (
        !Number.isFinite(size) ||
        size <= 0 ||
        size > MAX_SIZE
      ) {
        throw error("File must not exceed 15 MB.");
      }

      if (!validCloudinaryUrl(fileUrl)) {
        throw error("Invalid Cloudinary file URL.");
      }

      const ownerId = String(
        application.get("user_id") || ""
      );

      if (!ownerId) {
        throw error("Application owner is missing.", 409);
      }

      const reference = db
        .collection("company_documents")
        .doc();

      await reference.set({
        application_id: Number(req.params.id),
        user_id: ownerId,
        title: safeTitle,
        description: safeDescription,
        file_name: safeFileName,
        mime_type: mimeType,
        file_size: size,
        file_url: fileUrl,
        storage_path: "",
        published: false,
        upload_state: "ready",
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });

      const saved = await reference.get();

      return res.status(201).json({
        success: true,
        document: mapDocument(saved),
      });
    } catch (err) {
      return handleError(res, err);
    }
  }
);

// ------------------------------------------------
// ADMIN: PUBLISH OR UNPUBLISH
// ------------------------------------------------

router.patch(
  "/admin/company-documents/:id",
  requireStaff,
  async (req, res) => {
    try {
      const snapshot = await getCompanyDocument(
        req.params.id
      );

      if (typeof req.body?.published !== "boolean") {
        throw error("published must be boolean.");
      }

      const published = req.body.published;

      if (published) {
        if (snapshot.get("upload_state") !== "ready") {
          throw error("Document upload is not ready.", 409);
        }

        const application = await getApplication(
          snapshot.get("application_id")
        );

        if (
          !["processing", "completed"].includes(
            application.get("status")
          )
        ) {
          throw error(
            "Service must be processing or completed.",
            409
          );
        }
      }

      await snapshot.ref.update({
        published,
        updated_at: FieldValue.serverTimestamp(),
      });

      return res.json({
        success: true,
        published,
      });
    } catch (err) {
      return handleError(res, err);
    }
  }
);

// ------------------------------------------------
// ADMIN: DELETE METADATA
// ------------------------------------------------

// This deletes the Firestore record.
// Unsigned Cloudinary uploads cannot be securely
// deleted from here without server-side credentials.

router.delete(
  "/admin/company-documents/:id",
  requireStaff,
  async (req, res) => {
    try {
      const snapshot = await getCompanyDocument(
        req.params.id
      );

      await snapshot.ref.delete();

      return res.json({
        success: true,
      });
    } catch (err) {
      return handleError(res, err);
    }
  }
);

// ------------------------------------------------
// CLIENT: LIST PUBLISHED DOCUMENTS
// ------------------------------------------------

router.get(
  "/applications/:id/company-documents",
  async (req, res) => {
    try {
      const application = await getApplication(
        req.params.id
      );

      assertOwner(application, req);

      const documents = await getDocumentsForApplication(
        req.params.id
      );

      const visible = req.staff
        ? documents
        : documents.filter(
            (item) => item.published
          );

      return res.json({
        success: true,
        documents: visible,
      });
    } catch (err) {
      return handleError(res, err);
    }
  }
);

// ------------------------------------------------
// CLIENT OR STAFF: GET FILE URL
// ------------------------------------------------

router.get(
  "/company-documents/:id/file",
  async (req, res) => {
    try {
      const snapshot = await getCompanyDocument(
        req.params.id
      );

      const application = await getApplication(
        snapshot.get("application_id")
      );

      assertOwner(application, req);

      if (
        !req.staff &&
        snapshot.get("published") !== true
      ) {
        throw error("Document is not published.", 403);
      }

      const fileUrl = String(
        snapshot.get("file_url") || ""
      );

      if (!validCloudinaryUrl(fileUrl)) {
        throw error("Document file URL is invalid.", 409);
      }

      return res.json({
        success: true,
        url: fileUrl,
        fileName: String(
          snapshot.get("file_name") || "document"
        ),
        mimeType: String(
          snapshot.get("mime_type") ||
          "application/octet-stream"
        ),
      });
    } catch (err) {
      return handleError(res, err);
    }
  }
);

export default router;
