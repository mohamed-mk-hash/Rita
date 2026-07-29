import { FaWhatsapp } from "react-icons/fa6";
import { useLanguage } from "../context/LanguageContext.jsx";
import "./FloatingWhatsApp.css";

const whatsappNumber = "13124599528";

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

  const label = isArabic ? "تواصل معنا" : "Contact us";

  const message = isArabic
    ? "مرحباً، أريد الاستفسار عن خدمات Rita Digital Services."
    : "Hello, I would like to ask about Rita Digital Services.";

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <a
      className="floating-whatsapp"
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={
        isArabic
          ? "تواصل معنا عبر واتساب"
          : "Contact us on WhatsApp"
      }
      title={
        isArabic
          ? "تواصل معنا عبر واتساب"
          : "Contact us on WhatsApp"
      }
      dir={isArabic ? "rtl" : "ltr"}
    >
      <span className="floating-whatsapp-icon">
        <FaWhatsapp aria-hidden="true" />
      </span>

      <span className="floating-whatsapp-label">
        {label}
      </span>
    </a>
  );
}

export default FloatingWhatsApp;