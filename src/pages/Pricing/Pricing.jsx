import { useMemo } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  FileCheck2,
  Headphones,
  Landmark,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

import Navbar from "../../components/Navbar.jsx";
import Footer from "../../components/Footer.jsx";
import "./pricing.css";
import { usePageContent } from "../../hooks/usePageContent.js";
import { pricingFallbackContent } from "./pricingFallbackContent.js";
import { siteChromeContent } from "../../content/siteChromeContent.js";

const pricingIconMap = {
  fileCheck: FileCheck2,
  badgeDollar: BadgeDollarSign,
  star: Star,
  shield: ShieldCheck,
  landmark: Landmark,
  headphones: Headphones,
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
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
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.24 }}
      transition={{ duration: 0.62, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function formatPrice(plan) {
  const value = String(plan?.price ?? "");
  if (/^[^0-9]*\d/.test(value) && value.startsWith(plan?.currency || "$")) {
    return value;
  }
  return `${plan?.currency || "$"}${value}`;
}

function PricingCard({ plan, index }) {
  const Icon = pricingIconMap[plan.icon] || FileCheck2;
  const tone =
    plan.tone ||
    (plan.recommended ? "popular" : index === 2 ? "dark" : "light");

  return (
    <motion.article
      className={`pricing-card pricing-card-${tone}`}
      variants={fadeUp}
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 240, damping: 20 }}
    >
      {plan.recommended && plan.badge && (
        <div className="pricing-popular-ribbon">{plan.badge}</div>
      )}

      <div className="pricing-card-glow" />

      <div className="pricing-icon-wrap">
        <Icon size={24} />
      </div>

      <span className="pricing-card-number">
        {plan.number || String(index + 1).padStart(2, "0")}
      </span>

      <h2>{plan.name}</h2>
      <p className="pricing-description">{plan.description}</p>

      <div className="pricing-price-row">
        <strong>{formatPrice(plan)}</strong>
        <span>/ {plan.period}</span>
      </div>

      <ul className="pricing-feature-list">
        {(plan.features || []).map((feature, featureIndex) => (
          <motion.li
            key={`${feature}-${featureIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.28 + index * 0.08 + featureIndex * 0.035,
              duration: 0.34,
            }}
          >
            <CheckCircle2 size={17} />
            <span>{feature}</span>
          </motion.li>
        ))}
      </ul>

      <a
        href={`/contact?plan=${encodeURIComponent(plan.slug || "package")}`}
        className="pricing-card-btn"
      >
        {plan.button}
        <ArrowRight size={17} />
      </a>
    </motion.article>
  );
}

function Pricing() {
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
    "pricing",
    pricingFallbackContent
  );

  const apiLanguageContent = pageContent?.[selectedLanguage];
  const t =
    apiLanguageContent &&
    typeof apiLanguageContent === "object" &&
    Object.keys(apiLanguageContent).length > 0
      ? apiLanguageContent
      : pricingFallbackContent[selectedLanguage] || pricingFallbackContent.en;

  const chrome =
    siteChromeContent[selectedLanguage] || siteChromeContent.en;

  const directionClass = useMemo(
    () => (isArabic ? "rtl" : "ltr"),
    [isArabic]
  );

  return (
    <div className={`pricing-shell ${directionClass}`}>
      <Navbar t={chrome.nav} lang={lang} onChangeLang={changeLanguage} />

      <main>
        <section className="pricing-hero">
          <div className="pricing-hero-soft pricing-hero-soft-red" />
          <div className="pricing-hero-soft pricing-hero-soft-blue" />

          <motion.div
            className="pricing-container pricing-hero-inner"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div className="pricing-eyebrow" variants={fadeUp}>
              <Sparkles size={16} />
              <span>{t.hero.eyebrow}</span>
            </motion.div>

            <motion.h1 variants={fadeUp}>{t.hero.title}</motion.h1>
            <motion.div className="pricing-title-line" variants={fadeUp} />
            <motion.p variants={fadeUp}>{t.hero.subtitle}</motion.p>

            <motion.div className="pricing-hero-actions" variants={fadeUp}>
              <a href="#packages" className="pricing-btn pricing-btn-primary">
                {t.hero.primary}
              </a>
              <a href="/contact" className="pricing-btn pricing-btn-outline">
                {t.hero.secondary}
              </a>
            </motion.div>
          </motion.div>
        </section>

        <section className="pricing-packages-section" id="packages">
          <motion.div
            className="pricing-container pricing-grid"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {(t.packages || []).map((plan, index) => (
              <PricingCard
                key={plan.slug || `${plan.name}-${index}`}
                plan={plan}
                index={index}
              />
            ))}
          </motion.div>
        </section>

        <section className="pricing-highlights-section">
          <div className="pricing-container pricing-highlights-grid">
            {(t.highlights || []).map((item, index) => {
              const Icon = pricingIconMap[item.icon] || ShieldCheck;

              return (
                <Reveal key={`${item.title}-${index}`} delay={index * 0.08}>
                  <motion.article
                    className="pricing-highlight-card"
                    whileHover={{ y: -8 }}
                    transition={{ type: "spring", stiffness: 240, damping: 18 }}
                  >
                    <div>
                      <Icon size={23} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </motion.article>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className="pricing-comparison-section">
          <div className="pricing-container">
            <Reveal>
              <div className="pricing-section-heading">
                <span>{t.comparison.eyebrow}</span>
                <h2>{t.comparison.title}</h2>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="pricing-comparison-card">
                {(t.comparison.rows || []).map((row, index) => (
                  <motion.div
                    className="pricing-comparison-row"
                    key={`${row.join("-")}-${index}`}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{ delay: index * 0.06, duration: 0.42 }}
                  >
                    <strong>{row[0]}</strong>
                    <span>{row[1]}</span>
                    <span>{row[2]}</span>
                    <span>{row[3]}</span>
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="final-cta" id="start">
          <div className="container">
            <div className="final-cta-card">
              <div className="cta-orbit one" />
              <div className="cta-orbit two" />
              <h2>{t.finalCta.title}</h2>
              <p>{t.finalCta.text}</p>
              <div>
                <a href="#packages" className="btn btn-white">
                  {t.finalCta.primary}
                </a>
                <a href="/contact" className="btn btn-muted">
                  {t.finalCta.secondary}
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

export default Pricing;
