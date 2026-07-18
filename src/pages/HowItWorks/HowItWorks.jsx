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
      eyebrow: "About Rita Digital Services",
      title: "About RITA\nDIGITAL SERVICES",
      subtitle: "Bridging the gap between global entrepreneurs and the American market.",
      primary: "Start your journey",
      secondary: "Explore the process",
    },
    introStats: [
      { value: "Global", label: "Founder support" },
      { value: "100%", label: "Remote guidance" },
      { value: "6+", label: "Core solutions" },
    ],
    mission: {
      label: "Our Mission",
      title: "Make U.S. business access simple, transparent, and borderless.",
      text:
        "To democratize access to the U.S. business ecosystem by providing frictionless, transparent, and compliant corporate formation services for international founders.",
    },
    vision: {
      label: "Our Vision",
      title: "Build the global standard for non-resident U.S. entity management.",
      text:
        "To be the globally recognized gold standard for non-resident U.S. entity management, empowering millions of entrepreneurs to operate borderless businesses.",
    },
    story: {
      label: "Our Story",
      title: "Built from real founder pain, designed for clarity.",
      text:
        "Founded by experts who personally experienced the hurdles of establishing international business entities, RITA DIGITAL SERVICES was built to solve a critical problem. We realized that while talent is distributed equally around the globe, opportunity is not. Over the years, we have assembled a world-class team of corporate consultants, compliance experts, and banking specialists to create a seamless pathway into the U.S. market.",
    },
    expertise: {
      label: "Our Expertise",
      title: "People who guide every step with care.",
      members: [
        {
          initials: "SJ",
          name: "Sarah Jenkins",
          role: "Head of Corporate Formations",
          text: "Over 10 years of experience in Delaware, Wyoming, and NM corporate law.",
        },
        {
          initials: "MC",
          name: "Michael Chen",
          role: "Compliance Director",
          text: "Former regulatory auditor specializing in FinCEN and international tax obligations.",
        },
        {
          initials: "AH",
          name: "Amira Hassan",
          role: "Global Client Success",
          text: "Ensuring seamless onboarding for founders across the MENA region and Europe.",
        },
      ],
    },
    testimonials: {
      label: "What Our Clients Say",
      title: "Trusted by founders building across borders.",
      items: [
        {
          quote:
            "RITA DIGITAL made forming my Wyoming LLC incredibly easy. The banking solution was a lifesaver for our SaaS product.",
          name: "Lars O.",
          company: "TechNova",
          initials: "L",
        },
        {
          quote:
            "The best investment for my business. I got my EIN without an SSN faster than expected.",
          name: "Fatima Z.",
          company: "E-Commerce Global",
          initials: "F",
        },
        {
          quote:
            "Compliance used to keep me up at night. Now I leave it entirely to their expert team.",
          name: "Diego R.",
          company: "Creative Agency",
          initials: "D",
        },
      ],
    },
    faq: {
      label: "Frequently Asked Questions",
      title: "Clear answers to your most pressing questions about U.S. business formation.",
      groups: [
        {
          title: "LLC Formation",
          icon: Building2,
          items: [
            {
              q: "Do I need to be a U.S. citizen to form an LLC?",
              a: "No. RITA DIGITAL SERVICES helps non-U.S. residents prepare and manage the formation process remotely.",
            },
            {
              q: "Why do you recommend Wyoming or New Mexico?",
              a: "They are commonly selected by international founders for simple maintenance, privacy-friendly structures, and practical filing costs.",
            },
            {
              q: "How long does the LLC formation take?",
              a: "Timelines depend on the state and filing volume, but our process is designed to keep documents, updates, and next steps organized from day one.",
            },
            {
              q: "Do I need a physical address in the U.S.?",
              a: "Most founders need a registered agent and a reliable business mailing solution. Our team helps you understand the options available for your case.",
            },
            {
              q: "What is a Registered Agent?",
              a: "A registered agent is the official contact that receives legal and state documents for your company.",
            },
          ],
        },
        {
          title: "EIN Acquisition",
          icon: FileText,
          items: [
            {
              q: "What is an EIN?",
              a: "An EIN is an Employer Identification Number used to identify a business for U.S. tax and banking purposes.",
            },
            {
              q: "Can I get an EIN without an SSN or ITIN?",
              a: "Many non-U.S. founders can apply without an SSN or ITIN. We help prepare the request correctly and track the process.",
            },
            {
              q: "How long does it take to get the EIN?",
              a: "The timeline can vary depending on the application route and processing volume. We keep you updated as the request moves forward.",
            },
            {
              q: "Does an EIN expire?",
              a: "An EIN generally stays connected to the business once assigned, but company records and compliance should remain updated.",
            },
          ],
        },
        {
          title: "Banking Solutions",
          icon: Landmark,
          items: [
            {
              q: "Do I need to travel to the U.S. to open a bank account?",
              a: "Many modern providers support remote applications for eligible businesses. We guide you through suitable options and document preparation.",
            },
            {
              q: "Can I use Stripe and PayPal with my account?",
              a: "RITA DIGITAL SERVICES helps you prepare your business setup for payment providers and online commerce tools.",
            },
            {
              q: "Are my funds safe?",
              a: "We guide clients toward established financial providers and help them understand the information each provider requires.",
            },
            {
              q: "What documents are required?",
              a: "Requirements vary, but they often include formation documents, EIN confirmation, ownership information, and identity documents.",
            },
          ],
        },
        {
          title: "Compliance & Taxes",
          icon: Scale,
          items: [
            {
              q: "Do I have to pay U.S. taxes?",
              a: "Tax obligations depend on your structure, activity, and country of residence. We help organize the business side and can point you toward qualified tax support.",
            },
            {
              q: "What is the BOI report?",
              a: "The BOI report refers to beneficial ownership information reporting. Requirements can change, so we help clients stay organized around compliance updates.",
            },
            {
              q: "What are annual reports?",
              a: "Some states require recurring reports or renewals to keep the company in good standing.",
            },
            {
              q: "What happens if I miss a compliance deadline?",
              a: "Missing deadlines can lead to fees or loss of good standing. Our compliance reminders are designed to reduce that risk.",
            },
          ],
        },
      ],
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
      toggleLang: "تغيير اللغة",
    },
    hero: {
      eyebrow: "عن Rita Digital Services",
      title: "عن RITA\nDIGITAL SERVICES",
      subtitle: "نربط رواد الأعمال حول العالم بالسوق الأمريكي بطريقة أوضح وأسهل.",
      primary: "ابدأ رحلتك",
      secondary: "استكشف الخطوات",
    },
    introStats: [
      { value: "عالمي", label: "دعم المؤسسين" },
      { value: "100%", label: "إرشاد عن بعد" },
      { value: "6+", label: "حلول أساسية" },
    ],
    mission: {
      label: "مهمتنا",
      title: "تبسيط الوصول إلى منظومة الأعمال الأمريكية بوضوح ومن دون حدود.",
      text:
        "إتاحة الوصول إلى منظومة الأعمال الأمريكية عبر خدمات تأسيس شركات سلسة وشفافة ومتوافقة مع المتطلبات، مخصصة للمؤسسين الدوليين.",
    },
    vision: {
      label: "رؤيتنا",
      title: "بناء معيار عالمي لإدارة الكيانات الأمريكية لغير المقيمين.",
      text:
        "أن نكون المعيار الذهبي عالميًا في إدارة الشركات الأمريكية لغير المقيمين، وتمكين ملايين رواد الأعمال من تشغيل أعمال بلا حدود.",
    },
    story: {
      label: "قصتنا",
      title: "بُنيت من تحديات حقيقية، وصُممت لتمنحك الوضوح.",
      text:
        "تأسست RITA DIGITAL SERVICES على يد خبراء عاشوا شخصيًا تحديات تأسيس الكيانات التجارية الدولية، لذلك صُممت لحل مشكلة مهمة. أدركنا أن المواهب موزعة حول العالم، لكن الفرص ليست كذلك. وعلى مر السنوات، جمعنا فريقًا عالميًا من مستشاري الشركات وخبراء الامتثال والمتخصصين في الحلول البنكية لإنشاء طريق سلس نحو السوق الأمريكي.",
    },
    expertise: {
      label: "خبراتنا",
      title: "فريق يرافقك في كل خطوة بعناية.",
      members: [
        {
          initials: "SJ",
          name: "Sarah Jenkins",
          role: "رئيسة تأسيس الشركات",
          text: "أكثر من 10 سنوات خبرة في قوانين الشركات في Delaware وWyoming وNew Mexico.",
        },
        {
          initials: "MC",
          name: "Michael Chen",
          role: "مدير الامتثال",
          text: "مدقق تنظيمي سابق متخصص في FinCEN والالتزامات الضريبية الدولية.",
        },
        {
          initials: "AH",
          name: "Amira Hassan",
          role: "نجاح العملاء عالميًا",
          text: "تضمن تجربة انضمام سلسة للمؤسسين في منطقة MENA وأوروبا.",
        },
      ],
    },
    testimonials: {
      label: "ماذا يقول عملاؤنا",
      title: "يثق بنا مؤسسون يبنون أعمالهم عبر الحدود.",
      items: [
        {
          quote: "RITA DIGITAL جعلت تأسيس LLC في وايومنغ سهلًا جدًا. الحل البنكي كان مهمًا جدًا لمنتج SaaS الخاص بنا.",
          name: "Lars O.",
          company: "TechNova",
          initials: "L",
        },
        {
          quote: "أفضل استثمار لعملي. حصلت على EIN بدون SSN أسرع مما توقعت.",
          name: "Fatima Z.",
          company: "E-Commerce Global",
          initials: "F",
        },
        {
          quote: "الامتثال كان يقلقني دائمًا. الآن أتركه بالكامل لفريقهم الخبير.",
          name: "Diego R.",
          company: "Creative Agency",
          initials: "D",
        },
      ],
    },
    faq: {
      label: "الأسئلة الشائعة",
      title: "إجابات واضحة على أهم أسئلتك حول تأسيس الأعمال في أمريكا.",
      groups: [
        {
          title: "تأسيس LLC",
          icon: Building2,
          items: [
            { q: "هل أحتاج أن أكون مواطنًا أمريكيًا لتأسيس LLC؟", a: "لا. تساعد RITA DIGITAL SERVICES غير المقيمين في أمريكا على تجهيز وإدارة عملية التأسيس عن بعد." },
            { q: "لماذا تنصحون بـ Wyoming أو New Mexico؟", a: "غالبًا ما يختارها المؤسسون الدوليون بسبب سهولة الإدارة والخصوصية وتكاليف الإيداع العملية." },
            { q: "كم يستغرق تأسيس LLC؟", a: "تختلف المدة حسب الولاية وحجم الطلبات، لكن مسارنا مصمم لتنظيم الوثائق والتحديثات والخطوات التالية بوضوح." },
            { q: "هل أحتاج عنوانًا فعليًا في أمريكا؟", a: "يحتاج أغلب المؤسسين إلى وكيل مسجل وحل بريد تجاري موثوق. نساعدك على فهم الخيارات المناسبة لحالتك." },
            { q: "ما هو الوكيل المسجل؟", a: "الوكيل المسجل هو جهة الاتصال الرسمية التي تستقبل الوثائق القانونية ووثائق الولاية الخاصة بشركتك." },
          ],
        },
        {
          title: "الحصول على EIN",
          icon: FileText,
          items: [
            { q: "ما هو EIN؟", a: "هو رقم تعريف صاحب العمل ويستخدم لتعريف الشركة لأغراض الضرائب والبنوك في أمريكا." },
            { q: "هل يمكنني الحصول على EIN بدون SSN أو ITIN؟", a: "يمكن للعديد من المؤسسين غير المقيمين التقديم بدون SSN أو ITIN. نساعدك على تجهيز الطلب وتتبع العملية." },
            { q: "كم يستغرق الحصول على EIN؟", a: "تختلف المدة حسب طريقة التقديم وحجم المعالجة، ونبقيك على اطلاع أثناء تقدم الطلب." },
            { q: "هل تنتهي صلاحية EIN؟", a: "غالبًا يبقى EIN مرتبطًا بالشركة بعد إصداره، لكن يجب تحديث سجلات الشركة والامتثال باستمرار." },
          ],
        },
        {
          title: "الحلول البنكية",
          icon: Landmark,
          items: [
            { q: "هل أحتاج للسفر إلى أمريكا لفتح حساب بنكي؟", a: "العديد من المزودين الحديثين يدعمون الطلبات عن بعد للشركات المؤهلة. نرشدك للخيارات المناسبة وتجهيز الوثائق." },
            { q: "هل يمكنني استخدام Stripe وPayPal مع حسابي؟", a: "نساعدك على تجهيز إعداد شركتك لمزودي الدفع وأدوات التجارة الإلكترونية." },
            { q: "هل أموالي آمنة؟", a: "نرشد العملاء نحو مزودين ماليين معروفين ونساعدهم على فهم المعلومات المطلوبة من كل مزود." },
            { q: "ما هي الوثائق المطلوبة؟", a: "تختلف المتطلبات، لكنها غالبًا تشمل وثائق التأسيس، تأكيد EIN، معلومات الملكية، ووثائق الهوية." },
          ],
        },
        {
          title: "الامتثال والضرائب",
          icon: Scale,
          items: [
            { q: "هل يجب علي دفع ضرائب أمريكية؟", a: "تعتمد الالتزامات الضريبية على هيكل الشركة والنشاط وبلد الإقامة. نساعدك على تنظيم جانب الأعمال وتوجيهك للدعم الضريبي المؤهل عند الحاجة." },
            { q: "ما هو تقرير BOI؟", a: "يشير إلى تقرير معلومات الملكية المستفيدة. قد تتغير المتطلبات، لذلك نساعد العملاء على البقاء منظمين حول تحديثات الامتثال." },
            { q: "ما هي التقارير السنوية؟", a: "بعض الولايات تتطلب تقارير أو تجديدات دورية للحفاظ على وضع الشركة الجيد." },
            { q: "ماذا يحدث إذا فاتني موعد امتثال؟", a: "قد يؤدي تفويت المواعيد إلى رسوم أو فقدان الوضع الجيد للشركة. تذكيرات الامتثال لدينا مصممة لتقليل هذا الخطر." },
          ],
        },
      ],
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

function ProcessVisual({ type }) {
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
            <span>Company setup</span>
          </div>
          <div className="hiw-board-card two">
            <FileText size={22} />
            <span>EIN request</span>
          </div>
          <div className="hiw-board-card three">
            <Banknote size={22} />
            <span>Banking guide</span>
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
            <strong>Borderless</strong>
            <span>U.S. business access</span>
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
                  <ProcessVisual type={card.type} />
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
            const Icon = group.icon;

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
  const { lang, isArabic, changeLanguage } = useLanguage();
  const t = copy[lang];

const heroTitle = useMemo(() => t.hero.title.split("\n"), [t.hero.title]);

  return (
    <div className={`hiw-page site-shell dark ${isArabic ? "rtl" : "ltr"}`}>
      <Navbar t={t.nav} lang={lang} onChangeLang={changeLanguage} />

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

      <Footer t={t.footer} />
    </div>
  );
}

export default HowItWorks;
