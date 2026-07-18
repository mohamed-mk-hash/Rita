import React from "react";

import {
  Bell,
  Languages,
  ShieldCheck,
  User,
} from "lucide-react";

import { useLanguage } from "../i18n/LanguageContext";
import { useAuth } from "../auth/AuthContext";

export const Navbar: React.FC = () => {
  const {
    t,
    isArabic,
    toggleLanguage,
  } = useLanguage();

  const { admin } = useAuth();

  const roleLabel =
    admin?.role === "admin"
      ? isArabic
        ? "مدير"
        : "Administrator"
      : isArabic
        ? "موظف"
        : "Staff";

  return (
    <header
      className={`fixed top-0 z-40 h-20 border-b border-[#dbe4ee] bg-white shadow-sm ${
        isArabic
          ? "left-0 right-64"
          : "left-64 right-0"
      }`}
    >
      <div className="flex h-full items-center justify-between gap-4 px-5 md:px-7">
        {/* Welcome */}
        <div className="min-w-0">
          <h2 className="truncate text-lg font-black text-[#0e3149] md:text-xl">
            {t.welcome}
            {admin?.fullName
              ? `، ${admin.fullName}`
              : ""}
          </h2>

          <p className="mt-1 hidden truncate text-xs font-bold text-slate-500 sm:block">
            {admin?.companyName ||
              "Rita Digital Services"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          {/* Language */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-black text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 md:px-4"
          >
            <Languages className="h-4 w-4" />

            <span className="hidden sm:inline">
              {t.languageButton}
            </span>
          </button>

          {/* Notifications */}
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-xl border border-[#dbe4ee] bg-white text-[#173e56] transition hover:bg-[#f4f7fb]"
            aria-label={
              isArabic
                ? "الإشعارات"
                : "Notifications"
            }
          >
            <Bell className="h-5 w-5" />
          </button>

          {/* Admin information */}
          <div className="flex min-h-12 items-center gap-3 rounded-xl border border-[#dbe4ee] bg-white px-2 py-1.5 shadow-sm md:px-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#173e56] text-white">
              {admin?.role === "admin" ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>

            <div className="hidden max-w-[190px] min-w-0 md:block">
              <div className="flex items-center gap-2">
                <strong className="truncate text-sm font-black text-[#0e3149]">
                  {admin?.fullName ||
                    (isArabic
                      ? "حساب الإدارة"
                      : "Admin account")}
                </strong>

                <span className="shrink-0 rounded-full bg-[#eef3f8] px-2 py-0.5 text-[10px] font-black text-[#173e56]">
                  {roleLabel}
                </span>
              </div>

              <span
                className="mt-0.5 block truncate text-xs font-semibold text-slate-500"
                dir="ltr"
              >
                {admin?.email}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};