import { useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Globe2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";

import Navbar from "../../components/Navbar.jsx";
import Footer from "../../components/Footer.jsx";
import { sendContactMessageRequest } from "../../api/contactApi.js";
import "./Contact.css";
import { usePageContent } from "../../hooks/usePageContent.js";
import { contactFallbackContent } from "./contactFallbackContent.js";
import { siteChromeContent } from "../../content/siteChromeContent.js";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const iconMap = {
  shield: ShieldCheck,
  globe: Globe2,
  clock: CalendarClock,
};

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 28,
  },

  visible: {
    opacity: 1,
    y: 0,

    transition: {
      duration: 0.72,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const stagger = {
  hidden: {},

  visible: {
    transition: {
      staggerChildren: 0.11,
    },
  },
};

function ContactInfoItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <motion.div
      className="contact-info-item"
      variants={fadeUp}
      whileHover={{ x: 6 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 22,
      }}
    >
      <div className="contact-info-icon">
        <Icon size={22} />
      </div>

      <div className="contact-info-content">
        <span>{label}</span>

        <strong dir="auto">
          {value}
        </strong>
      </div>
    </motion.div>
  );
}

function Contact() {
  const languageContext = useLanguage();

  const contextLanguage =
    languageContext?.lang ??
    languageContext?.language ??
    languageContext?.currentLanguage ??
    (languageContext?.isArabic ? "ar" : "en");

  const normalizedLanguage = String(contextLanguage)
    .trim()
    .toLowerCase();

  const lang = normalizedLanguage.startsWith("ar") ? "ar" : "en";
  const isArabic = languageContext?.isArabic ?? lang === "ar";
  const selectedLanguage = isArabic ? "ar" : lang;

  const changeLanguage =
    languageContext?.changeLanguage ??
    languageContext?.setLanguage ??
    languageContext?.toggleLanguage ??
    (() => {});

  const { content: pageContent } = usePageContent(
    "contact",
    contactFallbackContent
  );

  const apiLanguageContent = pageContent?.[selectedLanguage];
  const hasApiLanguageContent =
    apiLanguageContent &&
    typeof apiLanguageContent === "object" &&
    Object.keys(apiLanguageContent).length > 0;

  const t = hasApiLanguageContent
    ? apiLanguageContent
    : contactFallbackContent[selectedLanguage] || contactFallbackContent.en;

  const chrome =
    siteChromeContent[selectedLanguage] ||
    siteChromeContent.en;

  const [form, setForm] = useState(initialForm);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (sent) {
      setSent(false);
    }

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setSent(false);
    setError("");
    setLoading(true);

    try {
      await sendContactMessageRequest(form);

      setSent(true);
      setForm(initialForm);
    } catch (requestError) {
      console.error(
        "CONTACT_FORM_ERROR:",
        requestError
      );

      setError(t.form.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`contact-page ${
        isArabic ? "rtl" : "ltr"
      }`}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <Navbar
        t={chrome.nav}
        lang={lang}
        onChangeLang={changeLanguage}
      />

      <main>
        <section className="contact-hero">
          <div className="contact-hero-orb orb-one" />
          <div className="contact-hero-orb orb-two" />

          <motion.div
            className="contact-container contact-hero-content"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div
              className="contact-pill"
              variants={fadeUp}
            >
              <MessageCircle size={16} />
              <span>{t.hero.label}</span>
            </motion.div>

            <motion.h1 variants={fadeUp}>
              {t.hero.title}
            </motion.h1>

            <motion.div
              className="contact-red-line"
              variants={fadeUp}
            />

            <motion.p variants={fadeUp}>
              {t.hero.text}
            </motion.p>

            <motion.div
              className="contact-hero-actions"
              variants={fadeUp}
            >
              <a
                href="#contact-form"
                className="contact-btn contact-btn-red"
              >
                {t.hero.primary}
                <ArrowRight size={17} />
              </a>

              <a
                href="#contact-info"
                className="contact-btn contact-btn-muted"
              >
                {t.hero.secondary}
              </a>
            </motion.div>
          </motion.div>
        </section>

        <section
          className="contact-main-section"
          id="contact-form"
        >
          <div className="contact-container">
            <motion.div
              className="contact-section-heading"
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.4,
              }}
              variants={fadeUp}
            >
              <span>{t.section.label}</span>
              <h2>{t.section.title}</h2>
              <p>{t.section.text}</p>
            </motion.div>

            <div className="contact-grid">
              <motion.aside
                className="contact-info-card"
                id="contact-info"
                initial={{
                  opacity: 0,
                  y: 38,
                  scale: 0.97,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                viewport={{
                  once: true,
                  amount: 0.3,
                }}
                transition={{
                  duration: 0.72,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="contact-card-glow" />

                <h3>{t.info.title}</h3>

                <motion.div
                  className="contact-info-list"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{
                    once: true,
                    amount: 0.4,
                  }}
                  variants={stagger}
                >
                  <ContactInfoItem
                    icon={Mail}
                    label={t.info.emailLabel}
                    value={t.info.email}
                  />

                  <ContactInfoItem
                    icon={Phone}
                    label={t.info.phoneLabel}
                    value={t.info.phone}
                  />

                  <ContactInfoItem
                    icon={MapPin}
                    label={t.info.addressLabel}
                    value={t.info.address}
                  />

                  <ContactInfoItem
                    icon={Clock}
                    label={t.info.hoursLabel}
                    value={t.info.hours}
                  />
                </motion.div>
              </motion.aside>

              <motion.form
                className="contact-form-card"
                onSubmit={handleSubmit}
                initial={{
                  opacity: 0,
                  y: 38,
                  scale: 0.97,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                viewport={{
                  once: true,
                  amount: 0.25,
                }}
                transition={{
                  duration: 0.72,
                  delay: 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="contact-form-top">
                  <div className="contact-form-heading">
                    <h3>{t.form.title}</h3>
                    <p>{t.form.subtitle}</p>
                  </div>

                  <div className="contact-form-icon">
                    <Send size={20} />
                  </div>
                </div>

                <div className="contact-form-grid">
                  <label>
                    <span>
                      {t.form.fullName}
                    </span>

                    <input
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      placeholder={
                        t.form.fullNamePlaceholder
                      }
                      value={form.fullName}
                      onChange={handleChange}
                      maxLength={150}
                      disabled={loading}
                      required
                    />
                  </label>

                  <label>
                    <span>
                      {t.form.email}
                    </span>

                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder={
                        t.form.emailPlaceholder
                      }
                      value={form.email}
                      onChange={handleChange}
                      maxLength={255}
                      disabled={loading}
                      required
                    />
                  </label>

                  <label>
                    <span>
                      {t.form.phone}
                    </span>

                    <input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder={
                        t.form.phonePlaceholder
                      }
                      value={form.phone}
                      onChange={handleChange}
                      maxLength={50}
                      disabled={loading}
                    />
                  </label>

                  <label>
                    <span>
                      {t.form.subject}
                    </span>

                    <input
                      name="subject"
                      type="text"
                      placeholder={
                        t.form.subjectPlaceholder
                      }
                      value={form.subject}
                      onChange={handleChange}
                      maxLength={200}
                      disabled={loading}
                      required
                    />
                  </label>

                  <label className="full">
                    <span>
                      {t.form.message}
                    </span>

                    <textarea
                      name="message"
                      placeholder={
                        t.form.messagePlaceholder
                      }
                      rows="6"
                      value={form.message}
                      onChange={handleChange}
                      maxLength={5000}
                      disabled={loading}
                      required
                    />
                  </label>
                </div>

                {error && (
                  <motion.div
                    className="contact-error"
                    role="alert"
                    aria-live="assertive"
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                  >
                    <span>{error}</span>
                  </motion.div>
                )}

                {sent && (
                  <motion.div
                    className="contact-success"
                    role="status"
                    aria-live="polite"
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>
                      {t.form.success}
                    </span>
                  </motion.div>
                )}

                <button
                  className="contact-submit"
                  type="submit"
                  disabled={loading}
                >
                  <Send size={17} />

                  {loading
                    ? t.form.loading
                    : t.form.button}
                </button>
              </motion.form>
            </div>
          </div>
        </section>

        <section className="contact-support-section">
          <div className="contact-container">
            <div className="contact-support-grid">
              {t.cards.map((card, index) => {
                const Icon = iconMap[card.icon] || ShieldCheck;

                return (
                  <motion.article
                    className="contact-support-card"
                    key={card.title}
                    initial={{
                      opacity: 0,
                      y: 32,
                    }}
                    whileInView={{
                      opacity: 1,
                      y: 0,
                    }}
                    viewport={{
                      once: true,
                      amount: 0.35,
                    }}
                    transition={{
                      duration: 0.62,
                      delay: index * 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    whileHover={{
                      y: -8,
                    }}
                  >
                    <div className="contact-support-icon">
                      <Icon size={23} />
                    </div>

                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className="final-cta"
          id="start"
        >
          <div className="container">
            <div className="final-cta-card">
              <div className="cta-orbit one" />
              <div className="cta-orbit two" />

              <h2>{t.cta.title}</h2>

              <p>{t.cta.text}</p>

              <div>
                <a
                  href="#contact-form"
                  className="btn btn-white"
                >
                  {t.cta.button}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer t={chrome.footer} />
    </div>
  );
}

export default Contact;