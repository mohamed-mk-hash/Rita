import { useLanguage } from "../../context/LanguageContext.jsx";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Landmark,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

import Navbar from "../../components/Navbar.jsx";
import Footer from "../../components/Footer.jsx";
import "./Services.css";
import { usePageContent } from "../../hooks/usePageContent.js";
import { servicesFallbackContent } from "./servicesFallbackContent.js";
import { siteChromeContent } from "../../content/siteChromeContent.js";

const iconMap = {
  building: Building2,
  file: FileText,
  landmark: Landmark,
  shield: ShieldCheck,
  sparkles: Sparkles,
  clipboard: ClipboardCheck,
  badge: BadgeCheck,
  wallet: WalletCards,
};

const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: [0.16, 1, 0.3, 1] },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

function Reveal({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 44 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.72, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function ServiceCard({ service, index }) {
  const Icon = iconMap[service.icon] || Building2;

  return (
    <motion.article
      className="service-page-card"
      variants={fadeUp}
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 230, damping: 20 }}
    >
      <span className="service-page-number">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="service-page-icon">
        <Icon size={30} />
      </div>

      <h2>{service.title}</h2>
      <p>{service.text}</p>

      <ul>
        {(service.features || []).map((feature, featureIndex) => (
          <li key={`${feature}-${featureIndex}`}>
            <CheckCircle2 size={16} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

function ProcessSection({ t }) {
  return (
    <section className="services-process-section">
      <div className="services-container">
        <Reveal>
          <div className="services-section-heading">
            <span>{t.process.eyebrow}</span>
            <h2>{t.process.title}</h2>
            <p>{t.process.subtitle}</p>
          </div>
        </Reveal>

        <motion.div
          className="services-process-grid"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {(t.process.steps || []).map((step, index) => {
            const Icon = iconMap[step.icon] || Sparkles;

            return (
              <motion.article
                className="services-process-card"
                key={`${step.title}-${index}`}
                variants={fadeUp}
                whileHover={{ y: -6 }}
              >
                <strong>{String(index + 1).padStart(2, "0")}</strong>
                <div>
                  <Icon size={24} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function AdvantagesSection({ t }) {
  return (
    <section className="services-advantages-section">
      <div className="services-container">
        <Reveal>
          <div className="services-advantages-card">
            <div className="services-advantages-glow" />

            <div className="services-advantages-copy">
              <span>{t.advantages.eyebrow}</span>
              <h2>{t.advantages.title}</h2>
            </div>

            <div className="services-advantages-list">
              {(t.advantages.items || []).map((item, index) => (
                <motion.div
                  key={`${item.title}-${index}`}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.55, delay: index * 0.08 }}
                >
                  <CheckCircle2 size={18} />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FinalCTA({ t }) {
  return (
    <section className="final-cta" id="start">
      <div className="container">
        <Reveal>
          <div className="final-cta-card">
            <div className="cta-orbit one" />
            <div className="cta-orbit two" />
            <h2>{t.finalCta.title}</h2>
            <p>{t.finalCta.text}</p>
            <div>
              <a href="#services-list" className="btn btn-white">
                {t.finalCta.primary}
              </a>
              <a href="/contact" className="btn btn-muted">
                {t.finalCta.secondary}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Services() {
  const languageContext = useLanguage();

  const contextLanguage =
    languageContext?.lang ??
    languageContext?.language ??
    languageContext?.currentLanguage ??
    (languageContext?.isArabic ? "ar" : "en");

  const normalizedLanguage = String(contextLanguage).trim().toLowerCase();
  const lang = normalizedLanguage.startsWith("ar") ? "ar" : "en";
  const isArabic = languageContext?.isArabic ?? lang === "ar";
  const selectedLanguage = isArabic ? "ar" : lang;

  const changeLanguage =
    languageContext?.changeLanguage ??
    languageContext?.setLanguage ??
    languageContext?.toggleLanguage ??
    (() => {});

  const { content: pageContent } = usePageContent(
    "services",
    servicesFallbackContent
  );

  const apiLanguageContent = pageContent?.[selectedLanguage];
  const t =
    apiLanguageContent &&
    typeof apiLanguageContent === "object" &&
    Object.keys(apiLanguageContent).length > 0
      ? apiLanguageContent
      : servicesFallbackContent[selectedLanguage] || servicesFallbackContent.en;

  const chrome =
    siteChromeContent[selectedLanguage] || siteChromeContent.en;

  return (
    <div className={`services-page ${isArabic ? "rtl" : "ltr"}`}>
      <Navbar t={chrome.nav} lang={lang} onChangeLang={changeLanguage} />

      <main>
        <section className="services-hero">
          <div className="services-hero-orb one" />
          <div className="services-hero-orb two" />

          <motion.div
            className="services-container services-hero-content"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.span className="services-hero-pill" variants={fadeUp}>
              {t.hero.eyebrow}
              <Sparkles size={15} />
            </motion.span>

            <motion.h1 variants={fadeUp}>{t.hero.title}</motion.h1>
            <motion.div className="services-hero-line" variants={fadeUp} />
            <motion.p variants={fadeUp}>{t.hero.subtitle}</motion.p>

            <motion.div className="services-hero-actions" variants={fadeUp}>
              <a href="#services-list" className="btn btn-white">
                {t.hero.primary}
                <ArrowRight size={17} />
              </a>
              <a href="/pricing" className="btn btn-muted">
                {t.hero.secondary}
              </a>
            </motion.div>
          </motion.div>
        </section>

        <section
          className="services-list-section"
          id="services-list"
          key={`services-list-${lang}`}
        >
          <div className="services-container">
            <motion.div
              className="services-grid"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              {(t.services || []).map((service, index) => (
                <ServiceCard
                  key={`${service.title}-${index}`}
                  service={service}
                  index={index}
                />
              ))}
            </motion.div>
          </div>
        </section>

        <ProcessSection key={`process-${lang}`} t={t} />
        <AdvantagesSection t={t} />
        <FinalCTA t={t} />
      </main>

      <Footer t={chrome.footer} />
    </div>
  );
}

export default Services;
