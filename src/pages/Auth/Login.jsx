import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router";

import Navbar from "../../components/Navbar.jsx";
import Footer from "../../components/Footer.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { loginRequest } from "../../api/authApi.js";
import "./Auth.css";

const copy = {
  en: {
    nav: {
      services: "Services",
      howItWorks: "How it works",
      pricing: "Pricing",
      faq: "FAQ",
      contact: "Contact",
      signIn: "Sign in",
      signUp: "Sign up",
      start: "Start my LLC",
      lang: "العربية",
      toggleLang: "Change language",
    },
    page: {
      title: "Sign in",
      subtitle: "Access your Rita client portal.",
      email: "Email",
      password: "Password",
      remember: "Remember me",
      forgot: "Forgot password?",
      button: "Sign in",
      loading: "Signing in...",
      noAccount: "Don’t have an account?",
      create: "Create one",
      error: "Invalid email or password.",
    },
    footer: {
      text:
        "One-stop-shop solution to establish, operate, and grow your US LLC from anywhere in the world.",
      company: "Company",
      support: "Support",
      start: "Start",
      services: "Services",
      pricing: "Pricing",
      howItWorks: "How it works",
      faq: "FAQ",
      contact: "Contact",
      whatsapp: "WhatsApp",
      startLLC: "Start my LLC",
      banking: "Banking solutions",
      compliance: "Compliance support",
      rights: "© 2026 Rita Digital Services. All rights reserved.",
      legal: "Privacy Policy · Terms of Use",
    },
  },
  ar: {
    nav: {
      services: "الخدمات",
      howItWorks: "كيف تعمل",
      pricing: "الأسعار",
      faq: "الأسئلة",
      contact: "تواصل",
      signIn: "تسجيل الدخول",
      signUp: "إنشاء حساب",
      start: "ابدأ LLC",
      lang: "English",
      toggleLang: "تغيير اللغة",
    },
    page: {
      title: "تسجيل الدخول",
      subtitle: "ادخل إلى بوابة عميل Rita.",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      remember: "تذكرني",
      forgot: "نسيت كلمة المرور؟",
      button: "تسجيل الدخول",
      loading: "جاري تسجيل الدخول...",
      noAccount: "ليس لديك حساب؟",
      create: "إنشاء حساب",
      error: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    },
    footer: {
      text:
        "حل متكامل لتأسيس وتشغيل وتنمية شركتك الأمريكية من أي مكان في العالم.",
      company: "الشركة",
      support: "الدعم",
      start: "ابدأ",
      services: "الخدمات",
      pricing: "الأسعار",
      howItWorks: "كيف تعمل",
      faq: "الأسئلة",
      contact: "تواصل",
      whatsapp: "واتساب",
      startLLC: "ابدأ LLC",
      banking: "الحلول البنكية",
      compliance: "دعم الامتثال",
      rights: "© 2026 Rita Digital Services. جميع الحقوق محفوظة.",
      legal: "سياسة الخصوصية · شروط الاستخدام",
    },
  },
};

function Login() {
  const { lang, isArabic, changeLanguage } = useLanguage();
  const t = copy[lang];
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginRequest(form);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(t.page.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`auth-page site-shell dark ${isArabic ? "rtl" : "ltr"}`}>
      <Navbar t={t.nav} lang={lang} onChangeLang={changeLanguage} />

      <main className="auth-main">
        <section className="auth-section">
          <motion.form
            className="auth-card"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link className="auth-logo" to="/">
              <img src="/rita-logo.png" alt="Rita Digital Services" />
            </Link>

            <header className="auth-header">
              <h1>{t.page.title}</h1>
              <p>{t.page.subtitle}</p>
            </header>

            {error && <p className="auth-error">{error}</p>}

            <label className="auth-field">
              <span>{t.page.email}</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>

            <label className="auth-field">
              <span>{t.page.password}</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </label>

            <div className="auth-options">
              <label>
                <input type="checkbox" />
                <span>{t.page.remember}</span>
              </label>

              <a href="#forgot">{t.page.forgot}</a>
            </div>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? t.page.loading : t.page.button}
            </button>

            <p className="auth-switch">
              {t.page.noAccount} <Link to="/sign-up">{t.page.create}</Link>
            </p>
          </motion.form>
        </section>
      </main>

      <Footer t={t.footer} />
    </div>
  );
}

export default Login;