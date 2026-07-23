import { useMemo, useState } from "react";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  ChevronDown,
  Clock3,
  FileText,
  Globe2,
  Landmark,
  Lightbulb,
  MessageCircle,
  Scale,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
} from "lucide-react";

import Navbar from "../../components/Navbar.jsx";
import Footer from "../../components/Footer.jsx";
import "./HowItWorks.css";
import { usePageContent } from "../../hooks/usePageContent.js";
import { aboutFallbackContent } from "./aboutFallbackContent.js";
import { siteChromeContent } from "../../content/siteChromeContent.js";

const fadeUp = {
  hidden: { opacity: 0, y: 34, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.74, ease: [0.16, 1, 0.3, 1] },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.08 },
  },
};


const faqIconMap = {
  building: Building2,
  fileText: FileText,
  landmark: Landmark,
  scale: Scale,
};

function Reveal({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 46, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.22, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.78, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({ label, title, light = false }) {
  return (
    <Reveal>
      <div className={`hiw-section-heading ${light ? "light" : ""}`}>
        <span>{label}</span>
        <h2>{title}</h2>
      </div>
    </Reveal>
  );
}

function ProcessVisual({ type, content }) {
  return (
    <motion.div
      className={`hiw-visual-card ${type}`}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
    >
      <div className="hiw-visual-glow" />
      <div className="hiw-visual-grid" />

      {type === "mission" ? (
        <>
          <div className="hiw-board-card one">
            <Building2 size={22} />
            <span>{content?.companySetup}</span>
          </div>
          <div className="hiw-board-card two">
            <FileText size={22} />
            <span>{content?.einRequest}</span>
          </div>
          <div className="hiw-board-card three">
            <Banknote size={22} />
            <span>{content?.bankingGuide}</span>
          </div>
          <div className="hiw-flow-line" />
        </>
      ) : (
        <>
          <div className="hiw-orbit-large">
            <i />
            <i />
            <i />
          </div>
          <div className="hiw-vision-center">
            <Globe2 size={34} />
            <strong>{content?.borderless}</strong>
            <span>{content?.businessAccess}</span>
          </div>
        </>
      )}
    </motion.div>
  );
}

function MissionVision({ t }) {
  const cards = [
    { ...t.mission, icon: Target, type: "mission" },
    { ...t.vision, icon: Lightbulb, type: "vision" },
  ];

  return (
    <section className="hiw-mission-section" id="process">
      <div className="hiw-container">
        <div className="hiw-mission-grid">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const isReversed = index % 2 === 1;

            return (
              <div className={`hiw-split-row ${isReversed ? "reverse" : ""}`} key={card.label}>
                <Reveal>
                  <motion.div
                    className="hiw-copy-panel"
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 220, damping: 24 }}
                  >
                    <div className="hiw-soft-icon">
                      <Icon size={28} />
                    </div>
                    <span>{card.label}</span>
                    <h2>{card.title}</h2>
                    <p>{card.text}</p>
                  </motion.div>
                </Reveal>

                <Reveal delay={0.12}>
                  <ProcessVisual type={card.type} content={t.visuals?.[card.type]} />
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StorySection({ t }) {
  return (
    <section className="hiw-story-section">
      <div className="hiw-container">
        <Reveal>
          <motion.div
            className="hiw-story-card"
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
          >
            <div className="hiw-story-orbit" />
            <div className="hiw-soft-icon red">
              <Clock3 size={30} />
            </div>
            <span>{t.story.label}</span>
            <h2>{t.story.title}</h2>
            <p>{t.story.text}</p>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}

function ExpertiseSection({ t }) {
  return (
    <section className="hiw-expertise-section">
      <div className="hiw-container">
        <SectionHeader label={t.expertise.label} title={t.expertise.title} />

        <motion.div className="hiw-expert-grid" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          {t.expertise.members.map((member, index) => (
            <motion.article
              className="hiw-expert-card"
              key={member.name}
              variants={fadeUp}
              whileHover={{ y: -12, scale: 1.015 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            >
              <div className="hiw-expert-number">0{index + 1}</div>
              <motion.div className="hiw-avatar" whileHover={{ rotate: 6, scale: 1.08 }}>
                {member.initials}
              </motion.div>
              <h3>{member.name}</h3>
              <span>{member.role}</span>
              <p>{member.text}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function TestimonialsSection({ t }) {
  return (
    <section className="hiw-testimonials-section">
      <div className="hiw-dots" />
      <div className="hiw-container">
        <SectionHeader label={t.testimonials.label} title={t.testimonials.title} light />

        <motion.div className="hiw-testimonial-grid" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          {t.testimonials.items.map((item) => (
            <motion.article
              className="hiw-testimonial-card"
              key={item.name}
              variants={fadeUp}
              whileHover={{ y: -12, rotate: -0.4 }}
              transition={{ type: "spring", stiffness: 240, damping: 18 }}
            >
              <div className="hiw-stars" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={17} fill="currentColor" />
                ))}
              </div>
              <p>“{item.quote}”</p>
              <div className="hiw-client-row">
                <span>{item.initials}</span>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.company}</small>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FaqItem({ item, isOpen, onClick }) {
  return (
    <motion.div
      className={`hiw-faq-item ${isOpen ? "open" : ""}`}
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 250, damping: 20 }}
    >
      <button onClick={onClick} type="button" aria-expanded={isOpen}>
        <span>{item.q}</span>
        <ChevronDown size={18} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            className="hiw-faq-answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <p>{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FaqSection({ t }) {
  const [openItem, setOpenItem] = useState("0-0");

  return (
    <section className="hiw-faq-section" id="faq">
      <div className="hiw-container">
        <SectionHeader label={t.faq.label} title={t.faq.title} />

        <div className="hiw-faq-groups">
          {t.faq.groups.map((group, groupIndex) => {
            const Icon = faqIconMap[group.icon] || FileText;

            return (
              <Reveal key={group.title}>
                <div className="hiw-faq-group">
                  <div className="hiw-faq-title-row">
                    <i />
                    <Icon size={25} />
                    <h3>{group.title}</h3>
                  </div>

                  <div className="hiw-faq-list">
                    {group.items.map((item, itemIndex) => {
                      const key = `${groupIndex}-${itemIndex}`;
                      return (
                        <FaqItem
                          key={item.q}
                          item={item}
                          isOpen={openItem === key}
                          onClick={() => setOpenItem(openItem === key ? "" : key)}
                        />
                      );
                    })}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function IntroBand({ t }) {
  return (
    <section className="hiw-intro-band">
      <div className="hiw-container">
        <motion.div className="hiw-stat-grid" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }}>
          {t.introStats.map((stat) => (
            <motion.div className="hiw-stat-card" key={stat.label} variants={fadeUp} whileHover={{ y: -8 }}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorks() {
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
    "about",
    aboutFallbackContent
  );

  const apiLanguageContent = pageContent?.[selectedLanguage];
  const hasApiLanguageContent =
    apiLanguageContent &&
    typeof apiLanguageContent === "object" &&
    Object.keys(apiLanguageContent).length > 0;

  const t = hasApiLanguageContent
    ? apiLanguageContent
    : aboutFallbackContent[selectedLanguage] || aboutFallbackContent.en;

  const chrome =
    siteChromeContent[selectedLanguage] ||
    siteChromeContent.en;

  const heroTitle = useMemo(
    () => String(t.hero?.title || "").split("\n"),
    [t.hero?.title]
  );

  return (
    <div className={`hiw-page site-shell dark ${isArabic ? "rtl" : "ltr"}`}>
      <Navbar t={chrome.nav} lang={lang} onChangeLang={changeLanguage} />

      <main className="hiw-main">
        <section className="hiw-hero">
          <div className="hiw-hero-noise" />
          <div className="hiw-orb hiw-orb-red" />
          <div className="hiw-orb hiw-orb-blue" />

          <motion.div className="hiw-container hiw-hero-inner" initial="hidden" animate="visible" variants={stagger}>
            <motion.span className="hiw-eyebrow" variants={fadeUp}>
              <Sparkles size={16} /> {t.hero.eyebrow}
            </motion.span>

            <motion.h1 variants={fadeUp}>
              {heroTitle.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </motion.h1>

            <motion.div className="hiw-red-line" variants={fadeUp} />

            <motion.p variants={fadeUp}>{t.hero.subtitle}</motion.p>

            <motion.div className="hiw-hero-actions" variants={fadeUp}>
              <a href="#process" className="hiw-btn hiw-btn-red">
                {t.hero.primary}
                <ArrowRight size={17} />
              </a>
              <a href="#faq" className="hiw-btn hiw-btn-outline">
                {t.hero.secondary}
              </a>
            </motion.div>
          </motion.div>
        </section>

        <IntroBand t={t} />
        <MissionVision t={t} />
        <StorySection t={t} />
        <ExpertiseSection t={t} />
        <TestimonialsSection t={t} />
        <FaqSection t={t} />
      </main>

      <Footer t={chrome.footer} />
    </div>
  );
}

export default HowItWorks;
