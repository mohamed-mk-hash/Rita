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
  WalletCards,
} from "lucide-react";

import Navbar from "../../components/Navbar.jsx";
import Footer from "../../components/Footer.jsx";
import "./pricing.css";

const copy = {
  en: {
    nav: {
      services: "Services",
      howItWorks: "How it works",
      pricing: "Pricing",
      faq: "FAQ",
      contact: "Contact",
      signIn: "Sign in",
      start: "Start my LLC",
      lang: "العربية",
      toggleLang: "Change language",
    },
    hero: {
      eyebrow: "Pricing",
      title: "Transparent Pricing Packages",
      subtitle:
        "Choose the right formation package for your business needs. No hidden fees, just straightforward value.",
      primary: "Compare packages",
      secondary: "Ask a question",
    },
    packages: [
      {
        name: "Starter Package",
        description: "Best for first-time business owners.",
        price: "$299",
        period: "one-time",
        button: "Get Started",
        tone: "light",
        icon: FileCheck2,
        features: [
          "Wyoming or New Mexico LLC formation assistance",
          "Name availability check",
          "Articles of Organization filing",
          "Operating Agreement template",
          "Business formation consultation",
          "Compliance checklist",
          "Email support",
        ],
      },
      {
        name: "Growth Package",
        description: "Best for entrepreneurs ready to start operating.",
        price: "$399",
        period: "one-time",
        button: "Choose Growth",
        tone: "popular",
        badge: "Most Popular",
        icon: BadgeDollarSign,
        features: [
          "All Starter features included",
          "EIN application assistance",
          "Business banking guidance",
          "Digital document package",
          "Business launch checklist",
          "Priority email support",
          "One compliance consultation",
        ],
      },
      {
        name: "Premium Package",
        description: "Best for business owners wanting complete setup.",
        price: "$499",
        period: "one-time",
        button: "Go Premium",
        tone: "dark",
        icon: Star,
        features: [
          "All Growth features included",
          "EIN application assistance with follow-up",
          "Banking introduction guidance",
          "Compliance monitoring reminders",
          "Annual report reminder service",
          "Priority support",
          "One-on-one business setup consultation",
        ],
      },
    ],
    highlights: [
      {
        icon: ShieldCheck,
        title: "No hidden fees",
        text: "Clear package pricing so you know what you are paying for before you start.",
      },
      {
        icon: Landmark,
        title: "Banking guidance",
        text: "Get practical guidance for business banking options after formation.",
      },
      {
        icon: Headphones,
        title: "Human support",
        text: "Work with a team that understands non-U.S. resident founders.",
      },
    ],
    comparison: {
      eyebrow: "What you get",
      title: "Pick the package that matches your launch stage.",
      rows: [
        ["LLC formation assistance", "Starter", "Growth", "Premium"],
        ["EIN application assistance", "—", "Growth", "Premium"],
        ["Banking guidance", "—", "Growth", "Premium"],
        ["Compliance reminders", "Checklist", "Consultation", "Monitoring"],
      ],
    },
    finalCta: {
      title: "Ready to start your U.S. business?",
      text: "Choose your package and begin your LLC setup with a clear, guided process.",
      primary: "Start my LLC",
      secondary: "Contact us",
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
      start: "ابدأ LLC",
      lang: "English",
      toggleLang: "تغيير اللغة",
    },
    hero: {
      eyebrow: "الأسعار",
      title: "باقات أسعار واضحة وشفافة",
      subtitle:
        "اختر الباقة المناسبة لاحتياجات شركتك. بدون رسوم مخفية، فقط قيمة واضحة وخطوات مفهومة.",
      primary: "قارن الباقات",
      secondary: "اسألنا",
    },
    packages: [
      {
        name: "باقة البداية",
        description: "الأفضل لأصحاب الأعمال في البداية.",
        price: "$299",
        period: "دفعة واحدة",
        button: "ابدأ الآن",
        tone: "light",
        icon: FileCheck2,
        features: [
          "مساعدة في تأسيس LLC في وايومنغ أو نيو مكسيكو",
          "التحقق من توفر اسم الشركة",
          "تقديم Articles of Organization",
          "نموذج Operating Agreement",
          "استشارة تأسيس الشركة",
          "قائمة تحقق للامتثال",
          "دعم عبر البريد الإلكتروني",
        ],
      },
      {
        name: "باقة النمو",
        description: "الأفضل لرواد الأعمال الجاهزين للتشغيل.",
        price: "$399",
        period: "دفعة واحدة",
        button: "اختر النمو",
        tone: "popular",
        badge: "الأكثر اختياراً",
        icon: BadgeDollarSign,
        features: [
          "كل مزايا باقة البداية مشمولة",
          "مساعدة في طلب EIN",
          "إرشاد للحسابات البنكية التجارية",
          "حزمة وثائق رقمية",
          "قائمة إطلاق العمل",
          "دعم أولوية عبر البريد الإلكتروني",
          "استشارة امتثال واحدة",
        ],
      },
      {
        name: "الباقة المميزة",
        description: "الأفضل لمن يريد إعداداً كاملاً للشركة.",
        price: "$499",
        period: "دفعة واحدة",
        button: "اختر المميزة",
        tone: "dark",
        icon: Star,
        features: [
          "كل مزايا باقة النمو مشمولة",
          "مساعدة في EIN مع متابعة",
          "إرشاد للتعريف بالحلول البنكية",
          "تذكيرات لمراقبة الامتثال",
          "خدمة تذكير التقرير السنوي",
          "دعم أولوية",
          "استشارة فردية لإعداد الشركة",
        ],
      },
    ],
    highlights: [
      {
        icon: ShieldCheck,
        title: "بدون رسوم مخفية",
        text: "أسعار واضحة للباقات حتى تعرف ما الذي تدفع مقابله قبل أن تبدأ.",
      },
      {
        icon: Landmark,
        title: "إرشاد بنكي",
        text: "تحصل على توجيه عملي لاختيار حلول الحسابات البنكية بعد التأسيس.",
      },
      {
        icon: Headphones,
        title: "دعم بشري",
        text: "تتعامل مع فريق يفهم احتياجات المؤسسين غير المقيمين في أمريكا.",
      },
    ],
    comparison: {
      eyebrow: "ماذا تحصل عليه",
      title: "اختر الباقة المناسبة لمرحلة إطلاق مشروعك.",
      rows: [
        ["مساعدة تأسيس LLC", "البداية", "النمو", "المميزة"],
        ["مساعدة طلب EIN", "—", "النمو", "المميزة"],
        ["إرشاد بنكي", "—", "النمو", "المميزة"],
        ["تذكيرات الامتثال", "قائمة تحقق", "استشارة", "متابعة"],
      ],
    },
    finalCta: {
      title: "جاهز لتأسيس شركتك الأمريكية؟",
      text: "اختر باقتك وابدأ إعداد LLC عبر مسار واضح وموجّه خطوة بخطوة.",
      primary: "ابدأ LLC",
      secondary: "تواصل معنا",
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
  visible: {
    transition: { staggerChildren: 0.1 },
  },
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

function PricingCard({ plan, index }) {
  const Icon = plan.icon;
  const isPopular = plan.tone === "popular";

  return (
    <motion.article
      className={`pricing-card pricing-card-${plan.tone}`}
      variants={fadeUp}
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 240, damping: 20 }}
    >
      {isPopular && <div className="pricing-popular-ribbon">{plan.badge}</div>}

      <div className="pricing-card-glow" />

      <div className="pricing-icon-wrap">
        <Icon size={24} />
      </div>

      <span className="pricing-card-number">0{index + 1}</span>

      <h2>{plan.name}</h2>
      <p className="pricing-description">{plan.description}</p>

      <div className="pricing-price-row">
        <strong>{plan.price}</strong>
        <span>/ {plan.period}</span>
      </div>

      <ul className="pricing-feature-list">
        {plan.features.map((feature, featureIndex) => (
          <motion.li
            key={feature}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 + index * 0.08 + featureIndex * 0.035, duration: 0.34 }}
          >
            <CheckCircle2 size={17} />
            <span>{feature}</span>
          </motion.li>
        ))}
      </ul>

      <a href="#start" className="pricing-card-btn">
        {plan.button}
        <ArrowRight size={17} />
      </a>
    </motion.article>
  );
}

