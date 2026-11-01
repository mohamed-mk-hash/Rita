
import express from "express";
import multer from "multer";
import crypto from "node:crypto";

import {
  uploadStripeReceipt,
  readStripeReceipt,
  destroyStripeReceipt,
} from "./stripeCloudinaryStorage.js";

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const idPattern = /^\d{1,20}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const mimeExtensions = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const text = (value, limit) =>
  String(value ?? "").trim().slice(0, limit);

const errorJson = (res, status, message) =>
  res.status(status).json({
    success: false,
    error: message,
  });

const asyncRoute = (fn) =>
  (req, res, next) =>
    Promise.resolve(
      fn(req, res, next)
    ).catch(next);

// ======================================
// VALIDATE REAL IMAGE CONTENT
// ======================================

function actualMime(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    return null;
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from(
        "89504e470d0a1a0a",
        "hex"
      )
    )
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 3 &&
    buffer.subarray(0, 3).equals(
      Buffer.from("ffd8ff", "hex")
    )
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

// Hide Cloudinary storage references
// from ordinary client responses.
function publicProof(proof) {
  if (!proof) return null;

  const {
    status,
    reference,
    payerEmail,
    submittedAt,
    reviewedAt,
    reviewNote,
    verifiedTransactionId,
  } = proof;

  return {
    status,
    reference,
    payerEmail,
    submittedAt,
    reviewedAt,
    reviewNote,
    verifiedTransactionId,
  };
}

// ======================================
// STRIPE MANUAL PAYMENT ROUTER
// ======================================

