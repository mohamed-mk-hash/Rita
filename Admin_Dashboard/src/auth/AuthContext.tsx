import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  adminLoginRequest,
  adminLogoutRequest,
  getCurrentAdminRequest,
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
  createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [admin, setAdmin] =
    useState<AdminUser | null>(null);

  const [loading, setLoading] = useState(true);

  const loadCurrentAdmin = useCallback(async () => {
    try {
      const data = await getCurrentAdminRequest();
      setAdmin(data.admin);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCurrentAdmin();
  }, [loadCurrentAdmin]);

  async function login(
    email: string,
    password: string
  ) {
    const data = await adminLoginRequest(
      email,
      password
    );

    setAdmin(data.admin);
  }

  async function logout() {
    try {
      await adminLogoutRequest();
    } catch (error) {
      console.error("ADMIN_LOGOUT_ERROR:", error);
    } finally {
      setAdmin(null);
    }
  }

  const value = useMemo(
    () => ({
      admin,
      loading,
      isAuthenticated: Boolean(admin),
      login,
      logout,
    }),
    [admin, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}