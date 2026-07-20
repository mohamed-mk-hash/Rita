import React, { useState } from "react";
import ritaLogo from "../assets/rita-logo.png";
import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  FileCheck2,
  Files,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
} from "lucide-react";

import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../auth/AuthContext";

export const Sidebar: React.FC = () => {
  const { t, isArabic } = useLanguage();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [loggingOut, setLoggingOut] =
    useState(false);

  const menuItems = [
  {
    path: "/",
    label: t.overview,
    icon: LayoutDashboard,
  },
  {
    path: "/applications",
    label: isArabic ? "الطلبات" : "Applications",
    icon: Files,
  },
  {
    path: "/documents",
    label: isArabic ? "الوثائق" : "Documents",
    icon: FileCheck2,
  },
  {
    path: "/messages",
    label: isArabic
      ? "رسائل التواصل"
      : "Contact Messages",
    icon: MessageSquareText,
  },
];

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await logout();

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "ADMIN_LOGOUT_ERROR:",
        error
      );

      navigate("/login", {
        replace: true,
      });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <aside
      className={`fixed top-0 z-50 flex h-screen w-64 flex-col bg-[#173e56] px-5 py-6 text-white shadow-xl ${
        isArabic ? "right-0" : "left-0"
      }`}
    >
      {/* Logo */}

      <div
        className={`flex ${
          isArabic
            ? "justify-end"
            : "justify-start"
        }`}
      >
        <img
  src={ritaLogo}
  alt="Rita Digital Services"
  className="h-[68px] w-[105px] rounded-xl bg-white object-contain p-3 shadow-sm"
/>
      </div>

      {/* Navigation */}

      <nav className="mt-8 grid gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-black transition-colors ${
                  isActive
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}

      <button
        type="button"
        onClick={() =>
          void handleLogout()
        }
        disabled={loggingOut}
        className="mt-auto flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#df3341] px-4 text-sm font-black text-white shadow-lg transition-colors hover:bg-[#c92b38] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loggingOut ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          <LogOut className="h-5 w-5" />
        )}

        <span>
          {loggingOut
            ? isArabic
              ? "جاري تسجيل الخروج..."
              : "Logging out..."
            : isArabic
              ? "تسجيل الخروج"
              : "Logout"}
        </span>
      </button>
    </aside>
  );
};