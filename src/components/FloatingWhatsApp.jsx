import { useEffect, useRef, useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { X, MessageCircleMore } from "lucide-react";

import { useLanguage } from "../context/LanguageContext.jsx";
import "./FloatingWhatsApp.css";

const whatsappNumber = "17736404849";

const whatsappContent = {
  en: {
    label: "Contact us",
    ariaLabel: "Contact us on WhatsApp",

    panelTitle: "How can we help?",
    panelText: "Choose a topic to start the conversation.",

    messages: [
      {
        label: "Start a US LLC",
        message:
          "Hello, I would like to know more about starting a US LLC with Rita Digital Services.",
      },
      {
        label: "EIN assistance",
        message:
          "Hello, I would like to ask about EIN assistance for my US company.",
      },
      {
        label: "Banking & payments",
        message:
          "Hello, I would like more information about US banking and payment solutions such as Wise, PayPal, Stripe, or other options.",
      },
      {
        label: "Pricing & packages",
        message:
          "Hello, I would like to know more about your pricing and packages.",
      },
      {
        label: "Existing application",
        message:
          "Hello, I already have an application with Rita Digital Services and I need help with my request.",
      },
    ],

    other: "Other message",
  },

  ar: {
    label: "تواصل معنا",
    ariaLabel: "تواصل معنا عبر واتساب",

    panelTitle: "كيف يمكننا مساعدتك؟",
    panelText: "اختر موضوعًا لبدء المحادثة.",

    messages: [
      {
        label: "تأسيس شركة LLC",
        message:
          "مرحباً، أريد معرفة المزيد حول تأسيس شركة LLC أمريكية مع Rita Digital Services.",
      },
      {
        label: "المساعدة في EIN",
        message:
          "مرحباً، أريد الاستفسار عن خدمة الحصول على رقم EIN لشركتي الأمريكية.",
      },
      {
        label: "البنوك والمدفوعات",
        message:
          "مرحباً، أريد معرفة المزيد حول الحلول البنكية وخيارات الدفع مثل Wise وPayPal وStripe وغيرها.",
      },
      {
        label: "الأسعار والباقات",
        message:
          "مرحباً، أريد معرفة المزيد حول الأسعار والباقات المتوفرة.",
      },
      {
        label: "لدي طلب حالي",
        message:
          "مرحباً، لدي طلب حالي مع Rita Digital Services وأحتاج إلى مساعدة بخصوصه.",
      },
    ],

    other: "رسالة أخرى",
  },
};

function FloatingWhatsApp() {
  const languageContext = useLanguage();

  const contextLanguage =
    languageContext?.lang ??
    languageContext?.language ??
    languageContext?.currentLanguage ??
    (languageContext?.isArabic ? "ar" : "en");

  const normalizedLanguage = String(contextLanguage)
    .trim()
    .toLowerCase();

  const isArabic =
    languageContext?.isArabic ??
    normalizedLanguage.startsWith("ar");

  const language = isArabic ? "ar" : "en";
  const t = whatsappContent[language];

  const [isOpen, setIsOpen] = useState(false);

  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function openWhatsApp(message = "") {
    const whatsappUrl = message
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
      : `https://wa.me/${whatsappNumber}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );

    setIsOpen(false);
  }

  return (
    <div
      className={`floating-whatsapp-wrapper ${
        isArabic ? "is-arabic" : "is-english"
      }`}
      ref={wrapperRef}
      dir={isArabic ? "rtl" : "ltr"}
    >
      {isOpen && (
        <div
          className="floating-whatsapp-panel"
          role="dialog"
          aria-label={t.panelTitle}
        >
          <div className="floating-whatsapp-panel-header">
            <div className="floating-whatsapp-panel-heading">
              <span className="floating-whatsapp-panel-icon">
                <FaWhatsapp aria-hidden="true" />
              </span>

              <div>
                <strong>{t.panelTitle}</strong>
                <p>{t.panelText}</p>
              </div>
            </div>

            <button
              type="button"
              className="floating-whatsapp-close"
              onClick={() => setIsOpen(false)}
              aria-label={isArabic ? "إغلاق" : "Close"}
            >
              <X aria-hidden="true" />
            </button>
          </div>

          <div className="floating-whatsapp-options">
            {t.messages.map((item) => (
              <button
                key={item.label}
                type="button"
                className="floating-whatsapp-option"
                onClick={() => openWhatsApp(item.message)}
              >
                <span className="floating-whatsapp-option-icon">
                  <MessageCircleMore aria-hidden="true" />
                </span>

                <span>{item.label}</span>
              </button>
            ))}

            <button
              type="button"
              className="floating-whatsapp-option floating-whatsapp-option-other"
              onClick={() => openWhatsApp()}
            >
              <span className="floating-whatsapp-option-icon">
                <FaWhatsapp aria-hidden="true" />
              </span>

              <span>{t.other}</span>
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`floating-whatsapp ${
          isOpen ? "is-open" : ""
        }`}
        onClick={() => setIsOpen((current) => !current)}
        aria-label={t.ariaLabel}
        aria-expanded={isOpen}
        title={t.ariaLabel}
      >
        <span className="floating-whatsapp-icon">
          <FaWhatsapp aria-hidden="true" />
        </span>

        <span className="floating-whatsapp-label">
          {t.label}
        </span>
      </button>
    </div>
  );
}

export default FloatingWhatsApp;