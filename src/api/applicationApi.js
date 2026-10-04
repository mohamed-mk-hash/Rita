import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebase.js";

function firebaseDateToString(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (value?.toDate) {
    return value.toDate().toISOString();
  }

  return null;
}

function mapIntake(data = {}) {
  return {
    id: data.id ?? null,

    applicationId:
      data.application_id ?? null,

    userId:
      data.user_id ?? null,

    phone:
      data.phone ?? "",

    country:
      data.country ?? "",

    businessActivity:
      data.business_activity ?? "",

    desiredCompanyName:
      data.desired_company_name ?? "",

    needsEin:
      Boolean(data.needs_ein),

    needsStripe:
      Boolean(data.needs_stripe),

    needsPaypal:
      Boolean(data.needs_paypal),

    needsWise:
      Boolean(data.needs_wise),

    needsMercury:
      Boolean(data.needs_mercury),

    needsRelay:
      Boolean(data.needs_relay),

    needsPayoneer:
      Boolean(data.needs_payoneer),

    needsShopify:
      Boolean(data.needs_shopify),

    extraNotes:
      data.extra_notes ?? "",

    createdAt:
      firebaseDateToString(
        data.created_at
      ),

    updatedAt:
      firebaseDateToString(
        data.updated_at
      ),
  };
}

function mapApplication(data, intake = null) {
  return {
    id: data.id,

    userId:
      data.user_id,

    serviceType:
      data.service_type,

    status:
      data.status,

    currentStep:
      data.current_step,

    progress:
      Number(data.progress || 0),

    notes:
      data.notes ?? null,

    createdAt:
      firebaseDateToString(
        data.created_at
      ),

    updatedAt:
      firebaseDateToString(
        data.updated_at
      ),

    intake,
  };
}

async function getCurrentFirebaseUser() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You must be logged in."
    );
  }

  return user;
}

async function getApplicationIntake(
  applicationId,
  userId
) {
  const intakeQuery = query(
    collection(
      db,
      "application_intake"
    ),

    where(
      "application_id",
      "==",
      Number(applicationId)
    ),

    where(
      "user_id",
      "==",
      userId
    )
  );

  const snapshot =
    await getDocs(
      intakeQuery
    );

  if (snapshot.empty) {
    return null;
  }

  return mapIntake(
    snapshot.docs[0].data()
  );
}

export async function getMyApplicationsRequest() {
  const user =
    await getCurrentFirebaseUser();

  const applicationsQuery = query(
    collection(
      db,
      "applications"
    ),
    where(
      "user_id",
      "==",
      user.uid
    )
  );

  const snapshot =
    await getDocs(
      applicationsQuery
    );

  const applications =
    await Promise.all(
      snapshot.docs.map(
        async (documentSnapshot) => {
          const data =
            documentSnapshot.data();

          const intake =
  await getApplicationIntake(
    data.id,
    user.uid
  );

          return mapApplication(
            data,
            intake
          );
        }
      )
    );

  applications.sort(
    (a, b) =>
      new Date(
        b.createdAt || 0
      ).getTime() -
      new Date(
        a.createdAt || 0
      ).getTime()
  );

  return {
    applications,
  };
}

export async function createApplicationRequest(
  payload
) {
  const user =
    await getCurrentFirebaseUser();

  /*
   * We use numeric IDs because your existing
   * Dashboard compares IDs with Number(...).
   */
  const applicationId =
    Date.now();

  const intakeId =
    applicationId + 1;

  const applicationData = {
    id: applicationId,

    user_id:
      user.uid,

    service_type:
      payload.serviceType,

    status:
      "submitted",

    current_step:
      "intake_submitted",

    progress: 10,

    notes: null,

    created_at:
      serverTimestamp(),

    updated_at:
      serverTimestamp(),
  };

  /*
   * First create the application.
   *
   * We do this before application_intake because
   * Firestore rules can then verify that the
   * application belongs to the current user.
   */
  await setDoc(
    doc(
      db,
      "applications",
      String(applicationId)
    ),
    applicationData
  );

  const intakeData = {
    id:
      intakeId,

    application_id:
      applicationId,

    user_id:
      user.uid,

    phone:
      payload.phone?.trim() ||
      null,

    country:
      payload.country?.trim() ||
      null,

    business_activity:
      payload.businessActivity?.trim() ||
      null,

    desired_company_name:
      payload.desiredCompanyName?.trim() ||
      null,

    needs_ein:
      Boolean(
        payload.needsEin
      ),

    needs_stripe:
      Boolean(
        payload.needsStripe
      ),

    needs_paypal:
      Boolean(
        payload.needsPaypal
      ),

    needs_wise:
      Boolean(
        payload.needsWise
      ),

    needs_mercury:
      Boolean(
        payload.needsMercury
      ),

    needs_relay:
      Boolean(
        payload.needsRelay
      ),

    needs_payoneer:
      Boolean(
        payload.needsPayoneer
      ),

    needs_shopify:
      Boolean(
        payload.needsShopify
      ),

    extra_notes:
      payload.extraNotes?.trim() ||
      null,

    created_at:
      serverTimestamp(),

    updated_at:
      serverTimestamp(),
  };

  try {
    await setDoc(
      doc(
        db,
        "application_intake",
        String(intakeId)
      ),
      intakeData
    );
  } catch (error) {
    console.error(
      "Could not create application intake:",
      error
    );

    throw error;
  }

  const now =
    new Date().toISOString();

  return {
    application: mapApplication(
      {
        ...applicationData,

        created_at: now,
        updated_at: now,
      },
      mapIntake({
        ...intakeData,

        created_at: now,
        updated_at: now,
      })
    ),
  };
}

export async function getApplicationByIdRequest(
  applicationId
) {
  const user =
    await getCurrentFirebaseUser();

  const snapshot =
    await getDoc(
      doc(
        db,
        "applications",
        String(applicationId)
      )
    );

  if (!snapshot.exists()) {
    throw new Error(
      "Application not found."
    );
  }

  const data =
    snapshot.data();

  if (
    data.user_id !== user.uid
  ) {
    throw new Error(
      "You cannot access this application."
    );
  }

  const intake =
  await getApplicationIntake(
    data.id,
    user.uid
  );

  return {
    application:
      mapApplication(
        data,
        intake
      ),
  };
}