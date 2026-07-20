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
  BarChart3,
  Building2,
  CheckCircle2,
  Globe2,
  Landmark,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  WalletCards,
} from "lucide-react";

import Navbar from "../../components/Navbar.jsx";
import Footer from "../../components/Footer.jsx";
import "./Home.css";

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
      themeDark: "Dark",
      themeLight: "Light",
      toggleTheme: "Change theme",
      toggleLang: "Change language",
    },
    hero: {
      pillNew: "RITA ONE",
      eyebrow:
        "For Algerian founders, freelancers, agencies, and online sellers",
      pillText:
        "Rita Digital Services — form a US LLC and unlock global payment access.",
      learnMore: "Learn more",
      title:
        "Launch your US company and get ready to receive payments worldwide.",
      subtitle:
        "Rita helps non-US residents form a US LLC, prepare EIN documents, and get guided banking and payment options — with every step tracked online.",
      primary: "Start my US company",
      secondary: "See the process",
      quickFacts: [
        "US LLC",
        "EIN documents",
        "Banking & payments",
        "Client portal",
      ],
      problemLabel: "The problem",
      solutionLabel: "Rita solution",
      problems: [
        "Stripe, PayPal, and Wise are limited for many Algerian businesses.",
        "Clients abroad want to pay a real business, not a personal account.",
        "LLC, EIN, banking, and compliance steps feel unclear.",
      ],
      solutionSteps: [
        "US LLC formation",
        "EIN assistance",
        "Banking & payment guidance",
        "Client portal tracking",
      ],
      audienceLabel: "Built for",
      audiences: [
        "Freelancers",
        "E-commerce sellers",
        "Agencies",
        "Startups",
        "IT consultants",
      ],
      visualLabel: "How it works",
      visualTitle: "A clear path from local idea to payment-ready US business.",
      visualSubtitle:
        "Four simple stages, managed through Rita instead of scattered WhatsApp messages, emails, and confusing forms.",
      visualItems: [
        "Form the US LLC",
        "Prepare EIN and legal documents",
        "Choose banking and payment options",
        "Track delivery from your portal",
      ],
      localTrust:
        "A local trusted intermediary for Algerian and Arab entrepreneurs.",
      trust:
        "The visitor should understand this in the first 5 seconds: Rita turns a local founder into a globally ready US business.",
    },
    product: {
      label: "Rita Client Portal",
      title: "Track your company formation from one calm dashboard.",
      pill: "Live progress",
      timeline: "Incorporation timeline",
      application: "Application submitted",
      documentsVerified: "Documents verified",
      stateFiling: "State filing processing",
      ein: "EIN assistance",
      completed: "Completed",
      progress: "In progress",
      next: "Next step",
      documents: "Documents",
      uploaded: "4 uploaded",
      updates: "Updates",
      newUpdates: "2 new",
      banking: "Banking",
      optionsReady: "Options ready",
    },
    startGrow: {
      label: "Start and Grow",
      title: "Everything you need to start and run your business.",
      tabs: [
        {
          label: "Explore Start",
          heading: "Form your US LLC without paperwork headaches.",
          text: "Rita turns the complex steps — company formation, state filing, document preparation, and EIN assistance — into one guided process for Algerian and Arab founders.",
          button: "Start my company",
          type: "timeline",
        },
        {
          label: "Explore Rita One",
          badge: "New",
          heading: "Run your company setup from one connected portal.",
          text: "Instead of following your file through WhatsApp, email, and separate folders, clients can upload documents, see progress, and receive banking/payment updates in one place.",
          button: "Explore Rita One",
          type: "portal",
        },
      ],
      visual: {
        timelineTitle: "Incorporation timeline",
        sent: "Application sent · State filing",
        bankMade: "Bank application made",
        einReceived: "EIN received",
        days7: "7 days ago",
        days5: "5 days ago",
        days3: "3 days ago",
        progress: "Total setup progress",
        mailFrom: "Mail from",
        stateMail: "The State of Wyoming",
        bankingOptions: "Banking options",
      },
    },
    explore: {
      label: "Explore",
      title: "One platform to launch, operate, and grow.",
      learnMore: "Learn more",
      services: [
        {
          icon: "building",
          title: "Incorporation",
          text: "Form your US LLC remotely in a simple guided process.",
          tag: "LLC setup",
        },
        {
          icon: "badge",
          title: "EIN Assistance",
          text: "Prepare your EIN request and keep your business ready to operate.",
          tag: "IRS ready",
        },
        {
          icon: "landmark",
          title: "Banking",
          text: "Guidance for Mercury, Relay, Wise, and business banking options.",
          tag: "Banking",
        },
        {
          icon: "wallet",
          title: "Payments",
          text: "Prepare your business for Stripe, PayPal, Shopify Payments, and more.",
          tag: "Payments",
        },
        {
          icon: "shield",
          title: "Compliance",
          text: "Stay organized with annual reminders and compliance tracking.",
          tag: "Annual reports",
        },
        {
          icon: "upload",
          title: "Client Portal",
          text: "Upload documents, track progress, and receive updates in one place.",
          tag: "Dashboard",
        },
      ],
    },
    bundle: {
      label: "Rita One",
      title: "All the power of Rita, one package.",
      text: "Start, operate, and stay organized with one connected workflow.",
      button: "Learn more",
      items: [
        "LLC Formation",
        "EIN Assistance",
        "Banking Guidance",
        "Payment Setup",
        "Compliance Reminders",
        "Client Portal",
      ],
    },
    benefits: {
      label: "Faster with Rita",
      title: "Starting a company should be a celebration, not a nightmare.",
      items: [
        {
          icon: "sparkles",
          title: "All-in-one platform",
          text: "Stop jumping between forms, emails, WhatsApp, and scattered files.",
        },
        {
          icon: "shield",
          title: "Privacy & protection",
          text: "Keep sensitive documents organized in a secure client workflow.",
        },
        {
          icon: "globe",
          title: "Global support",
          text: "Built for non-US residents who want access to global business tools.",
        },
      ],
    },
    partners: {
      label: "Financial access",
      title: "Connect your US company to modern business tools.",
      items: [
        {
          title: "Banking",
          text: "Guidance for Mercury, Wise, Relay, and international business accounts.",
          stat: "ACH / SEPA",
        },
        {
          title: "Payments",
          text: "Prepare for Stripe, PayPal Business, Payoneer, and online payments.",
          stat: "Cards ready",
        },
        {
          title: "E-commerce",
          text: "Support for Shopify Payments and online store business setup.",
          stat: "Store setup",
        },
        {
          title: "Compliance",
          text: "Stay ahead of annual reports, registered agent, and renewal reminders.",
          stat: "Reminders",
        },
      ],
    },
    pricing: {
      label: "Simple pricing",
      title: "Choose the setup package that matches your stage.",
      text: "Clear one-time packages for launching your US company with the level of guidance you need.",
      recommended: "Most popular",
      oneTime: "one-time payment",
      plans: [
        {
          slug: "starter",
          tone: "starter",
          number: "01",
          name: "Starter Package",
          audience: "Best for founders at the beginning.",
          price: "299",
          button: "Start now",
          features: [
            "Assistance forming an LLC in Wyoming or New Mexico",
            "Company name availability check",
            "Articles of Organization filing preparation",
            "Operating Agreement template",
            "Company formation consultation",
            "Compliance checklist",
            "Email support",
          ],
        },
        {
          slug: "growth",
          tone: "growth",
          number: "02",
          name: "Growth Package",
          audience: "Best for founders preparing to operate.",
          price: "399",
          button: "Choose Growth",
          recommended: true,
          features: [
            "Everything in the Starter Package",
            "EIN application assistance",
            "Business banking guidance",
            "Digital company documents package",
            "Business launch checklist",
            "Priority email support",
            "One compliance consultation",
          ],
        },
        {
          slug: "premium",
          tone: "premium",
          number: "03",
          name: "Premium Package",
          audience: "Best for founders who want hands-on setup support.",
          price: "499",
          button: "Choose Premium",
          features: [
            "Everything in the Growth Package",
            "EIN follow-up assistance",
            "Introduction to banking solutions",
            "Compliance monitoring reminders",
            "Annual report reminder service",
            "Priority support",
            "One-on-one company setup consultation",
          ],
        },
      ],
    },
    trust: {
      quote:
        "“Rita Digital Services helps non-US residents worldwide establish, operate, and manage their US business with confidence.”",
      name: "Rita Digital Services",
      subtitle: "One-stop-shop solution for US LLC formation",
      metrics: [
        { value: "100%", label: "Remote process" },
        { value: "6+", label: "Core services" },
        { value: "Global", label: "Founder support" },
      ],
    },
    finalCta: {
      title: "Start your dream business with Rita.",
      text: "Launch, manage, and grow your US business with one clean digital platform.",
      primary: "Start my company",
      secondary: "Talk to Rita",
    },
    footer: {
      text: "One-stop-shop solution to establish, operate, and grow your US LLC from anywhere in the world.",
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
      themeDark: "داكن",
      themeLight: "فاتح",
      toggleTheme: "تغيير الوضع",
      toggleLang: "تغيير اللغة",
    },
    hero: {
      pillNew: "RITA ONE",
      eyebrow:
        "للمستقلين، الوكالات، المتاجر الإلكترونية ورواد الأعمال في الجزائر",
      pillText:
        "Rita Digital Services — أسّس شركة أمريكية وافتح طريقك للمدفوعات العالمية.",
      learnMore: "اعرف أكثر",
      title: "أطلق شركتك الأمريكية واستعد لاستقبال المدفوعات من العالم.",
      subtitle:
        "تساعد Rita غير المقيمين في أمريكا على تأسيس LLC، تجهيز وثائق EIN، واختيار حلول بنكية وبوابات دفع مناسبة — مع تتبع كل خطوة أونلاين.",
      primary: "ابدأ تأسيس شركتي",
      secondary: "شاهد المسار",
      quickFacts: ["LLC أمريكية", "وثائق EIN", "بنوك ومدفوعات", "بوابة عميل"],
      problemLabel: "المشكلة",
      solutionLabel: "حل Rita",
      problems: [
        "Stripe وPayPal وWise محدودة أو غير متاحة لكثير من أصحاب الأعمال في الجزائر.",
        "العملاء الأجانب يحتاجون الدفع لكيان تجاري موثوق وليس حساباً شخصياً.",
        "خطوات LLC وEIN والبنوك والامتثال تبدو معقدة وغير واضحة.",
      ],
      solutionSteps: [
        "تأسيس LLC أمريكية",
        "مساعدة EIN",
        "إرشاد بنكي وحلول دفع",
        "تتبع الملف من البوابة",
      ],
      audienceLabel: "مناسب لـ",
      audiences: [
        "المستقلون",
        "تجار E-commerce",
        "الوكالات",
        "الشركات الناشئة",
        "متخصصو IT",
      ],
      visualLabel: "كيف تعمل الخدمة",
      visualTitle: "مسار واضح من فكرة محلية إلى شركة أمريكية جاهزة للدفع.",
      visualSubtitle:
        "أربع مراحل بسيطة تديرها Rita بدل التشتت بين واتساب، الإيميل، والملفات المتفرقة.",
      visualItems: [
        "تأسيس LLC الأمريكية",
        "تجهيز EIN والوثائق القانونية",
        "اختيار حلول البنوك والمدفوعات",
        "تتبع التسليم من بوابة العميل",
      ],
      localTrust: "وسيط محلي موثوق يفهم تحديات رواد الأعمال الجزائريين والعرب.",
      trust:
        "يجب أن يفهم الزائر خلال أول 5 ثوانٍ: Rita تحوّل صاحب مشروع محلي إلى شركة أمريكية جاهزة للعالم.",
    },
    product: {
      label: "بوابة عميل Rita",
      title: "تابع مراحل تأسيس شركتك من لوحة هادئة وواضحة.",
      pill: "تقدم مباشر",
      timeline: "مسار تأسيس الشركة",
      application: "تم إرسال الطلب",
      documentsVerified: "تم التحقق من الوثائق",
      stateFiling: "معالجة ملف الولاية",
      ein: "مساعدة EIN",
      completed: "مكتمل",
      progress: "قيد المعالجة",
      next: "الخطوة التالية",
      documents: "الوثائق",
      uploaded: "4 مرفوعة",
      updates: "التحديثات",
      newUpdates: "2 جديد",
      banking: "الحلول البنكية",
      optionsReady: "الخيارات جاهزة",
    },
    startGrow: {
      label: "ابدأ وانمو",
      title: "كل ما تحتاجه لتبدأ وتدير عملك.",
      tabs: [
        {
          label: "استكشف البداية",
          heading: "أسس شركتك الأمريكية بدون تعقيد الورق.",
          text: "تحوّل Rita خطوات التأسيس المعقدة — ملف الولاية، الوثائق، ومساعدة EIN — إلى مسار واضح للمؤسسين الجزائريين والعرب.",
          button: "ابدأ شركتي",
          type: "timeline",
        },
        {
          label: "استكشف Rita One",
          badge: "جديد",
          heading: "أدر ملف شركتك من بوابة واحدة مترابطة.",
          text: "بدل متابعة الملف عبر واتساب والإيميل ومجلدات متفرقة، يستطيع العميل رفع الوثائق، رؤية التقدم، واستقبال تحديثات البنوك والمدفوعات في مكان واحد.",
          button: "استكشف Rita One",
          type: "portal",
        },
      ],
      visual: {
        timelineTitle: "مسار التأسيس",
        sent: "إرسال الطلب · ملف الولاية",
        bankMade: "تم تجهيز طلب البنك",
        einReceived: "تم استلام EIN",
        days7: "منذ 7 أيام",
        days5: "منذ 5 أيام",
        days3: "منذ 3 أيام",
        progress: "تقدم الملف",
        mailFrom: "بريد من",
        stateMail: "ولاية وايومنغ",
        bankingOptions: "خيارات بنكية",
      },
    },
    explore: {
      label: "استكشف",
      title: "منصة واحدة للإطلاق، التشغيل، والنمو.",
      learnMore: "اعرف أكثر",
      services: [
        {
          icon: "building",
          title: "تأسيس الشركة",
          text: "أسس LLC أمريكية عن بعد عبر مسار واضح وبسيط.",
          tag: "تأسيس LLC",
        },
        {
          icon: "badge",
          title: "مساعدة EIN",
          text: "حضّر طلب EIN واجعل شركتك جاهزة للتشغيل.",
          tag: "جاهز IRS",
        },
        {
          icon: "landmark",
          title: "الحسابات البنكية",
          text: "توجيه لاستخدام Mercury وRelay وWise وخيارات الحسابات التجارية.",
          tag: "Banking",
        },
        {
          icon: "wallet",
          title: "المدفوعات",
          text: "جهّز شركتك لاستخدام Stripe وPayPal وShopify Payments وغيرها.",
          tag: "Payments",
        },
        {
          icon: "shield",
          title: "الامتثال",
          text: "نظم التذكيرات السنوية وتتبع التزامات شركتك.",
          tag: "تقارير سنوية",
        },
        {
          icon: "upload",
          title: "بوابة العميل",
          text: "ارفع الوثائق، تابع التقدم، واستقبل التحديثات في مكان واحد.",
          tag: "Dashboard",
        },
      ],
    },
    bundle: {
      label: "Rita One",
      title: "كل قوة Rita في باقة واحدة.",
      text: "ابدأ، شغّل، ونظم عملك داخل مسار واحد مترابط.",
      button: "اعرف أكثر",
      items: [
        "تأسيس LLC",
        "مساعدة EIN",
        "إرشاد بنكي",
        "تجهيز المدفوعات",
        "تذكيرات الامتثال",
        "بوابة العميل",
      ],
    },
    benefits: {
      label: "أسرع مع Rita",
      title: "تأسيس الشركة يجب أن يكون بداية ممتعة، وليس كابوساً.",
      items: [
        {
          icon: "sparkles",
          title: "منصة واحدة",
          text: "لا مزيد من التنقل بين النماذج، الإيميل، واتساب والملفات المتفرقة.",
        },
        {
          icon: "shield",
          title: "خصوصية وحماية",
          text: "احفظ الوثائق الحساسة داخل مسار عميل آمن ومنظم.",
        },
        {
          icon: "globe",
          title: "دعم عالمي",
          text: "مصمم لغير المقيمين في أمريكا للوصول إلى أدوات الأعمال العالمية.",
        },
      ],
    },
    partners: {
      label: "وصول مالي",
      title: "اربط شركتك الأمريكية بأدوات أعمال حديثة.",
      items: [
        {
          title: "الحسابات البنكية",
          text: "توجيه لاستخدام Mercury وWise وRelay والحسابات التجارية الدولية.",
          stat: "ACH / SEPA",
        },
        {
          title: "المدفوعات",
          text: "تحضير Stripe وPayPal Business وPayoneer والمدفوعات الإلكترونية.",
          stat: "بطاقات جاهزة",
        },
        {
          title: "التجارة الإلكترونية",
          text: "دعم Shopify Payments وإعداد الأعمال للمتاجر الإلكترونية.",
          stat: "إعداد المتجر",
        },
        {
          title: "الامتثال",
          text: "تابع التقارير السنوية، الوكيل المسجل، وتذكيرات التجديد.",
          stat: "تذكيرات",
        },
      ],
    },
    pricing: {
      label: "أسعار واضحة",
      title: "اختر باقة التأسيس المناسبة لمرحلة مشروعك.",
      text: "باقات بدفعة واحدة لإطلاق شركتك الأمريكية مع مستوى الدعم الذي تحتاجه.",
      recommended: "الأكثر اختياراً",
      oneTime: "دفعة واحدة",
      plans: [
        {
          slug: "starter",
          tone: "starter",
          number: "01",
          name: "باقة البداية",
          audience: "الأفضل لأصحاب الأعمال في البداية.",
          price: "299",
          button: "ابدأ الآن",
          features: [
            "مساعدة في تأسيس LLC في وايومنغ أو نيو مكسيكو",
            "التحقق من توفر اسم الشركة",
            "تجهيز وتقديم Articles of Organization",
            "نموذج Operating Agreement",
            "استشارة تأسيس الشركة",
            "قائمة تحقق للامتثال",
            "دعم عبر البريد الإلكتروني",
          ],
        },
        {
          slug: "growth",
          tone: "growth",
          number: "02",
          name: "باقة النمو",
          audience: "الأفضل لرواد الأعمال الجاهزين للتشغيل.",
          price: "399",
          button: "اختر النمو",
          recommended: true,
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
          slug: "premium",
          tone: "premium",
          number: "03",
          name: "الباقة المميزة",
          audience: "الأفضل لمن يريد إعداداً كاملاً للشركة.",
          price: "499",
          button: "اختر المميزة",
          features: [
            "كل مزايا باقة النمو مشمولة",
            "مساعدة في متابعة EIN",
            "إرشاد للتعرّف على الحلول البنكية",
            "تذكيرات لمراقبة الامتثال",
            "خدمة تذكير التقرير السنوي",
            "دعم أولوية",
            "استشارة فردية لإعداد الشركة",
          ],
        },
      ],
    },
    trust: {
      quote:
        "“تساعد Rita Digital Services غير المقيمين في أمريكا على تأسيس وتشغيل وإدارة أعمالهم الأمريكية بثقة.”",
      name: "Rita Digital Services",
      subtitle: "حل متكامل لتأسيس الشركات الأمريكية",
      metrics: [
        { value: "100%", label: "عن بعد" },
        { value: "6+", label: "خدمات أساسية" },
        { value: "عالمي", label: "دعم رواد الأعمال" },
      ],
    },
    finalCta: {
      title: "ابدأ مشروعك الأمريكي مع Rita.",
      text: "أطلق، أدر، وانمُ بشركتك الأمريكية من خلال منصة رقمية واضحة.",
      primary: "ابدأ شركتي",
      secondary: "تحدث مع Rita",
    },
    footer: {
      text: "حل متكامل لتأسيس وتشغيل وتنمية شركتك الأمريكية من أي مكان في العالم.",
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

function ExploreSection({ t }) {
  return (
    <section className="explore-section" id="services">
      <div className="container">
        <Reveal>
          <div className="section-heading compact">
            <span>{t.explore.label}</span>
            <h2>{t.explore.title}</h2>
          </div>
        </Reveal>

        <div className="services-grid">
          {t.explore.services.map((service, index) => {
            const Icon = iconMap[service.icon];

            return (
              <Reveal key={service.title} delay={index * 0.06}>
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
                  <span className="service-tag">{service.tag}</span>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                  <a href="#start">
                    {t.explore.learnMore} <ArrowRight size={15} />
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

function PricingSection({ t }) {
  const planIcons = [Building2, Sparkles, BadgeCheck];

  return (
    <section
      className="pricing-section"
      id="pricing"
      aria-labelledby="pricing-title"
    >
      <div className="container">
        <Reveal>
          <div className="section-heading compact pricing-heading">
            <span>{t.pricing.label}</span>
            <h2 id="pricing-title">{t.pricing.title}</h2>
            <p>{t.pricing.text}</p>
          </div>
        </Reveal>

        <div className="pricing-grid">
          {t.pricing.plans.map((plan, index) => {
            const PlanIcon = planIcons[index] || BadgeCheck;

            return (
              <Reveal
                key={plan.slug}
                delay={index * 0.08}
                className="pricing-reveal"
              >
                <motion.article
                  className={`pricing-card pricing-card-${plan.tone} ${
                    plan.recommended ? "is-recommended" : ""
                  }`}
                  whileHover={{ y: -9 }}
                  transition={{ type: "spring", stiffness: 250, damping: 18 }}
                >
                  {plan.recommended && (
                    <div className="pricing-ribbon">
                      {t.pricing.recommended}
                    </div>
                  )}

                  <span className="pricing-number">{plan.number}</span>

                  <div className="pricing-plan-icon">
                    <PlanIcon size={21} />
                  </div>

                  <div className="pricing-plan-copy">
                    <h3>{plan.name}</h3>
                    <p>{plan.audience}</p>
                  </div>

                  <div className="pricing-price-row">
                    <strong>${plan.price}</strong>
                    <span>/ {t.pricing.oneTime}</span>
                  </div>

                  <ul className="pricing-features">
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <CheckCircle2 size={17} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={`/contact?plan=${plan.slug}`}
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

  const lang = languageContext?.lang || "en";
  const isArabic = languageContext?.isArabic ?? lang === "ar";
  const changeLanguage = languageContext?.changeLanguage || (() => {});
  const t = copy[lang] || copy.en;

  return (
    <div className={`site-shell dark ${isArabic ? "rtl" : "ltr"}`}>
      <Navbar t={t.nav} lang={lang} onChangeLang={changeLanguage} />

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
        <ExploreSection t={t} />
        <PricingSection t={t} />
        <BundleSection t={t} />
        <BenefitsSection t={t} />
        <PartnersSection t={t} />
        <TrustSection t={t} />
        <FinalCTA t={t} />
      </main>

      <Footer t={t.footer} />
    </div>
  );
}

export default Home;
