import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase.js";

function waitForAuth() {
  return new Promise(
    (resolve, reject) => {
      const unsubscribe =
        onAuthStateChanged(
          auth,

          (user) => {
            unsubscribe();
            resolve(user);
          },

          (error) => {
            unsubscribe();
            reject(error);
          }
        );
    }
  );
}

async function getFirebaseUser() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  const user =
    await waitForAuth();

  if (!user) {
    throw new Error(
      "Not logged in"
    );
  }

  return user;
}

function mapUser(
  firebaseUser,
  data
) {
  return {
    id:
      firebaseUser.uid,

    uid:
      firebaseUser.uid,

    fullName:
      data.full_name || "",

    companyName:
      data.company_name || "",

    email:
      data.email ||
      firebaseUser.email ||
      "",

    role:
      data.role || "client",

    status:
      data.status || "active",

    createdAt:
      data.created_at || null,

    updatedAt:
      data.updated_at || null,
  };
}

export async function signUpRequest({
  fullName,
  companyName,
  email,
  password,
}) {
  const credential =
    await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

  const firebaseUser =
    credential.user;

  const userData = {
    id:
      firebaseUser.uid,

    full_name:
      fullName.trim(),

    company_name:
      companyName?.trim() ||
      "",

    email:
      email
        .trim()
        .toLowerCase(),

    role:
      "client",

    status:
      "active",

    created_at:
      serverTimestamp(),

    updated_at:
      serverTimestamp(),
  };

  await setDoc(
    doc(
      db,
      "users",
      firebaseUser.uid
    ),
    userData
  );

  return {
    user:
      mapUser(
        firebaseUser,
        userData
      ),
  };
}

export async function loginRequest({
  email,
  password,
}) {
  const credential =
    await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

  const firebaseUser =
    credential.user;

  const snapshot =
    await getDoc(
      doc(
        db,
        "users",
        firebaseUser.uid
      )
    );

  if (!snapshot.exists()) {
    await signOut(auth);

    throw new Error(
      "User profile not found."
    );
  }

  const data =
    snapshot.data();

  if (
    data.status &&
    data.status !== "active"
  ) {
    await signOut(auth);

    throw new Error(
      "This account is not active."
    );
  }

  return {
    user:
      mapUser(
        firebaseUser,
        data
      ),
  };
}

export async function getCurrentUserRequest() {
  const firebaseUser =
    await getFirebaseUser();

  const snapshot =
    await getDoc(
      doc(
        db,
        "users",
        firebaseUser.uid
      )
    );

  if (!snapshot.exists()) {
    throw new Error(
      "User profile not found."
    );
  }

  return {
    user:
      mapUser(
        firebaseUser,
        snapshot.data()
      ),
  };
}

export async function logoutRequest() {
  await signOut(auth);

  return {
    success: true,
  };
}