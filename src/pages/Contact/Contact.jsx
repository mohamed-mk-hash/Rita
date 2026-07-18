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
import "./Contact.css";

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
      label: "Contact",
      title: "Get in touch with RITA DIGITAL SERVICES",
      text:
        "Have questions about starting your U.S. business? Our experts are ready to guide you with clear answers and practical next steps.",
      primary: "Send a message",
      secondary: "Contact details",
    },
    section: {
      label: "Contact us",
      title: "Let’s talk about your U.S. business setup.",
      text:
        "Tell us what you need and our team will help you choose the right path for LLC formation, EIN assistance, banking guidance, or compliance support.",
    },
    info: {
      title: "Contact Information",
      emailLabel: "Email",
      email: "info@ritadigitalservices.com",
      phoneLabel: "Phone",
      phone: "+1 (773) 640-4849",
      addressLabel: "Address",
      address: "6500 W Irving Park Rd, Chicago, Illinois 60634",
      hoursLabel: "Business Hours",
      hours: "Monday – Friday: 9:00 AM – 6:00 PM (EST)",
    },
    form: {
      title: "Send us a message",
      subtitle: "We usually reply within one business day.",
      fullName: "Full Name",
      fullNamePlaceholder: "Full Name",
      email: "Email Address",
      emailPlaceholder: "john@example.com",
      phone: "Phone Number",
      phonePlaceholder: "+1 234 567 8900",
      subject: "Subject",
      subjectPlaceholder: "Subject",
      message: "Your Message",
      messagePlaceholder: "Tell us about your business goals...",
      button: "Send Message",
      success: "Message ready. Connect this form to your backend to receive submissions.",
    },
    cards: [
      {
        icon: "shield",
        title: "Clear guidance",
        text: "Get straightforward answers about formation, EIN, banking, and compliance.",
      },
      {
        icon: "globe",
        title: "Global founders",
        text: "Built for non-U.S. residents who want to operate with confidence.",
      },
      {
        icon: "clock",
        title: "Fast response",
        text: "Send your question and our team will respond with the next step.",
      },
    ],
    cta: {
      title: "Ready to start your U.S. business?",
      text: "Reach out today and we’ll help you understand the right package and process for your goals.",
      button: "Start my LLC",
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
      label: "تواصل معنا",
      title: "تواصل مع RITA DIGITAL SERVICES",
      text:
        "لديك أسئلة حول بدء عملك التجاري في الولايات المتحدة؟ فريقنا جاهز لمساعدتك بإجابات واضحة وخطوات عملية.",
      primary: "أرسل رسالة",
      secondary: "معلومات التواصل",
    },
    section: {
      label: "تواصل معنا",
      title: "دعنا نتحدث عن إعداد شركتك الأمريكية.",
      text:
        "أخبرنا بما تحتاجه، وسنساعدك في اختيار المسار المناسب لتأسيس LLC، أو المساعدة في EIN، أو الإرشاد البنكي، أو دعم الامتثال.",
    },
    info: {
      title: "معلومات التواصل",
      emailLabel: "البريد الإلكتروني",
      email: "info@ritadigitalservices.com",
      phoneLabel: "الهاتف",
      phone: "+1 (773) 640-4849",
      addressLabel: "العنوان",
      address: "6500 W Irving Park Rd, Chicago, Illinois 60634",
      hoursLabel: "ساعات العمل",
      hours: "من الإثنين إلى الجمعة: 9:00 صباحًا – 6:00 مساءً (EST)",
    },
    form: {
      title: "أرسل لنا رسالة",
      subtitle: "عادةً نرد خلال يوم عمل واحد.",
      fullName: "الاسم الكامل",
      fullNamePlaceholder: "الاسم الكامل",
      email: "البريد الإلكتروني",
      emailPlaceholder: "john@example.com",
      phone: "رقم الهاتف",
      phonePlaceholder: "+1 234 567 8900",
      subject: "الموضوع",
      subjectPlaceholder: "الموضوع",
      message: "رسالتك",
      messagePlaceholder: "اكتب لنا أهدافك التجارية...",
      button: "إرسال الرسالة",
      success: "الرسالة جاهزة. اربط هذا النموذج بالـ backend حتى تستقبل الطلبات.",
    },
    cards: [
      {
        icon: "shield",
        title: "إرشاد واضح",
        text: "احصل على إجابات مباشرة حول التأسيس، EIN، الحسابات البنكية، والامتثال.",
      },
      {
        icon: "globe",
        title: "للمؤسسين حول العالم",
        text: "مصمم لغير المقيمين في أمريكا لتشغيل أعمالهم بثقة ووضوح.",
      },
      {
        icon: "clock",
        title: "رد سريع",
        text: "أرسل سؤالك، وسنرجع لك بخطوة واضحة تساعدك على التقدم.",
      },
    ],
    cta: {
      title: "جاهز لبدء شركتك الأمريكية؟",
      text: "تواصل معنا اليوم وسنساعدك على فهم الباقة والمسار المناسبين لأهدافك.",
      button: "ابدأ LLC",
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
  shield: ShieldCheck,
  globe: Globe2,
  clock: CalendarClock,
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: [0.16, 1, 0.3, 1] },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.11 },
  },
};

