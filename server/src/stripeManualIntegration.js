
/**
 * Rita Digital Services
 * Stripe Manual Payment - Authentication & Ownership
 *
 * No .env changes.
 * No ritaCors.js dependency.
 */

const COLLECTIONS = [
  "applications",
  "serviceRequests",
];

function cleanId(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "";
  }

  return String(value).trim();
}

function getCookie(req, name) {
  const entry = String(req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) =>
      part.startsWith(`${name}=`)
    );

  return entry
    ? decodeURIComponent(
        entry.slice(name.length + 1)
      )
    : "";
}

function addId(set, value) {
  const id = cleanId(value);

  if (id) {
    set.add(id);
  }
}

// ======================================
// VERIFY APPLICATION OWNERSHIP
// ======================================

export function applicationBelongsToIdentity(
  application,
  identity
) {
  if (!application || !identity?.uid) {
    return false;
  }

  const uid = cleanId(identity.uid);

  // Direct Firebase identifiers.
  const directUids = [
    application.ownerUid,
    application.userUid,
    application.clientUid,
    application.createdByUid,
    application.firebaseUid,
    application.client?.uid,
    application.client?.firebaseUid,
    application.user?.uid,
  ]
    .map(cleanId)
    .filter(Boolean);

  // An explicit Firebase owner takes priority.
  if (directUids.length > 0) {
    return directUids.includes(uid);
  }

  const userIds = new Set(
    [
      uid,
      ...(identity.userIds || []),
    ].map(cleanId)
  );

  const clientIds = new Set(
    [...(identity.clientIds || [])].map(
      cleanId
    )
  );

  // Rita internal user IDs.
  const applicationUserIds = [
    application.userId,
    application.user_id,
    application.ownerId,
    application.owner_id,
    application.createdBy,
    application.client?.userId,
    application.user?.id,
  ];

  const userMatches =
    applicationUserIds.some((id) => {
      const value = cleanId(id);

      return (
        Boolean(value) &&
        userIds.has(value)
      );
    });

  if (userMatches) {
    return true;
  }

  // Rita internal client IDs.
  const applicationClientIds = [
    application.clientId,
    application.client_id,
    application.customerId,
    application.customer_id,
    application.client?.id,
  ];

  return applicationClientIds.some((id) => {
    const value = cleanId(id);

    return (
      Boolean(value) &&
      clientIds.has(value)
    );
  });
}

// ======================================
// FIREBASE INTEGRATION
// ======================================

