import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";

import {
  adminLoginRequest,
  adminLogoutRequest,
  observeAdminAuth,
  type AdminUser,
} from "../api/adminAuthApi";

interface AuthContextValue {
  admin: AdminUser | null;
  loading: boolean;
  isAuthenticated: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  logout: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | null>(
    null
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [admin, setAdmin] =
    useState<AdminUser | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe =
      observeAdminAuth(
        (currentAdmin) => {
          setAdmin(currentAdmin);
        },

        () => {
          setLoading(false);
        }
      );

    return unsubscribe;
  }, []);

  async function login(
    email: string,
    password: string
  ) {
    setLoading(true);

    try {
      const data =
        await adminLoginRequest(
          email,
          password
        );

      setAdmin(data.admin);
    } finally {
      /*
        Don't wait for another
        Firestore/auth cycle.
      */
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);

    try {
      await adminLogoutRequest();

      setAdmin(null);
    } catch (error) {
      console.error(
        "ADMIN_LOGOUT_ERROR:",
        error
      );

      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }

  const value =
    useMemo(
      () => ({
        admin,

        loading,

        isAuthenticated:
          Boolean(admin),

        login,

        logout,
      }),
      [admin, loading]
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}