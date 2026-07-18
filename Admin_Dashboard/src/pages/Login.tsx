import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Eye,
  EyeOff,
  Languages,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";

export function Login() {
  const navigate = useNavigate();

  const { admin, login } = useAuth();

  const {
    isArabic,
    toggleLanguage,
  } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (admin) {
      navigate("/", {
        replace: true,
      });
    }
  }, [admin, navigate]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      await login(email, password);

      navigate("/", {
        replace: true,
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : isArabic
            ? "تعذر تسجيل الدخول."
            : "Could not sign in."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f7fb] px-4 py-8">
      <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />

      <div className="absolute -bottom-48 -right-40 h-[28rem] w-[28rem] rounded-full bg-rose-200/40 blur-3xl" />

      <button
        type="button"
        onClick={toggleLanguage}
        className={`absolute top-5 z-10 flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[#173e56] shadow-lg ${
          isArabic ? "left-5" : "right-5"
        }`}
      >
        <Languages className="h-4 w-4" />

        {isArabic ? "English" : "العربية"}
      </button>

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[32px] border border-white bg-white shadow-[0_30px_90px_rgba(18,48,72,0.18)] lg:grid-cols-2">
        <section className="hidden bg-[#173e56] p-12 text-white lg:flex lg:flex-col">
          <img
            src="/rita-logo.png"
            alt="Rita Digital Services"
            className="h-20 w-32 rounded-2xl bg-white object-contain p-3"
          />

          <div className="my-auto max-w-md">
            <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-white/10">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <span className="text-sm font-black uppercase tracking-[0.2em] text-white/55">
              {isArabic
                ? "دخول آمن لفريق العمل"
                : "Secure staff access"}
            </span>

            <h1 className="mt-4 text-4xl font-black leading-tight">
              {isArabic
                ? "لوحة تحكم إدارة Rita"
                : "Rita Admin Dashboard"}
            </h1>

            <p className="mt-5 font-semibold leading-8 text-white/70">
              {isArabic
                ? "إدارة طلبات العملاء والوثائق وحالات الملفات من مكان واحد."
                : "Manage client applications, documents, and workflow progress from one secure workspace."}
            </p>
          </div>

          <small className="font-bold text-white/40">
            Rita Digital Services
          </small>
        </section>

        <section className="flex items-center justify-center p-6 md:p-12">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md"
          >
            <img
              src="/rita-logo.png"
              alt="Rita Digital Services"
              className="mb-8 h-16 w-28 rounded-2xl bg-white object-contain p-2 shadow lg:hidden"
            />

            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-600">
              <LockKeyhole className="h-4 w-4" />

              {isArabic
                ? "دخول الإدارة"
                : "Admin access"}
            </span>

            <h2 className="mt-5 text-3xl font-black text-[#061629]">
              {isArabic
                ? "تسجيل دخول الإدارة"
                : "Admin sign in"}
            </h2>

            <p className="mt-3 font-semibold leading-7 text-slate-500">
              {isArabic
                ? "استخدم حساب Admin أو Staff نشط."
                : "Use an active admin or staff account."}
            </p>

            {error && (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {error}
              </div>
            )}

            <label className="mt-7 block">
              <span className="mb-2 block text-sm font-black text-[#0e3149]">
                {isArabic
                  ? "البريد الإلكتروني"
                  : "Email address"}
              </span>

              <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-blue-500 focus-within:bg-white">
                <Mail className="h-5 w-5 text-slate-400" />

                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="omar@bawsala-dz.com"
                  className="min-w-0 flex-1 bg-transparent font-semibold text-[#0e3149] outline-none"
                />
              </div>
            </label>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-black text-[#0e3149]">
                {isArabic
                  ? "كلمة المرور"
                  : "Password"}
              </span>

              <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-blue-500 focus-within:bg-white">
                <LockKeyhole className="h-5 w-5 text-slate-400" />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  className="min-w-0 flex-1 bg-transparent font-semibold text-[#0e3149] outline-none"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  className="text-slate-400"
                  aria-label="Show password"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="mt-7 flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#df3341] px-5 text-sm font-black text-white shadow-xl shadow-rose-500/20 transition hover:bg-[#c92b38] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? isArabic
                  ? "جاري تسجيل الدخول..."
                  : "Signing in..."
                : isArabic
                  ? "تسجيل الدخول"
                  : "Sign in"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}