export async function getStripeManualIntegration() {
  let getApps;
  let getAuth;
  let getFirestore;

  try {
    ({ getApps } = await import(
      "firebase-admin/app"
    ));

    ({ getAuth } = await import(
      "firebase-admin/auth"
    ));

    ({ getFirestore } = await import(
      "firebase-admin/firestore"
    ));
  } catch (error) {
    console.error(
      "STRIPE_AUTH_DEPENDENCY_MISSING:",
      error.message
    );

    return null;
  }

  const firebaseApp = getApps()[0];

  if (!firebaseApp) {
    console.error(
      "STRIPE_FIREBASE_ADMIN_NOT_INITIALIZED"
    );

    return null;
  }

  const auth = getAuth(firebaseApp);
  const db = getFirestore(firebaseApp);

  // ====================================
  // GET TRUSTED LINKED USER RECORDS
  // ====================================

  async function getLinkedRecords(
    collectionName,
    uid
  ) {
    const collection =
      db.collection(collectionName);

    const found = new Map();

    // First try users/{firebaseUid}
    const direct =
      await collection.doc(uid).get();

    if (direct.exists) {
      found.set(
        direct.ref.path,
        direct
      );
    }

    // Other possible Firebase UID fields.
    for (const field of [
      "uid",
      "firebaseUid",
      "authUid",
    ]) {
      const query = await collection
        .where(field, "==", uid)
        .limit(2)
        .get();

      if (query.size > 1) {
        throw new Error(
          `Ambiguous ${collectionName} mapping for ${field}`
        );
      }

      for (const doc of query.docs) {
        found.set(
          doc.ref.path,
          doc
        );
      }
    }

    return [...found.values()];
  }

  // ====================================
  // RESOLVE VERIFIED CLIENT IDENTITY
  // ====================================

  async function loadVerifiedIdentity(decoded) {
    const identity = {
      uid: decoded.uid,
      userIds: new Set([decoded.uid]),
      clientIds: new Set(),
    };

    // Only use server-verified linked records.
    const userRecords =
      await getLinkedRecords(
        "users",
        decoded.uid
      );

    for (const doc of userRecords) {
      const record = doc.data() || {};

      addId(identity.userIds, doc.id);
      addId(identity.userIds, record.id);
      addId(identity.userIds, record.userId);
      addId(identity.userIds, record.legacyId);

      addId(
        identity.clientIds,
        record.clientId
      );

      addId(
        identity.clientIds,
        record.client_id
      );
    }

    const clientRecords =
      await getLinkedRecords(
        "clients",
        decoded.uid
      );

    for (const doc of clientRecords) {
      const record = doc.data() || {};

      addId(identity.clientIds, doc.id);
      addId(identity.clientIds, record.id);
      addId(
        identity.clientIds,
        record.clientId
      );

      addId(
        identity.userIds,
        record.userId
      );
    }

    return identity;
  }

  // ====================================
  // CLIENT AUTHENTICATION
  // ====================================

  async function requireClientAuth(
    req,
    res,
    next
  ) {
    try {
      const bearer =
        /^Bearer\s+(\S+)$/i.exec(
          req.get("Authorization") || ""
        );

      const cookie =
        getCookie(req, "__session") ||
        getCookie(req, "firebaseSession");

      const decoded = bearer
        ? await auth.verifyIdToken(
            bearer[1],
            true
          )
        : cookie
          ? await auth.verifySessionCookie(
              cookie,
              true
            )
          : null;

      if (!decoded?.uid) {
        return res.status(401).json({
          success: false,
          error: "Sign in required",
        });
      }

      const identity =
        await loadVerifiedIdentity(decoded);

      req.user = {
        uid: decoded.uid,
        claims: decoded,
        identity,
      };

      return next();
    } catch (error) {
      console.error(
        "STRIPE_CLIENT_AUTH_ERROR:",
        error.message
      );

      return res.status(401).json({
        success: false,
        error:
          "Authentication or account linkage failed",
      });
    }
  }

  // ====================================
  // ADMIN AUTHENTICATION
  // ====================================

  async function requireAdminAuth(
    req,
    res,
    next
  ) {
    return requireClientAuth(
      req,
      res,
      async () => {
        try {
          const claims =
            req.user.claims || {};

          if (
            claims.admin === true ||
            claims.role === "admin"
          ) {
            return next();
          }

          const userRecord = await db
            .collection("users")
            .doc(req.user.uid)
            .get();

          if (
            userRecord.exists &&
            userRecord.data()?.role ===
              "admin"
          ) {
            return next();
          }

          return res.status(403).json({
            success: false,
            error:
              "Admin privileges required",
          });
        } catch (error) {
          return next(error);
        }
      }
    );
  }

  // ====================================
  // CSRF / ORIGIN PROTECTION
  // ====================================

  function requireCsrf(req, res, next) {
    const origin = req.get("Origin");

    if (origin) {
      const allowed =
        req.app.locals.isAllowedOrigin;

      if (
        typeof allowed !== "function" ||
        !allowed(origin)
      ) {
        return res.status(403).json({
          success: false,
          error: "Origin not allowed",
        });
      }

      return next();
    }

    // Bearer token requests may not
    // include an Origin header.
    const bearer =
      /^Bearer\s+\S+$/i.test(
        req.get("Authorization") || ""
      );

    if (bearer) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: "Missing request origin",
    });
  }

  // ====================================
  // LOOK UP APPLICATION
  // ====================================

  async function resolveApplicationRef(value) {
    const id = cleanId(value);

    if (!/^\d{1,20}$/.test(id)) {
      return null;
    }

    const matches = new Map();

    for (const collectionName of COLLECTIONS) {
      const collection =
        db.collection(collectionName);

      // Direct Firestore document ID.
      const direct =
        await collection.doc(id).get();

      if (direct.exists) {
        matches.set(
          direct.ref.path,
          direct.ref
        );
      }

      // Numeric or string application IDs.
      for (const candidate of [
        Number(id),
        id,
      ]) {
        const result = await collection
          .where("id", "==", candidate)
          .limit(2)
          .get();

        for (const doc of result.docs) {
          matches.set(
            doc.ref.path,
            doc.ref
          );
        }
      }
    }

    // Never choose arbitrarily between
    // multiple applications with the same ID.
    if (matches.size > 1) {
      throw new Error(
        "Ambiguous application ID across collections"
      );
    }

    return (
      matches.values().next().value ||
      null
    );
  }

  // ====================================
  // PENDING STRIPE RECEIPTS
  // ====================================

  async function listPendingProofIds() {
    const ids = new Set();

    for (const collectionName of COLLECTIONS) {
      const result = await db
        .collection(collectionName)
        .where(
          "stripeProofStatus",
          "==",
          "pending"
        )
        .limit(200)
        .get();

      for (const doc of result.docs) {
        addId(
          ids,
          doc.data().id || doc.id
        );
      }
    }

    return [...ids];
  }

  // ====================================
  // OWNERSHIP ADAPTER
  // ====================================

  function ownsApplication(data, user) {
    return applicationBelongsToIdentity(
      data,
      user?.identity
    );
  }

  // ====================================
  // RETURN INTEGRATION
  // ====================================

  return {
    db,
    ownsApplication,
    resolveApplicationRef,
    listPendingProofIds,
    requireClientAuth,
    requireAdminAuth,
    requireCsrf,
  };
}
