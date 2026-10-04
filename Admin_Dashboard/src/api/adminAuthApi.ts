import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../../firebase";

export interface AdminUser {
  id: string;
  fullName: string;
  companyName: string | null;
  email: string;
  role: "admin" | "staff";
  status: string;
}

interface LoginResponse {
  message: string;
  admin: AdminUser;
}

interface CurrentAdminResponse {
  admin: AdminUser;
}

async function getAdminProfile(
  firebaseUser: User
): Promise<AdminUser> {
  const snapshot = await getDoc(
    doc(
      db,
      "users",
      firebaseUser.uid
    )
  );

  if (!snapshot.exists()) {
    throw new Error(
      "Admin profile was not found."
    );
  }

  const data = snapshot.data();

  if (
    data.role !== "admin" &&
    data.role !== "staff"
  ) {
    throw new Error(
      "This account does not have admin access."
    );
  }

  if (
    data.status &&
    data.status !== "active"
  ) {
    throw new Error(
      "This admin account is not active."
    );
  }

  return {
    id: firebaseUser.uid,

    fullName:
      data.full_name ||
      firebaseUser.displayName ||
      "",

    companyName:
      data.company_name ||
      null,

    email:
      data.email ||
      firebaseUser.email ||
      "",

    role: data.role,

    status:
      data.status ||
      "active",
  };
}

export async function adminLoginRequest(
  email: string,
  password: string
): Promise<LoginResponse> {
  const credential =
    await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

  try {
    const admin =
      await getAdminProfile(
        credential.user
      );

    return {
      message:
        "Signed in successfully.",

      admin,
    };
  } catch (error) {
    await signOut(auth);

    throw error;
  }
}

export async function getCurrentAdminRequest():
  Promise<CurrentAdminResponse> {
  const firebaseUser =
    auth.currentUser;

  if (!firebaseUser) {
    throw new Error(
      "Not authenticated."
    );
  }

  const admin =
    await getAdminProfile(
      firebaseUser
    );

  return {
    admin,
  };
}

export function observeAdminAuth(
  callback: (
    admin: AdminUser | null
  ) => void,
  onReady?: () => void
) {
  return onAuthStateChanged(
    auth,

    async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          callback(null);
          return;
        }

        const admin =
          await getAdminProfile(
            firebaseUser
          );

        callback(admin);
      } catch (error) {
        console.error(
          "ADMIN_AUTH_STATE_ERROR:",
          error
        );

        callback(null);
      } finally {
        onReady?.();
      }
    }
  );
}

export async function adminLogoutRequest() {
  await signOut(auth);

  return {
    message:
      "Signed out successfully.",
  };
}