function ContactInfoItem({ icon: Icon, label, value }) {
  return (
    <motion.div
      className="contact-info-item"
      variants={fadeUp}
      whileHover={{ x: 6 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <div className="contact-info-icon">
        <Icon size={22} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </motion.div>
  );
}

function Contact() {
  const { lang, isArabic, changeLanguage } = useLanguage();
  const [sent, setSent] = useState(false);
  const t = copy[lang];

  function handleSubmit(event) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <div className={`contact-page ${isArabic ? "rtl" : "ltr"}`}>
      <Navbar t={t.nav} lang={lang} onChangeLang={changeLanguage} />

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
            <motion.div className="contact-pill" variants={fadeUp}>
              <MessageCircle size={16} />
              <span>{t.hero.label}</span>
            </motion.div>

            <motion.h1 variants={fadeUp}>{t.hero.title}</motion.h1>
            <motion.div className="contact-red-line" variants={fadeUp} />
            <motion.p variants={fadeUp}>{t.hero.text}</motion.p>

            <motion.div className="contact-hero-actions" variants={fadeUp}>
              <a href="#contact-form" className="contact-btn contact-btn-red">
                {t.hero.primary}
                <ArrowRight size={17} />
              </a>
              <a href="#contact-info" className="contact-btn contact-btn-muted">
                {t.hero.secondary}
              </a>
            </motion.div>
          </motion.div>
        </section>

        <section className="contact-main-section" id="contact-form">
          <div className="contact-container">
            <motion.div
              className="contact-section-heading"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
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
                initial={{ opacity: 0, y: 38, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="contact-card-glow" />
                <h3>{t.info.title}</h3>

                <motion.div
                  className="contact-info-list"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.4 }}
                  variants={stagger}
                >
                  <ContactInfoItem icon={Mail} label={t.info.emailLabel} value={t.info.email} />
                  <ContactInfoItem icon={Phone} label={t.info.phoneLabel} value={t.info.phone} />
                  <ContactInfoItem icon={MapPin} label={t.info.addressLabel} value={t.info.address} />
                  <ContactInfoItem icon={Clock} label={t.info.hoursLabel} value={t.info.hours} />
                </motion.div>
              </motion.aside>

              <motion.form
                className="contact-form-card"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 38, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.72, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="contact-form-top">
                  <div>
                    <h3>{t.form.title}</h3>
                    <p>{t.form.subtitle}</p>
                  </div>
                  <div className="contact-form-icon">
                    <Send size={20} />
                  </div>
                </div>

                <div className="contact-form-grid">
                  <label>
                    <span>{t.form.fullName}</span>
                    <input type="text" placeholder={t.form.fullNamePlaceholder} required />
                  </label>

                  <label>
                    <span>{t.form.email}</span>
                    <input type="email" placeholder={t.form.emailPlaceholder} required />
                  </label>

                  <label>
                    <span>{t.form.phone}</span>
                    <input type="tel" placeholder={t.form.phonePlaceholder} />
                  </label>

                  <label>
                    <span>{t.form.subject}</span>
                    <input type="text" placeholder={t.form.subjectPlaceholder} required />
                  </label>

                  <label className="full">
                    <span>{t.form.message}</span>
                    <textarea placeholder={t.form.messagePlaceholder} rows="6" required />
                  </label>
                </div>

                {sent && (
                  <motion.div
                    className="contact-success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <CheckCircle2 size={18} />
                    <span>{t.form.success}</span>
                  </motion.div>
                )}

                <button className="contact-submit" type="submit">
                  <Send size={17} />
                  {t.form.button}
                </button>
              </motion.form>
            </div>
          </div>
        </section>

        <section className="contact-support-section">
          <div className="contact-container">
            <div className="contact-support-grid">
              {t.cards.map((card, index) => {
                const Icon = iconMap[card.icon];

                return (
                  <motion.article
                    className="contact-support-card"
                    key={card.title}
                    initial={{ opacity: 0, y: 32 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ duration: 0.62, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -8 }}
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
        <a href="#contact-form" className="btn btn-white">
          {isArabic ? "ابدأ شركتي" : "Start my company"}
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

export default Contact;
