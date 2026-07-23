import { useLanguage } from "../../context/LanguageContext.jsx";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BadgeDollarSign,
  BarChart3,
  Building2,
  CheckCircle2,
  FileCheck2,
  Globe2,
  Landmark,
  ShieldCheck,
  Sparkles,
  Star,
  UploadCloud,
  WalletCards,
} from "lucide-react";

import Navbar from "../../components/Navbar.jsx";
import Footer from "../../components/Footer.jsx";
import "./Home.css";
import { useHomePageContent } from "../../hooks/useHomePageContent.js";
import { homeFallbackContent } from "./homeFallbackContent.js";
import { siteChromeContent } from "../../content/siteChromeContent.js";
import { usePageContent } from "../../hooks/usePageContent.js";
import { pricingFallbackContent } from "../Pricing/pricingFallbackContent.js";
import { servicesFallbackContent } from "../Services/servicesFallbackContent.js";

const paymentPlatforms = [
  {
    name: "Wise",
    sources: [
      "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/wise.svg",
      "https://unpkg.com/simple-icons@v16/icons/wise.svg",
      "https://cdn.simpleicons.org/wise/163300",
    ],
  },
  {
    name: "PayPal",
    sources: [
      "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/paypal.svg",
      "https://unpkg.com/simple-icons@v16/icons/paypal.svg",
      "https://cdn.simpleicons.org/paypal/003087",
    ],
  },
  {
    name: "Shopify Payments",
    sources: [
      "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/shopify.svg",
      "https://unpkg.com/simple-icons@v16/icons/shopify.svg",
      "https://cdn.simpleicons.org/shopify/7AB55C",
    ],
  },
  {
    name: "Payoneer",
    sources: [
      "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/payoneer.svg",
      "https://unpkg.com/simple-icons@v16/icons/payoneer.svg",
      "https://cdn.simpleicons.org/payoneer/FF4800",
    ],
  },
  {
    name: "Stripe",
    sources: [
      "https://cdn.jsdelivr.net/npm/simple-icons@v16/icons/stripe.svg",
      "https://unpkg.com/simple-icons@v16/icons/stripe.svg",
      "https://cdn.simpleicons.org/stripe/635BFF",
    ],
  },
];

const iconMap = {
  building: Building2,
  badge: BadgeCheck,
  landmark: Landmark,
  wallet: WalletCards,
  shield: ShieldCheck,
  upload: UploadCloud,
  sparkles: Sparkles,
  globe: Globe2,
};

const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.78, ease: [0.16, 1, 0.3, 1] },
  },
};