function Pricing() {
  const { lang, isArabic, changeLanguage } = useLanguage();
  const t = copy[lang];

  const directionClass = useMemo(() => (isArabic ? "rtl" : "ltr"), [isArabic]);

  return (
    <div className={`pricing-shell ${directionClass}`}>
      <Navbar t={t.nav} lang={lang} onChangeLang={changeLanguage} />

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
              <a href="#start" className="pricing-btn pricing-btn-outline">
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
            {t.packages.map((plan, index) => (
              <PricingCard key={plan.name} plan={plan} index={index} />
            ))}
          </motion.div>
        </section>

        <section className="pricing-highlights-section">
          <div className="pricing-container pricing-highlights-grid">
            {t.highlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={index * 0.08}>
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
                {t.comparison.rows.map((row, index) => (
                  <motion.div
                    className="pricing-comparison-row"
                    key={row.join("-")}
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

      <h2>{isArabic ? "ابدأ مشروعك الأمريكي مع Rita." : "Start your dream business with Rita."}</h2>

      <p>
        {isArabic
          ? "أطلق، أدر، وانمُ بشركتك الأمريكية من خلال منصة رقمية واضحة."
          : "Launch, manage, and grow your US business with one clean digital platform."}
      </p>

      <div>
        <a href="#packages" className="btn btn-white">
          {isArabic ? "ابدأ شركتي" : "Start my company"}
        </a>

        <a href="/contact" className="btn btn-muted">
          {isArabic ? "تواصل معنا" : "Talk to Rita"}
        </a>
      </div>
    </div>
  </div>
</section>
      </main>

      <Footer t={t.footer} />
    </div>
  );
}

export default Pricing;
