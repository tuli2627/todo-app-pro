import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="hs-footer">
      <svg className="hs-footer__skyline" viewBox="0 0 1280 56" preserveAspectRatio="none">
        <path d="M0 56 L0 34 L60 10 L110 34 L170 6 L230 34 L300 16 L360 34 L430 4 L500 34 L570 18 L640 34 L710 8 L780 34 L850 14 L920 34 L990 6 L1060 34 L1130 16 L1200 34 L1280 12 L1280 56 Z" fill="#0E4736" />
        <path d="M0 56 L0 44 L80 26 L150 44 L220 22 L290 44 L370 30 L440 44 L520 20 L590 44 L660 28 L730 44 L810 24 L880 44 L950 30 L1020 44 L1100 22 L1170 44 L1280 30 L1280 56 Z" fill="#123F2E" />
      </svg>

      <div className="hs-footer__particles" aria-hidden="true">
        <span className="hs-footer__leaf" style={{ left: "8%", animationDelay: "0s" }}>🌿</span>
        <span className="hs-footer__leaf" style={{ left: "28%", animationDelay: "4s" }}>🌿</span>
        <span className="hs-footer__leaf" style={{ left: "52%", animationDelay: "8s" }}>🌿</span>
        <span className="hs-footer__leaf" style={{ left: "74%", animationDelay: "2s" }}>🌿</span>
        <span className="hs-footer__leaf" style={{ left: "91%", animationDelay: "6s" }}>🌿</span>
      </div>

      <div className="hs-footer__body">
        <div>
          <div className="hs-footer__brand-mark">
            <svg width="30" height="30" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="21" cy="21" r="21" fill="#123F2E" />
              <path
                d="M21 32C21 32 12 27.5 12 18.5C12 13.8056 15.8056 10 20.5 10C20.5 10 21 10 21 10C21 10 21.5 10 21.5 10C26.1944 10 30 13.8056 30 18.5C30 27.5 21 32 21 32Z"
                fill="#6FA83E"
              />
            </svg>
            <span>Harit-<em>SANKALP</em></span>
          </div>
          <p className="hs-footer__about">{t('footer.about')}</p>
          <div className="hs-footer__connect-row">
            <a href="https://x.com" aria-label={t('footer.twitter')}>𝕏</a>
            <a href="https://youtube.com" aria-label={t('footer.youtube')}>▶</a>
            <a href="mailto:info@nationalcampa.nic.in" aria-label={t('footer.email')}>✉</a>
          </div>
        </div>

        <div className="hs-footer__col">
          <h4>{t('footer.quickLinks')}</h4>
          <ul>
            <li><Link to="/">{t('navigation.home')}</Link></li>
            <li><Link to="/dashboard">{t('navigation.dashboard')}</Link></li>
            <li><Link to="/our-nurseries">{t('header.ourNurseries')}</Link></li>
            <li><Link to="/about-us">{t('header.aboutUs')}</Link></li>
            <li><Link to="/advance-booking">{t('header.advanceBooking')}</Link></li>
          </ul>
        </div>

        <div className="hs-footer__col">
          <h4>{t('footer.resources')}</h4>
          <ul>
            <li><Link to="/faqs">{t('header.faqs')}</Link></li>
            <li><Link to="/documentation">{t('footer.userGuides')}</Link></li>
            <li><Link to="/about-us">{t('header.aboutUs')}</Link></li>
            <li><Link to="/our-nurseries">{t('footer.gallery')}</Link></li>
            <li><a href="mailto:info@nationalcampa.nic.in">{t('footer.contactUs')}</a></li>
          </ul>
        </div>

        <div className="hs-footer__col">
          <h4>{t('footer.ministry')}</h4>
          <ul>
            <li><span>{t('footer.nationalAuthority')}</span></li>
            <li><span>{t('footer.ministryName')}</span></li>
            <li><span>{t('footer.governmentOfIndia')}</span></li>
          </ul>
        </div>
      </div>

      <div className="hs-footer__bottom">
        <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
        <span>{t('footer.technicalSupport')} <a href="https://nationalcampa.nic.in">NATIONAL CAMPA</a></span>
      </div>
    </footer>
  );
}

export default Footer;
