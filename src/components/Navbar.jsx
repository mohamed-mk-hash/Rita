import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Link, NavLink } from "react-router";
import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
} from "react-icons/fa6";

import saudiFlag from "../assets/saudi.png";
import unitedStatesFlag from "../assets/united-states.png";

const languages = [
  {
    code: "en",
    label: "English",
    flag: unitedStatesFlag,
  },
  {
    code: "ar",
    label: "العربية",
    flag: saudiFlag,
  },
];

const socialLinks = {
  whatsapp: "https://wa.me/13124599528",
  facebook:
    "https://www.facebook.com/people/Rita-Digital-Services/61590008895440/",
};

function Navbar({ t = {}, lang = "en", onChangeLang }) {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const desktopLangRef = useRef(null);
  const mobileLangRef = useRef(null);

  const isArabic = lang === "ar";

  const currentLanguage =
    languages.find((language) => language.code === lang) || languages[0];

  const links = isArabic
    ? [
        { to: "/", label: "الرئيسية" },
        { to: "/how-it-works", label: t.howItWorks || "من نحن" },
        { to: "/services", label: t.services || "الخدمات" },
        { to: "/pricing", label: t.pricing || "الأسعار" },
        { to: "/contact", label: t.contact || "تواصل" },
      ]
    : [
        { to: "/", label: "Home" },
        { to: "/how-it-works", label: t.howItWorks || "About" },
        { to: "/services", label: t.services || "Services" },
        { to: "/pricing", label: t.pricing || "Pricing" },
        { to: "/contact", label: t.contact || "Contact" },
      ];

  useEffect(() => {
    function handleClickOutside(event) {
      const clickedDesktop =
        desktopLangRef.current &&
        desktopLangRef.current.contains(event.target);

      const clickedMobile =
        mobileLangRef.current &&
        mobileLangRef.current.contains(event.target);

      if (!clickedDesktop && !clickedMobile) {
        setLangOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleClickOutside);

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  function chooseLanguage(nextLang) {
    if (nextLang !== lang && onChangeLang) {
      onChangeLang(nextLang);
    }

    setLangOpen(false);
    setOpen(false);
  }

  function LanguageMenu({ mobile = false }) {
    return (
      <div className={`language-menu ${mobile ? "mobile-language-menu" : ""}`}>
        {languages.map((language) => (
          <button
            key={language.code}
            className={`language-option ${
              lang === language.code ? "active" : ""
            }`}
            type="button"
            onClick={() => chooseLanguage(language.code)}
          >
            <img className="language-flag" src={language.flag} alt="" />
            <span>{language.label}</span>
          </button>
        ))}
      </div>
    );
  }

  function SocialIcons({ mobile = false }) {
    return (
      <div
        className={`nav-socials ${mobile ? "mobile-nav-socials" : ""}`}
        aria-label="Rita Digital Services social media"
      >
        <a
          href={socialLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact Rita Digital Services on WhatsApp"
          title="WhatsApp"
          className="nav-social-icon whatsapp"
          onClick={() => setOpen(false)}
        >
          <FaWhatsapp aria-hidden="true" />
        </a>

        <span
          aria-label="Instagram — coming soon"
          aria-disabled="true"
          title="Instagram — coming soon"
          className="nav-social-icon instagram social-icon-disabled"
        >
          <FaInstagram aria-hidden="true" />
        </span>

        <a
          href={socialLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Rita Digital Services on Facebook"
          title="Facebook"
          className="nav-social-icon facebook"
          onClick={() => setOpen(false)}
        >
          <FaFacebookF aria-hidden="true" />
        </a>
      </div>
    );
  }

  return (
    <header className="site-header">
      <nav className="navbar container">
        <Link className="brand" to="/" onClick={() => setOpen(false)}>
          <img src="/rita-logo.png" alt="Rita Digital Services" />
          <span>Rita Digital Services</span>
        </Link>

        <div className={`nav-links ${open ? "open" : ""}`}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="nav-actions">
          <SocialIcons />

          <Link className="signin-link" to="/login">
            {t.signIn || (isArabic ? "تسجيل الدخول" : "Sign in")}
          </Link>

          <Link className="btn btn-white nav-signup-btn" to="/sign-up">
            {t.signUp || (isArabic ? "إنشاء حساب" : "Sign up")}
          </Link>

          <div className="language-dropdown" ref={desktopLangRef}>
            <button
              className="language-current"
              type="button"
              aria-label={
                t.toggleLang ||
                (isArabic ? "تغيير اللغة" : "Change language")
              }
              aria-expanded={langOpen}
              onClick={() => setLangOpen((current) => !current)}
            >
              <img
                className="language-flag"
                src={currentLanguage.flag}
                alt=""
              />

              <span>{currentLanguage.label}</span>
              <ChevronDown size={15} />
            </button>

            {langOpen && <LanguageMenu />}
          </div>
        </div>

        <div className="mobile-actions">
          <div
            className="language-dropdown mobile-language-dropdown"
            ref={mobileLangRef}
          >
            <button
              className="language-current mobile-language-current"
              type="button"
              aria-label={
                t.toggleLang ||
                (isArabic ? "تغيير اللغة" : "Change language")
              }
              aria-expanded={langOpen}
              onClick={() => setLangOpen((current) => !current)}
            >
              <img
                className="language-flag"
                src={currentLanguage.flag}
                alt=""
              />

              <ChevronDown size={15} />
            </button>

            {langOpen && <LanguageMenu mobile />}
          </div>

          <button
            className="mobile-menu"
            type="button"
            aria-label={
              open
                ? isArabic
                  ? "إغلاق القائمة"
                  : "Close menu"
                : isArabic
                  ? "فتح القائمة"
                  : "Open menu"
            }
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="mobile-nav-panel">
          <div className="container">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) => (isActive ? "active" : "")}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}

            <Link to="/login" onClick={() => setOpen(false)}>
              {t.signIn || (isArabic ? "تسجيل الدخول" : "Sign in")}
            </Link>

            <Link to="/sign-up" onClick={() => setOpen(false)}>
              {t.signUp || (isArabic ? "إنشاء حساب" : "Sign up")}
            </Link>

            <SocialIcons mobile />
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;