function Reveal({ children, delay = 0, y = 56, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{
        once: true,
        amount: 0.38,
        margin: "0px 0px -14% 0px",
      }}
      transition={{
        duration: 0.82,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

function StartGrowSection({ t }) {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, {
    amount: 0.45,
    margin: "0px 0px -12% 0px",
    once: false,
  });

  const [hasStarted, setHasStarted] = useState(false);
  const [active, setActive] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const reduceMotion = useReducedMotion();
  const tabs = t.startGrow?.tabs || [];
  const safeActive = tabs.length ? Math.min(active, tabs.length - 1) : 0;
  const current = tabs[safeActive] || {
    heading: "",
    text: "",
    button: "",
    type: "timeline",
  };

  useEffect(() => {
    setActive(0);
    setProgressKey((key) => key + 1);
    setHasStarted(false);
  }, [tabs]);

  useEffect(() => {
    if (tabs.length && active >= tabs.length) {
      setActive(0);
    }
  }, [active, tabs.length]);

  useEffect(() => {
    if (isInView && !hasStarted) {
      setHasStarted(true);
      setActive(0);
      setProgressKey((key) => key + 1);
    }
  }, [isInView, hasStarted]);

  useEffect(() => {
    if (reduceMotion || !hasStarted || !isInView || tabs.length < 2)
      return undefined;

    const timer = setTimeout(() => {
      setActive((currentIndex) => (currentIndex + 1) % tabs.length);
      setProgressKey((key) => key + 1);
    }, 5200);

    return () => clearTimeout(timer);
  }, [safeActive, hasStarted, isInView, reduceMotion, tabs.length]);

  function selectTab(index) {
    setHasStarted(true);
    setActive(index);
    setProgressKey((key) => key + 1);
  }

  return (
    <section className="start-grow-section" ref={sectionRef}>
      <div className="container">
        <Reveal>
          <div className="section-heading">
            <span>{t.startGrow.label}</span>
            <h2>{t.startGrow.title}</h2>
          </div>
        </Reveal>

        <div className="start-grow-grid">
          <Reveal>
            <div className="sg-tabs">
              {tabs.map((item, index) => (
                <button
                  key={item.label}
                  className={`sg-tab ${safeActive === index ? "active" : ""}`}
                  onClick={() => selectTab(index)}
                  type="button"
                >
                  <span>
                    {item.label}
                    {item.badge && <small>{item.badge}</small>}
                  </span>

                  {safeActive === index &&
                    hasStarted &&
                    isInView &&
                    !reduceMotion && (
                      <i className="sg-progress">
                        <b key={progressKey} />
                      </i>
                    )}
                </button>
              ))}

              <AnimatePresence mode="wait">
                <motion.div
                  key={current.heading}
                  className="sg-copy"
                  initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -18, filter: "blur(10px)" }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h3>{current.heading}</h3>
                  <p>{current.text}</p>

                  <a href="#start" className="btn btn-white">
                    {current.button}
                  </a>
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <AnimatePresence mode="wait">
              <motion.div
                key={current.type}
                className={`sg-visual sg-${current.type}`}
                initial={{ opacity: 0, scale: 0.96, y: 34, rotateX: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -20 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="sg-shine" />

                {current.type === "timeline" && (
                  <>
                    <div className="sg-panel-title">
                      {t.startGrow.visual.timelineTitle}
                    </div>
                    <div className="sg-timeline">
                      <div>
                        <i>✓</i>
                        <span>{t.startGrow.visual.sent}</span>
                        <small>{t.startGrow.visual.days7}</small>
                      </div>
                      <div>
                        <i>✓</i>
                        <span>{t.startGrow.visual.bankMade}</span>
                        <small>{t.startGrow.visual.days5}</small>
                      </div>
                      <div>
                        <i>✓</i>
                        <span>{t.startGrow.visual.einReceived}</span>
                        <small>{t.startGrow.visual.days3}</small>
                      </div>
                    </div>
                  </>
                )}

                {current.type === "portal" && (
                  <>
                    <div className="sg-floating-card card-a">
                      <strong>{t.startGrow.visual.progress}</strong>
                      <span>68%</span>
                    </div>
                    <div className="sg-floating-card card-b">
                      <strong>{t.startGrow.visual.mailFrom}</strong>
                      <span>{t.startGrow.visual.stateMail}</span>
                    </div>
                    <div className="sg-floating-card card-c">
                      <strong>{t.startGrow.visual.bankingOptions}</strong>
                      <span>Mercury · Wise · Relay</span>
                    </div>
                    <div className="sg-progress-ring">
                      <span>68%</span>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ExploreSection({ servicesContent }) {
  const homeSection = servicesContent?.homeSection || {};
  const services = servicesContent?.services || [];

  return (
    <section className="explore-section" id="services">
      <div className="container">
        <Reveal>
          <div className="section-heading compact">
            <span>{homeSection.label || servicesContent?.hero?.eyebrow}</span>
            <h2>{homeSection.title || servicesContent?.hero?.title}</h2>
          </div>
        </Reveal>

        <div className="services-grid">
          {services.map((service, index) => {
            const Icon = iconMap[service.icon] || Building2;

            return (
              <Reveal key={`${service.title}-${index}`} delay={index * 0.06}>
                <motion.article
                  className="service-tile"
                  whileHover={{ y: -8, scale: 1.015 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                >
                  <div className="service-visual">
                    <div className="service-orbit">
                      <i />
                      <i />
                    </div>
                    <Icon size={30} />
                  </div>
                  <span className="service-tag">
                    {service.homeTag || service.title}
                  </span>
                  <h3>{service.title}</h3>
                  <p>{service.summary || service.text}</p>
                  <a href="/services">
                    {homeSection.learnMore || "Learn more"} <ArrowRight size={15} />
                  </a>
                </motion.article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BundleSection({ t }) {
  return (
    <section className="bundle-section">
      <div className="container">
        <Reveal>
          <div className="bundle-card">
            <div className="bundle-glow-line" />
            <div>
              <span>{t.bundle.label}</span>
              <h2>{t.bundle.title}</h2>
              <p>{t.bundle.text}</p>
              <a href="#start" className="btn btn-white">
                {t.bundle.button}
              </a>
            </div>

            <div className="bundle-list">
              {t.bundle.items.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.8 }}
                  transition={{ delay: index * 0.06, duration: 0.45 }}
                >
                  <CheckCircle2 size={17} />
                  {item}
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function BenefitsSection({ t }) {
  return (
    <section className="benefits-section">
      <div className="container">
        <Reveal>
          <div className="section-heading compact">
            <span>{t.benefits.label}</span>
            <h2>{t.benefits.title}</h2>
          </div>
        </Reveal>

        <div className="benefit-grid">
          {t.benefits.items.map((benefit, index) => {
            const Icon = iconMap[benefit.icon];

            return (
              <Reveal key={benefit.title} delay={index * 0.1}>
                <motion.div
                  className="benefit-card"
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 250, damping: 18 }}
                >
                  <div className="benefit-icon">
                    <Icon size={22} />
                    <span />
                  </div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.text}</p>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PartnersSection({ t }) {
  return (
    <section className="partners-section">
      <div className="container">
        <Reveal>
          <div className="section-heading compact">
            <span>{t.partners.label}</span>
            <h2>{t.partners.title}</h2>
          </div>
        </Reveal>

        <div className="partner-card-grid">
          {t.partners.items.map((partner, index) => (
            <Reveal key={partner.title} delay={index * 0.08}>
              <motion.div
                className="partner-card"
                whileHover={{ y: -8, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 250, damping: 18 }}
              >
                <div className="partner-visual">
                  <BarChart3 size={20} />
                  <span>{partner.stat}</span>
                </div>
                <h3>{partner.title}</h3>
                <p>{partner.text}</p>
                <div className="partner-wave">
                  <i />
                  <i />
                  <i />
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PaymentLogo({ platform }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [isHidden, setIsHidden] = useState(false);

  if (isHidden) return null;

  function tryNextSource() {
    setSourceIndex((currentIndex) => {
      const nextIndex = currentIndex + 1;

      if (nextIndex >= platform.sources.length) {
        setIsHidden(true);
        return currentIndex;
      }

      return nextIndex;
    });
  }

  return (
    <img
      src={platform.sources[sourceIndex]}
      alt={platform.name}
      loading="eager"
      decoding="async"
      onError={tryNextSource}
    />
  );
}

function PaymentPlatformsSection() {
  return (
    <section
      className="payment-platforms-section"
      aria-label="Supported payment platforms"
    >
      <div className="container payment-platforms-container">
        <div className="payment-logo-marquee">
          <div className="payment-logo-track">
            {[0, 1].map((groupIndex) => (
              <div
                className="payment-logo-group"
                key={groupIndex}
                aria-hidden={groupIndex === 1 ? "true" : undefined}
              >
                {paymentPlatforms.map((platform) => (
                  <div
                    className="payment-logo-item"
                    key={`${groupIndex}-${platform.name}`}
                  >
                    <PaymentLogo platform={platform} />
                    <span>{platform.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatSharedPrice(plan) {
  const value = String(plan?.price ?? "");
  const currency = plan?.currency || "$";
  return value.startsWith(currency) ? value : `${currency}${value}`;
}

function PricingSection({ pricingContent }) {
  const homeSection = pricingContent?.homeSection || {};
  const packages = pricingContent?.packages || [];
  const planIconMap = {
    fileCheck: FileCheck2,
    badgeDollar: BadgeDollarSign,
    star: Star,
  };

  return (
    <section
      className="pricing-section"
      id="pricing"
      aria-labelledby="pricing-title"
    >
      <div className="container">
        <Reveal>
          <div className="section-heading compact pricing-heading">
            <span>{homeSection.label || pricingContent?.hero?.eyebrow}</span>
            <h2 id="pricing-title">
              {homeSection.title || pricingContent?.hero?.title}
            </h2>
            <p>{homeSection.text || pricingContent?.hero?.subtitle}</p>
          </div>
        </Reveal>

        <div className="pricing-grid">
          {packages.map((plan, index) => {
            const PlanIcon = planIconMap[plan.icon] || BadgeCheck;
            const slug = plan.slug || ["starter", "growth", "premium"][index] || "plan";

            return (
              <Reveal
                key={`${slug}-${index}`}
                delay={index * 0.08}
                className="pricing-reveal"
              >
                <motion.article
                  className={`pricing-card pricing-card-${slug} ${
                    plan.recommended ? "is-recommended" : ""
                  }`}
                  whileHover={{ y: -9 }}
                  transition={{ type: "spring", stiffness: 250, damping: 18 }}
                >
                  {plan.recommended && (
                    <div className="pricing-ribbon">
                      {plan.badge || homeSection.recommended}
                    </div>
                  )}

                  <span className="pricing-number">
                    {plan.number || String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="pricing-plan-icon">
                    <PlanIcon size={21} />
                  </div>

                  <div className="pricing-plan-copy">
                    <h3>{plan.name}</h3>
                    <p>{plan.description}</p>
                  </div>

                  <div className="pricing-price-row">
                    <strong>{formatSharedPrice(plan)}</strong>
                    <span>/ {plan.period}</span>
                  </div>

                  <ul className="pricing-features">
                    {(plan.features || []).map((feature, featureIndex) => (
                      <li key={`${feature}-${featureIndex}`}>
                        <CheckCircle2 size={17} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={`/contact?plan=${encodeURIComponent(slug)}`}
                    className="pricing-button"
                    aria-label={`${plan.button} - ${plan.name}`}
                  >
                    <span>{plan.button}</span>
                    <ArrowRight size={17} />
                  </a>
                </motion.article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TrustSection({ t }) {
  return (
    <section className="trust-section">
      <div className="container">
        <Reveal>
          <div className="quote-card">
            <div className="quote-pulse" />
            <p>{t.trust.quote}</p>

            <div>
              <strong>{t.trust.name}</strong>
              <span>{t.trust.subtitle}</span>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="metrics-row">
            {t.trust.metrics.map((metric) => (
              <div key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
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
              <a href="/services" className="btn btn-white">
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

function Home() {
  const languageContext = useLanguage();

  /*
    بعض إصدارات LanguageContext تستعمل lang، وأخرى تستعمل language.
    نعتمد isArabic أيضاً حتى لا تبقى الصفحة بالإنجليزية عند تفعيل RTL.
  */
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

  const { content: pageContent } = useHomePageContent(homeFallbackContent);
  const { content: pricingPageContent } = usePageContent(
    "pricing",
    pricingFallbackContent
  );
  const { content: servicesPageContent } = usePageContent(
    "services",
    servicesFallbackContent
  );

  function selectLanguageContent(content, fallback) {
    const selected = content?.[selectedLanguage];

    if (
      selected &&
      typeof selected === "object" &&
      Object.keys(selected).length > 0
    ) {
      return selected;
    }

    return fallback[selectedLanguage] || fallback.en;
  }

  const t = selectLanguageContent(pageContent, homeFallbackContent);
  const pricingContent = selectLanguageContent(
    pricingPageContent,
    pricingFallbackContent
  );
  const servicesContent = selectLanguageContent(
    servicesPageContent,
    servicesFallbackContent
  );

  const chrome =
    siteChromeContent[selectedLanguage] ||
    siteChromeContent.en;

  return (
    <div className={`site-shell dark ${isArabic ? "rtl" : "ltr"}`}>
      <Navbar t={chrome.nav} lang={lang} onChangeLang={changeLanguage} />

      <main>
        <section className="fb-hero">
          <div className="orb orb-red" />
          <div className="orb orb-blue" />

          <motion.div
            className="container hero-grid"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.12,
                },
              },
            }}
          >
            <div className="hero-copy">
              <motion.div className="hero-eyebrow" variants={fadeUp}>
                <span>{t.hero.pillNew}</span>
                <p>{t.hero.eyebrow}</p>
              </motion.div>

              <motion.h1 variants={fadeUp}>{t.hero.title}</motion.h1>

              <motion.p className="hero-subtitle" variants={fadeUp}>
                {t.hero.subtitle}
              </motion.p>

              <motion.div className="hero-quick-facts" variants={fadeUp}>
                {t.hero.quickFacts.map((fact) => (
                  <span key={fact}>{fact}</span>
                ))}
              </motion.div>

              <motion.div className="hero-actions" variants={fadeUp}>
                <a href="#start" className="btn btn-white">
                  {t.hero.primary}
                </a>
                <a href="#services" className="btn btn-muted">
                  {t.hero.secondary}
                </a>
              </motion.div>
            </div>
          </motion.div>
        </section>
        <PaymentPlatformsSection />
        <StartGrowSection t={t} />
        <ExploreSection servicesContent={servicesContent} />
        <PricingSection pricingContent={pricingContent} />
        <BundleSection t={t} />
        <BenefitsSection t={t} />
        <PartnersSection t={t} />
        <TrustSection t={t} />
        <FinalCTA t={t} />
      </main>

      <Footer t={chrome.footer} />
    </div>
  );
}

export default Home;
