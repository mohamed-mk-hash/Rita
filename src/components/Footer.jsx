import { Link } from "react-router";
import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
} from "react-icons/fa6";

const socialLinks = {
  whatsapp: "https://wa.me/213XXXXXXXXX",
  instagram: "https://www.instagram.com/your_username",
  facebook: "https://www.facebook.com/your_page",
};

function Footer({ t }) {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <img
            src="/assets/rita-logo.png"
            alt="Rita Digital Services"
            className="footer-logo"
          />

          <p>{t.text}</p>

          <div
            className="footer-socials"
            aria-label="Rita Digital Services social media"
          >
            <a
              href={socialLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              title="WhatsApp"
              className="footer-social-icon whatsapp"
            >
              <FaWhatsapp aria-hidden="true" />
            </a>

            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Instagram"
              className="footer-social-icon instagram"
            >
              <FaInstagram aria-hidden="true" />
            </a>

            <a
              href={socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Facebook"
              className="footer-social-icon facebook"
            >
              <FaFacebookF aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="footer-column">
          <h4>{t.company}</h4>

          <Link to="/services">{t.services}</Link>
          <Link to="/pricing">{t.pricing}</Link>
          <Link to="/how-it-works">{t.howItWorks}</Link>
        </div>

        <div className="footer-column">
          <h4>{t.support}</h4>

          <Link to="/faq">{t.faq}</Link>
          <Link to="/contact">{t.contact}</Link>

          <a
            href={socialLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.whatsapp}
          </a>
        </div>

        <div className="footer-column">
          <h4>{t.start}</h4>

          <a href="#start">{t.startLLC}</a>
          <a href="#services">{t.banking}</a>
          <a href="#start">{t.compliance}</a>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>{t.rights}</span>
        <span>{t.legal}</span>
      </div>
    </footer>
  );
}

export default Footer;