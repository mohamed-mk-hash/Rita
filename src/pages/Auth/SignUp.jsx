import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router";

import Navbar from "../../components/Navbar.jsx";
import Footer from "../../components/Footer.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { signUpRequest } from "../../api/authApi.js";
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
      title: "Create account",
      subtitle: "Start your Rita client portal.",
      name: "Full name",
      company: "Company name",
      email: "Email",
      password: "Password",
      button: "Create account",
      loading: "Creating account...",
      haveAccount: "Already have an account?",
      login: "Sign in",
      error: "Could not create account. Please check your details.",
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
      title: "إنشاء حساب",
      subtitle: "ابدأ بوابة عميل Rita.",
      name: "الاسم الكامل",
      company: "اسم الشركة",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      button: "إنشاء حساب",
      loading: "جاري إنشاء الحساب...",
      haveAccount: "لديك حساب بالفعل؟",
      login: "تسجيل الدخول",
      error: "تعذر إنشاء الحساب. تأكد من المعلومات وحاول مرة أخرى.",
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

function SignUp() {
  const { lang, isArabic, changeLanguage } = useLanguage();
  const t = copy[lang];
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
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
      await signUpRequest(form);
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
              <span>{t.page.name}</span>
              <input
                name="fullName"
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </label>

            <label className="auth-field">
              <span>{t.page.company}</span>
              <input
                name="companyName"
                type="text"
                autoComplete="organization"
                value={form.companyName}
                onChange={handleChange}
              />
            </label>

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
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                minLength={6}
                required
              />
            </label>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? t.page.loading : t.page.button}
            </button>

            <p className="auth-switch">
              {t.page.haveAccount} <Link to="/login">{t.page.login}</Link>
            </p>
          </motion.form>
        </section>
      </main>

      <Footer t={t.footer} />
    </div>
  );
}

export default SignUp;