import { useLanguage } from "../../context/LanguageContext.jsx";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Globe2,
  Landmark,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

import Navbar from "../../components/Navbar.jsx";
import Footer from "../../components/Footer.jsx";
import "./Services.css";

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
      eyebrow: "Services",
      title: "Comprehensive Corporate Services",
      subtitle:
        "Everything you need to build and scale your U.S. corporate entity as a non-resident.",
      primary: "Start your LLC",
      secondary: "View packages",
    },
    services: [
      {
        icon: "building",
        title: "LLC Formation (Wyoming & New Mexico)",
        text:
          "Establish your U.S. presence with confidence. We specialize in Wyoming and New Mexico formations—states known for robust privacy laws, zero state corporate income taxes, and foreigner-friendly regulations. We manage the entire filing process, provide registered agent services, and deliver your operating agreement.",
        features: [
          "State selection consultation",
          "Registered Agent services included",
          "Same-week filing timelines",
          "Complete Operating Agreement drafting",
        ],
      },
      {
        icon: "file",
        title: "Federal EIN Acquisition",
        text:
          "An Employer Identification Number (EIN) is crucial for opening a U.S. bank account and processing transactions. We navigate the IRS application process on your behalf—even if you do not have a Social Security Number (SSN) or ITIN.",
        features: [
          "No SSN/ITIN required",
          "Direct IRS processing",
          "Required for banking and payment gateways",
          "Lifetime tax ID validity",
        ],
      },
      {
        icon: "landmark",
        title: "International Banking Solutions",
        text:
          "Getting a U.S. business bank account can be the hardest step for non-residents. We leverage our institutional partnerships to help you open fully functional U.S. business checking accounts remotely, without requiring a physical visit.",
        features: [
          "Remote account opening",
          "Access to Stripe, PayPal, and more",
          "Physical and virtual debit cards",
          "Multi-currency capabilities",
        ],
      },
      {
        icon: "shield",
        title: "U.S. Regulatory Compliance",
        text:
          "Staying compliant is mandatory. We provide ongoing support including annual state report filings, BOI (Beneficial Ownership Information) reporting to FinCEN, franchise tax preparation, and general corporate standing maintenance.",
        features: [
          "Automated deadline tracking",
          "FinCEN BOI Reporting included",
          "Annual report filing services",
          "Certificate of Good Standing acquisition",
        ],
      },
    ],
    process: {
      eyebrow: "How we help",
      title: "A clear workflow from formation to operation.",
      subtitle:
        "Our process is designed to remove confusion and keep every step transparent.",
      steps: [
        {
          icon: "sparkles",
          title: "Understand your goals",
          text: "We review your needs, preferred state, banking requirements, and expected business activity.",
        },
        {
          icon: "clipboard",
          title: "Prepare and file",
          text: "We organize the documents, prepare the filing, and guide you through what is required.",
        },
        {
          icon: "badge",
          title: "Get your documents",
          text: "Receive formation documents, operating agreement, and EIN support in one organized flow.",
        },
        {
          icon: "wallet",
          title: "Operate with confidence",
          text: "Move forward with banking guidance, payment readiness, and compliance reminders.",
        },
      ],
    },
    advantages: {
      eyebrow: "Why Rita",
      title: "Built for global founders who need clarity.",
      items: [
        {
          title: "Non-resident focused",
          text: "Our services are built around the challenges international founders face when entering the U.S. market.",
        },
        {
          title: "Transparent process",
          text: "You know what is happening, what is needed, and what comes next at every step.",
        },
        {
          title: "Long-term support",
          text: "We help beyond formation with banking, payments, reminders, and compliance support.",
        },
      ],
    },
    finalCta: {
      title: "Start your dream business with Rita.",
      text:
        "Launch, manage, and grow your US business with one clean digital platform.",
      primary: "Start my company",
      secondary: "Talk to Rita",
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
      eyebrow: "الخدمات",
      title: "خدمات شركات متكاملة",
      subtitle:
        "كل ما تحتاجه لتأسيس وتشغيل وتنمية كيانك التجاري الأمريكي كمؤسس غير مقيم.",
      primary: "ابدأ LLC",
      secondary: "عرض الباقات",
    },
    services: [
      {
        icon: "building",
        title: "تأسيس LLC في وايومنغ ونيو مكسيكو",
        text:
          "أسّس وجودك التجاري في أمريكا بثقة. نركز على تأسيس الشركات في ولايتي وايومنغ ونيو مكسيكو، وهما من الولايات المناسبة بسبب الخصوصية القوية، عدم وجود ضريبة دخل على الشركات على مستوى الولاية، وسهولة التعامل مع المؤسسين غير المقيمين. نتولى عملية التسجيل، خدمات الوكيل المسجل، وتجهيز اتفاقية التشغيل.",
        features: [
          "استشارة لاختيار الولاية المناسبة",
          "خدمات الوكيل المسجل مرفقة",
          "مواعيد تسجيل سريعة خلال نفس الأسبوع",
          "إعداد كامل لاتفاقية التشغيل",
        ],
      },
      {
        icon: "file",
        title: "الحصول على رقم EIN الفيدرالي",
        text:
          "رقم تعريف صاحب العمل EIN ضروري لفتح حساب بنكي أمريكي ومعالجة المدفوعات. نتابع طلبك لدى مصلحة الضرائب IRS نيابة عنك، حتى إذا لم يكن لديك رقم ضمان اجتماعي SSN أو رقم ITIN.",
        features: [
          "لا تحتاج إلى SSN أو ITIN",
          "معالجة مباشرة مع IRS",
          "ضروري للبنوك وبوابات الدفع",
          "رقم ضريبي صالح مدى الحياة",
        ],
      },
      {
        icon: "landmark",
        title: "حلول بنكية دولية",
        text:
          "فتح حساب بنكي أمريكي قد يكون أصعب خطوة لغير المقيمين. نساعدك من خلال شركائنا وخبرتنا في تجهيز الطريق لفتح حسابات أعمال أمريكية عن بعد، دون الحاجة إلى زيارة فعلية.",
        features: [
          "فتح حساب عن بعد",
          "الوصول إلى Stripe و PayPal وغيرها",
          "بطاقات خصم فعلية وافتراضية",
          "إمكانيات متعددة العملات",
        ],
      },
      {
        icon: "shield",
        title: "الامتثال التنظيمي الأمريكي",
        text:
          "الامتثال ليس اختيارياً. نوفر دعماً مستمراً يشمل التقارير السنوية للولاية، تقرير BOI الخاص بملكية المستفيدين إلى FinCEN، تحضير ضرائب الامتياز عند الحاجة، والحفاظ على وضع الشركة القانوني.",
        features: [
          "تتبع تلقائي للمواعيد النهائية",
          "تقرير FinCEN BOI مرفق",
          "خدمات تقديم التقارير السنوية",
          "الحصول على شهادة حسن السيرة للشركة",
        ],
      },
    ],
    process: {
      eyebrow: "كيف نساعدك",
      title: "مسار واضح من التأسيس إلى التشغيل.",
      subtitle:
        "صممنا العملية لتقليل التعقيد وإبقاء كل خطوة واضحة وشفافة.",
      steps: [
        {
          icon: "sparkles",
          title: "نفهم أهدافك",
          text: "نراجع احتياجاتك، الولاية المناسبة، المتطلبات البنكية، وطبيعة نشاطك التجاري.",
        },
        {
          icon: "clipboard",
          title: "نجهز ونقدم الملف",
          text: "ننظم الوثائق، نجهز طلب التأسيس، ونرشدك إلى كل ما هو مطلوب.",
        },
        {
          icon: "badge",
          title: "تستلم وثائقك",
          text: "تحصل على وثائق التأسيس، اتفاقية التشغيل، ومساعدة EIN ضمن مسار منظم.",
        },
        {
          icon: "wallet",
          title: "تشغّل بثقة",
          text: "تبدأ بخطوات أوضح مع التوجيه البنكي، جاهزية المدفوعات، وتذكيرات الامتثال.",
        },
      ],
    },
    advantages: {
      eyebrow: "لماذا Rita",
      title: "مصمم للمؤسسين العالميين الذين يحتاجون إلى الوضوح.",
      items: [
        {
          title: "تركيز على غير المقيمين",
          text: "خدماتنا مبنية حول التحديات التي يواجهها المؤسسون الدوليون عند دخول السوق الأمريكي.",
        },
        {
          title: "عملية شفافة",
          text: "تعرف ما الذي يحدث، وما المطلوب منك، وما هي الخطوة التالية في كل مرحلة.",
        },
        {
          title: "دعم طويل المدى",
          text: "نساعدك بعد التأسيس أيضاً في البنوك، المدفوعات، التذكيرات، ودعم الامتثال.",
        },
      ],
    },
    finalCta: {
      title: "ابدأ مشروعك الأمريكي مع Rita.",
      text:
        "أطلق، أدر، وانمُ بشركتك الأمريكية من خلال منصة رقمية واضحة.",
      primary: "ابدأ شركتي",
      secondary: "تحدث مع Rita",
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
  visible: {
    transition: { staggerChildren: 0.1 },
  },
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
  const Icon = iconMap[service.icon];

  return (
    <motion.article
      className="service-page-card"
      variants={fadeUp}
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 230, damping: 20 }}
    >
      <span className="service-page-number">{String(index + 1).padStart(2, "0")}</span>

      <div className="service-page-icon">
        <Icon size={30} />
      </div>

      <h2>{service.title}</h2>
      <p>{service.text}</p>

      <ul>
        {service.features.map((feature) => (
          <li key={feature}>
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
          {t.process.steps.map((step, index) => {
            const Icon = iconMap[step.icon];

            return (
              <motion.article
                className="services-process-card"
                key={step.title}
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
              {t.advantages.items.map((item, index) => (
                <motion.div
                  key={item.title}
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
              <a href="#application" className="btn btn-white">
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
  const { lang, isArabic, changeLanguage } = useLanguage();
  const t = copy[lang];

  return (
    <div className={`services-page ${isArabic ? "rtl" : "ltr"}`}>
      <Navbar t={t.nav} lang={lang} onChangeLang={changeLanguage} />

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

        <section className="services-list-section" id="services-list" key={`services-list-${lang}`}>
          <div className="services-container">
            <motion.div
              className="services-grid"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              {t.services.map((service, index) => (
                <ServiceCard key={service.title} service={service} index={index} />
              ))}
            </motion.div>
          </div>
        </section>

        <ProcessSection key={`process-${lang}`} t={t} />
        <AdvantagesSection t={t} />
        <FinalCTA t={t} />
      </main>

      <Footer t={t.footer} />
    </div>
  );
}

export default Services;