export function createStripeManualPaymentRouter({
  db,
  resolveApplicationRef,
  ownsApplication,
  listPendingProofIds,
  requireClientAuth,
  requireAdminAuth,
  requireCsrf,
  notifyAdmin,
}) {
  const funcs = {
    resolveApplicationRef,
    ownsApplication,
    listPendingProofIds,
    requireClientAuth,
    requireAdminAuth,
    requireCsrf,
    notifyAdmin,
  };

  if (
    typeof db?.runTransaction !== "function" ||
    Object.values(funcs).some(
      (value) =>
        typeof value !== "function"
    )
  ) {
    throw new Error(
      "Stripe integration requires database, authentication, authorization and email adapters"
    );
  }

  const router = express.Router();

  // ====================================
  // MULTER IMAGE UPLOAD
  // ====================================

  const uploader = multer({
    storage: multer.memoryStorage(),

    limits: {
      fileSize: IMAGE_MAX_BYTES,
      files: 1,
      fields: 2,
    },

    fileFilter: (_req, file, callback) => {
      if (mimeExtensions[file.mimetype]) {
        callback(null, true);
      } else {
        callback(
          new Error(
            "Only PNG, JPEG or WEBP images are accepted"
          )
        );
      }
    },
  });

  const acceptScreenshot = (
    req,
    res,
    next
  ) => {
    uploader.single("screenshot")(
      req,
      res,
      (error) => {
        if (error) {
          return errorJson(
            res,
            400,
            "Invalid screenshot; use PNG, JPEG or WEBP (maximum 5 MB)"
          );
        }

        next();
      }
    );
  };

  // ====================================
  // FIND APPLICATION + CHECK OWNER
  // ====================================

  async function findApplication(
    req,
    res,
    requireOwner = false
  ) {
    const id = String(
      req.params.id || ""
    );

    if (!idPattern.test(id)) {
      errorJson(
        res,
        400,
        "Invalid application ID"
      );

      return null;
    }

    const ref =
      await resolveApplicationRef(id);

    if (!ref) {
      errorJson(
        res,
        404,
        "Application not found"
      );

      return null;
    }

    const snapshot = await ref.get();

    if (!snapshot.exists) {
      errorJson(
        res,
        404,
        "Application not found"
      );

      return null;
    }

    const data = snapshot.data();

    if (
      requireOwner &&
      (
        !req.user?.uid ||
        !ownsApplication(
          data,
          req.user
        )
      )
    ) {
      // Log field names, not sensitive values.
      console.warn(
        "STRIPE_OWNER_MISMATCH",
        {
          applicationId: id,

          ownerFieldNames:
            Object.keys(data).filter(
              (key) =>
                /owner|user|client|customer|createdBy/i.test(
                  key
                )
            ),

          linkedUserIdsCount:
            req.user?.identity?.userIds?.size ||
            0,

          linkedClientIdsCount:
            req.user?.identity?.clientIds?.size ||
            0,
        }
      );

      errorJson(
        res,
        403,
        "This application is not linked to your authenticated account"
      );

      return null;
    }

    return {
      ref,
      data,
    };
  }

  // ====================================
  // CLIENT: GET STRIPE PROOF
  // ====================================

  router.get(
    "/applications/:id/stripe-proof",
    requireClientAuth,

    asyncRoute(async (req, res) => {
      const app = await findApplication(
        req,
        res,
        true
      );

      if (!app) return;

      res.json({
        proof: publicProof(
          app.data.stripePaymentProof
        ),
      });
    })
  );

  // ====================================
  // CLIENT: UPLOAD STRIPE RECEIPT
  // ====================================

  router.post(
    "/applications/:id/stripe-proof",
    requireClientAuth,
    requireCsrf,
    acceptScreenshot,

    asyncRoute(async (req, res) => {
      const app = await findApplication(
        req,
        res,
        true
      );

      if (!app) return;

      if (
        app.data.status !== "waiting_payment" ||
        app.data.paymentStatus === "paid" ||
        ["pending", "approved"].includes(
          app.data.stripePaymentProof?.status
        )
      ) {
        return errorJson(
          res,
          409,
          "This application cannot accept a new payment receipt"
        );
      }

      const reference = text(
        req.body.reference,
        160
      );

      const payerEmail = text(
        req.body.payerEmail,
        254
      );

      const mime = actualMime(
        req.file?.buffer
      );

      if (
        reference.length < 5 ||
        String(
          req.body.reference ?? ""
        ).length > 160
      ) {
        return errorJson(
          res,
          400,
          "Invalid transaction reference"
        );
      }

      if (
        !emailPattern.test(
          payerEmail
        )
      ) {
        return errorJson(
          res,
          400,
          "Invalid payer email"
        );
      }

      if (
        !mime ||
        mime !== req.file?.mimetype
      ) {
        return errorJson(
          res,
          400,
          "Invalid image data"
        );
      }

      // Upload image to Cloudinary.
      const uploaded =
        await uploadStripeReceipt({
          buffer: req.file.buffer,
          mime,
        });

      const proof = {
        id: crypto.randomUUID(),

        status: "pending",
        reference,
        payerEmail,

        cloudinaryPublicId:
          uploaded.publicId,

        cloudinaryFormat:
          uploaded.format,

        cloudinarySecureUrl:
          uploaded.secureUrl,

        imageMime: mime,

        submittedAt:
          new Date().toISOString(),

        reviewedAt: "",
        reviewedByUid: "",
        reviewNote: "",
        verifiedTransactionId: "",
      };

      let oldAsset = "";

      // Save proof only if the client
      // still owns this application.
      try {
        await db.runTransaction(
          async (tx) => {
            const latest =
              await tx.get(app.ref);

            const data =
              latest.data();

            if (
              !latest.exists ||
              data.status !==
                "waiting_payment" ||
              data.paymentStatus ===
                "paid" ||
              ["pending", "approved"].includes(
                data.stripePaymentProof?.status
              ) ||
              !ownsApplication(
                data,
                req.user
              )
            ) {
              throw new Error(
                "NOT_ALLOWED"
              );
            }

            oldAsset =
              data.stripePaymentProof
                ?.cloudinaryPublicId ||
              "";

            tx.update(
              app.ref,
              {
                stripePaymentProof:
                  proof,

                stripeProofStatus:
                  "pending",

                paymentMethod:
                  "stripe_manual",
              }
            );
          }
        );
      } catch (error) {
        await destroyStripeReceipt(
          uploaded.publicId
        ).catch((err) => {
          console.error(
            "STRIPE_CLOUDINARY_CLEANUP_ERROR",
            err
          );
        });

        if (
          error.message ===
          "NOT_ALLOWED"
        ) {
          return errorJson(
            res,
            409,
            "Payment state changed, refresh the page"
          );
        }

        throw error;
      }

      // Unsigned Cloudinary assets may
      // require manual cleanup.
      if (
        oldAsset &&
        oldAsset !==
          uploaded.publicId
      ) {
        destroyStripeReceipt(
          oldAsset
        ).catch((err) => {
          console.error(
            "OLD_STRIPE_RECEIPT_CLEANUP_ERROR",
            err
          );
        });
      }

      // Notify admin after successful save.
      let adminEmailQueued = false;

      try {
        const result = await notifyAdmin({
          applicationId:
            String(req.params.id),

          reference,
          payerEmail,

          proofId: proof.id,
        });

        adminEmailQueued =
          result?.success === true;
      } catch (error) {
        console.error(
          "STRIPE_RECEIPT_ADMIN_EMAIL_ERROR",
          error
        );
      }

      return res.status(201).json({
        proof: publicProof(proof),
        adminEmailQueued,
      });
    })
  );

  // ====================================
  // ADMIN: PENDING RECEIPTS
  // ====================================

  router.get(
    "/admin/stripe-proofs/pending",
    requireAdminAuth,

    asyncRoute(async (_req, res) => {
      res.json({
        applicationIds:
          await listPendingProofIds(),
      });
    })
  );

  // ====================================
  // ADMIN: RECEIPT DETAILS
  // ====================================

  router.get(
    "/admin/applications/:id/stripe-proof",
    requireAdminAuth,

    asyncRoute(async (req, res) => {
      const app =
        await findApplication(
          req,
          res
        );

      if (!app) return;

      res.json({
        proof: publicProof(
          app.data.stripePaymentProof
        ),
      });
    })
  );

  // ====================================
  // ADMIN: IMAGE VIEW / DOWNLOAD
  // ====================================

  async function imageHandler(
    req,
    res,
    download = false
  ) {
    const app = await findApplication(
      req,
      res
    );

    if (!app) return;

    const proof =
      app.data.stripePaymentProof;

    if (
      !proof?.cloudinaryPublicId
    ) {
      return errorJson(
        res,
        404,
        "Receipt image unavailable"
      );
    }

    const data =
      await readStripeReceipt({
        publicId:
          proof.cloudinaryPublicId,

        format:
          proof.cloudinaryFormat,

        secureUrl:
          proof.cloudinarySecureUrl,
      });

    res.set(
      "Cache-Control",
      "private, no-store"
    );

    res.set(
      "X-Content-Type-Options",
      "nosniff"
    );

    res.set(
      "Content-Type",
      proof.imageMime ||
        "application/octet-stream"
    );

    if (download) {
      const extension =
        mimeExtensions[
          proof.imageMime
        ] || "png";

      res.set(
        "Content-Disposition",
        `attachment; filename="rita-stripe-receipt-${req.params.id}.${extension}"`
      );
    }

    res.send(data);
  }

  router.get(
    "/admin/applications/:id/stripe-proof/image",
    requireAdminAuth,

    asyncRoute((req, res) =>
      imageHandler(
        req,
        res
      )
    )
  );

  router.get(
    "/admin/applications/:id/stripe-proof/download",
    requireAdminAuth,

    asyncRoute((req, res) =>
      imageHandler(
        req,
        res,
        true
      )
    )
  );

  // ====================================
  // ADMIN: APPROVE OR REJECT RECEIPT
  // ====================================

  router.post(
    "/admin/applications/:id/stripe-proof/review",
    requireAdminAuth,
    requireCsrf,

    asyncRoute(async (req, res) => {
      const app =
        await findApplication(
          req,
          res
        );

      if (!app) return;

      const {
        decision,
        verificationConfirmed,
        amountConfirmed,
      } = req.body || {};

      const note = text(
        req.body?.note,
        1500
      );

      const verifiedTransactionId = text(
        req.body?.verifiedTransactionId,
        160
      );

      if (
        decision !== "approve" &&
        decision !== "reject"
      ) {
        return errorJson(
          res,
          400,
          "Invalid decision"
        );
      }

      if (
        decision === "reject" &&
        !note
      ) {
        return errorJson(
          res,
          400,
          "A rejection reason is required"
        );
      }

      if (
        decision === "approve" &&
        (
          verificationConfirmed !== true ||
          amountConfirmed !== true ||
          verifiedTransactionId.length < 5
        )
      ) {
        return errorJson(
          res,
          400,
          "Verify the transaction, amount and currency before approval"
        );
      }

      const changedAt =
        new Date().toISOString();

      try {
        await db.runTransaction(
          async (tx) => {
            const snap =
              await tx.get(app.ref);

            const data =
              snap.data();

            if (
              !snap.exists ||
              data.status !==
                "waiting_payment" ||
              data.paymentStatus ===
                "paid" ||
              data.stripePaymentProof
                ?.status !== "pending"
            ) {
              throw new Error(
                "NOT_ALLOWED"
              );
            }

            let transactionLock =
              null;

            if (
              decision ===
              "approve"
            ) {
              const digest =
                crypto
                  .createHash(
                    "sha256"
                  )
                  .update(
                    verifiedTransactionId
                      .toLowerCase()
                  )
                  .digest(
                    "hex"
                  );

              transactionLock = db
                .collection(
                  "stripeVerifiedTransactions"
                )
                .doc(digest);

              const existing =
                await tx.get(
                  transactionLock
                );

              if (
                existing.exists
              ) {
                throw new Error(
                  "TRANSACTION_ALREADY_USED"
                );
              }
            }

            const nextProof = {
              ...data.stripePaymentProof,

              status:
                decision ===
                "approve"
                  ? "approved"
                  : "rejected",

              reviewedAt:
                changedAt,

              reviewedByUid:
                String(
                  req.user.uid
                ),

              reviewNote: note,

              verifiedTransactionId:
                decision ===
                "approve"
                  ? verifiedTransactionId
                  : "",
            };

            const updates = {
              stripePaymentProof:
                nextProof,

              stripeProofStatus:
                nextProof.status,
            };

            if (
              decision ===
              "approve"
            ) {
              Object.assign(
                updates,
                {
                  paymentStatus:
                    "paid",

                  paymentMethod:
                    "stripe_manual",

                  status:
                    "paid",

                  currentStep:
                    "payment_received",

                  paymentVerifiedAt:
                    changedAt,

                  progress:
                    Math.max(
                      35,
                      Number(
                        data.progress ||
                        0
                      )
                    ),
                }
              );

              tx.create(
                transactionLock,
                {
                  applicationId:
                    String(
                      req.params.id
                    ),

                  verifiedTransactionId,

                  verifiedAt:
                    changedAt,

                  verifiedByUid:
                    String(
                      req.user.uid
                    ),
                }
              );
            }

            tx.update(
              app.ref,
              updates
            );
          }
        );
      } catch (error) {
        if (
          [
            "NOT_ALLOWED",
            "TRANSACTION_ALREADY_USED",
          ].includes(
            error.message
          )
        ) {
          return errorJson(
            res,
            409,
            error.message
          );
        }

        throw error;
      }

      return res.json({
        success: true,

        status:
          decision ===
          "approve"
            ? "paid"
            : "waiting_payment",
      });
    })
  );

  // ====================================
  // ERROR HANDLING
  // ====================================

  router.use(
    (error, _req, res, _next) => {
      console.error(
        "STRIPE_PROOF_ROUTER_ERROR:",
        error
      );

      if (!res.headersSent) {
        return errorJson(
          res,
          500,
          "Receipt operation failed"
        );
      }
    }
  );

  return router;
}
