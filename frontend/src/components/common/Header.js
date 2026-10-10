import { Link, NavLink } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiChevronDown, FiGlobe, FiGrid, FiHome, FiLayers, FiLogIn, FiLogOut, FiMoon, FiSun, FiVolume2 } from "react-icons/fi";
import "./Header.css";
import moefccLogo from "../../assets/images/moefcc.png";
import campaLogo from "../../assets/images/campa.png";
import emblemLogo from "../../assets/images/emblem.png";
import sankalpLogo from "../../assets/images/sankalp.png";
import { AUTH_SESSION_CHANGED, clearAuthSession } from "../../services/authSession";

const languages = [
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'en', name: 'English' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'mr', name: 'Marathi (मराठी)' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', name: 'Malayalam (മലയാളം)' }
];

const speechLanguages = {
  bn: "bn-IN",
  en: "en-IN",
  gu: "gu-IN",
  hi: "hi-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  mr: "mr-IN",
  ta: "ta-IN",
  te: "te-IN"
};

function Header() {
  const [openMenu, setOpenMenu] = useState(null);
  const { t, i18n } = useTranslation();
  const [authenticated, setAuthenticated] = useState(() => Boolean(localStorage.getItem("accessToken")));
  const [readAloud, setReadAloud] = useState(() => localStorage.getItem("siteReadAloud") === "true");
  const [speechStatus, setSpeechStatus] = useState("");
  const speechTimer = useRef(null);
  const [textZoom, setTextZoom] = useState(() => {
    const savedZoom = Number(localStorage.getItem("siteTextZoom"));
    return [90, 100, 110, 120].includes(savedZoom) ? savedZoom : 100;
  });
  const [theme, setTheme] = useState(() => (
    localStorage.getItem("siteTheme") === "dark" ? "dark" : "light"
  ));

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!event.target.closest(".hs-header__dropdown, .translator-wrapper")) {
        setOpenMenu(null);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpenMenu(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const updateAuthentication = () => setAuthenticated(Boolean(localStorage.getItem("accessToken")));
    window.addEventListener(AUTH_SESSION_CHANGED, updateAuthentication);
    window.addEventListener("storage", updateAuthentication);
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED, updateAuthentication);
      window.removeEventListener("storage", updateAuthentication);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = `${textZoom}%`;
    localStorage.setItem("siteTextZoom", String(textZoom));
  }, [textZoom]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("siteTheme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("siteReadAloud", String(readAloud));
  }, [readAloud]);

  useEffect(() => {
    const speechSupported = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    if (!readAloud || !speechSupported) {
      window.speechSynthesis?.cancel();
      return undefined;
    }

    const speakTarget = (target, relatedTarget) => {
      if (!(target instanceof Element)) return;

      let textElement = target.closest("p, h1, h2, h3, h4, h5, h6, li, a, button, label, td, th, blockquote, summary");
      if (!textElement) {
        let candidate = target;
        while (candidate && candidate !== document.body) {
          const hasDirectText = [...candidate.childNodes].some(
            (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()
          );
          if (hasDirectText) {
            textElement = candidate;
            break;
          }
          candidate = candidate.parentElement;
        }
      }
      if (!textElement || textElement.closest(".hs-accessibility-tools, .hs-skip-link")) return;
      if (relatedTarget instanceof Node && textElement.contains(relatedTarget)) return;

      const text = textElement.innerText?.trim();
      if (!text) return;

      window.clearTimeout(speechTimer.current);
      speechTimer.current = window.setTimeout(() => {
        const language = i18n.resolvedLanguage?.split("-")[0] || "en";
        const speechLanguage = speechLanguages[language];
        const voices = window.speechSynthesis.getVoices();
        const matchingVoices = voices.filter(
          (voice) => voice.lang.toLowerCase().split("-")[0] === speechLanguage.split("-")[0]
        );

        if (!matchingVoices.length) {
          window.speechSynthesis.cancel();
          setSpeechStatus(t("accessibility.voiceUnavailable", { language: languages.find((item) => item.code === language)?.name || language }));
          return;
        }

        const exactLanguageVoices = matchingVoices.filter(
          (voice) => voice.lang.toLowerCase() === speechLanguage.toLowerCase()
        );
        const preferredVoices = exactLanguageVoices.length
          ? [...exactLanguageVoices, ...matchingVoices.filter((voice) => !exactLanguageVoices.includes(voice))]
          : matchingVoices;
        const femaleVoicePattern = /female|woman|heera|zira|kalpana|priya|swara|aditi|lekha|neerja|samantha|veena|kavya|pallavi|susan|aria|jenny|sara|eva|linda/i;
        const voice = preferredVoices.find((item) => femaleVoicePattern.test(item.name)) || preferredVoices[0];
        const hasFemaleVoice = femaleVoicePattern.test(voice.name);

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = voice.lang || speechLanguage;
        utterance.voice = voice;
        utterance.onerror = (event) => {
          if (!["interrupted", "canceled"].includes(event.error)) {
            setSpeechStatus(t("accessibility.speechPlaybackError"));
          }
        };
        setSpeechStatus(hasFemaleVoice ? "" : t("accessibility.femaleVoiceUnavailable"));
        window.speechSynthesis.speak(utterance);
      }, 250);
    };

    const handlePointerOver = (event) => speakTarget(event.target, event.relatedTarget);
    const handleFocusIn = (event) => speakTarget(event.target, null);
    document.addEventListener("pointerover", handlePointerOver);
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("focusin", handleFocusIn);
      window.clearTimeout(speechTimer.current);
      window.speechSynthesis.cancel();
    };
  }, [i18n.resolvedLanguage, readAloud, t]);

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setOpenMenu(null);
  };

  return (
    <>
    <a className="hs-skip-link" href="#main-content">{t('accessibility.skipToContent')}</a>
    <header className="hs-header">
      <div className="hs-header__utility">
        <div className="hs-accessibility-tools" role="toolbar" aria-label={t('accessibility.tools')}>
          <button
            type="button"
            className="hs-accessibility-tools__button"
            onClick={() => setTextZoom((zoom) => Math.max(90, zoom - 10))}
            disabled={textZoom === 90}
            aria-label={t('accessibility.decreaseText')}
            title={t('accessibility.decreaseText')}
          >
            A−
          </button>
          <button
            type="button"
            className="hs-accessibility-tools__button"
            onClick={() => setTextZoom(100)}
            disabled={textZoom === 100}
            aria-label={t('accessibility.resetText')}
            title={t('accessibility.resetText')}
          >
            A
          </button>
          <button
            type="button"
            className="hs-accessibility-tools__button"
            onClick={() => setTextZoom((zoom) => Math.min(120, zoom + 10))}
            disabled={textZoom === 120}
            aria-label={t('accessibility.increaseText')}
            title={t('accessibility.increaseText')}
          >
            A+
          </button>
          <span className="hs-visually-hidden" role="status" aria-live="polite">
            {t('accessibility.zoomLevel', { percent: textZoom })}
          </span>
          <span className="hs-visually-hidden" role="status" aria-live="polite">
            {speechStatus}
          </span>
          <button
            type="button"
            className="hs-accessibility-tools__button hs-accessibility-tools__theme"
            onClick={() => setTheme((current) => current === "light" ? "dark" : "light")}
            aria-label={theme === "light" ? t('accessibility.enableDark') : t('accessibility.enableLight')}
            title={theme === "light" ? t('accessibility.enableDark') : t('accessibility.enableLight')}
          >
            {theme === "light"
              ? <FiMoon aria-hidden="true" />
              : <FiSun aria-hidden="true" />}
          </button>
          <button
            type="button"
            className={`hs-accessibility-tools__button hs-accessibility-tools__speech${readAloud ? " is-active" : ""}`}
            onClick={() => setReadAloud((enabled) => !enabled)}
            disabled={!("speechSynthesis" in window && "SpeechSynthesisUtterance" in window)}
            aria-pressed={readAloud}
            aria-label={readAloud ? t('accessibility.disableReadAloud') : t('accessibility.enableReadAloud')}
            title={readAloud ? t('accessibility.disableReadAloud') : t('accessibility.enableReadAloud')}
          >
            <FiVolume2 aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="hs-header__main">
        <div className="hs-header__logos">
          <div className="hs-header__logo">
            <img src={emblemLogo} alt={t('header.emblemAlt')} className="hs-header__logo-img" />
          </div>
          <div className="hs-header__logo">
            <img src={moefccLogo} alt="MoEFCC" className="hs-header__logo-img" />
          </div>
          <div className="hs-header__logo">
            <img src={campaLogo} alt="CAMPA" className="hs-header__logo-img" />
          </div>
          <div className="hs-header__logo-divider" />
          <div className="hs-header__logo">
            <img src={sankalpLogo} alt="Sankalp" className="hs-header__logo-img" />
            <span className="hs-header__logo-text">हरित-SANKALP</span>
          </div>
        </div>

        <nav className="hs-header__nav" aria-label={t('accessibility.mainNavigation')}>
         <NavLink to="/" end className={({ isActive }) => `hs-header__link${isActive ? " is-active" : ""}`}>
            <FiHome className="hs-header__icon hs-header__nav-icon" aria-hidden="true" />
            {t('navigation.home')}
          </NavLink>
           <NavLink to="/dashboard" end className={({ isActive }) => `hs-header__link${isActive ? " is-active" : ""}`}>
            <FiGrid className="hs-header__icon hs-header__nav-icon" aria-hidden="true" />
            {t('navigation.dashboard')}
          </NavLink>
          <div className={`hs-header__dropdown${openMenu === "pages" ? " is-open" : ""}`}>
  <button
    type="button"
    className="hs-header__link hs-header__pages-trigger"
    aria-haspopup="true"
    aria-expanded={openMenu === "pages"}
    onClick={() => setOpenMenu((current) => current === "pages" ? null : "pages")}
  >
    <FiLayers className="hs-header__icon hs-header__nav-icon" aria-hidden="true" />
    {t('navigation.pages')}
    <FiChevronDown className="hs-header__icon hs-header__link-caret" aria-hidden="true" />
  </button>

  <div className="hs-dropdown-menu" aria-hidden={openMenu !== "pages"}>
    <Link to="/advance-booking" onClick={() => setOpenMenu(null)}>{t('header.advanceBooking')}</Link>
    <Link to="/our-nurseries" onClick={() => setOpenMenu(null)}>{t('header.ourNurseries')}</Link>
    <Link to="/faqs" onClick={() => setOpenMenu(null)}>{t('header.faqs')}</Link>
    <Link to="/documentation" onClick={() => setOpenMenu(null)}>{t('header.userGuides')}</Link>
    <Link to="/about-us" onClick={() => setOpenMenu(null)}>{t('header.aboutUs')}</Link>
  </div>
</div>

          <div className="hs-header__actions">
           {authenticated && (
             <button
               type="button"
               className="hs-header__btn hs-header__btn--logout"
               onClick={() => {
                 clearAuthSession();
                 window.location.replace("/");
               }}
             >
               <FiLogOut className="hs-header__icon hs-header__action-icon" aria-hidden="true" />
               <span>{t("workflow.logout")}</span>
             </button>
           )}
           <div className={`hs-header__dropdown${openMenu === "login" ? " is-open" : ""}`}>
  <button
    type="button"
    className="hs-header__btn hs-header__btn--login"
    aria-haspopup="true"
    aria-expanded={openMenu === "login"}
    aria-label={t('navigation.login')}
    onClick={() => setOpenMenu((current) => current === "login" ? null : "login")}
  >
    <FiLogIn className="hs-header__icon hs-header__action-icon" aria-hidden="true" />
    <span>{t('navigation.login')}</span>
    <FiChevronDown className="hs-header__icon hs-header__action-chevron" aria-hidden="true" />
  </button>

  <div className="hs-dropdown-menu" aria-hidden={openMenu !== "login"}>
    <Link to="/login/national" onClick={() => setOpenMenu(null)}>{t('header.national')}</Link>
    <Link to="/login/state" onClick={() => setOpenMenu(null)}>{t('header.state')}</Link>
    <Link to="/login/silviculturist" onClick={() => setOpenMenu(null)}>{t('header.silviculturist')}</Link>
    <Link to="/login/circle" onClick={() => setOpenMenu(null)}>{t('header.circle')}</Link>
    <Link to="/login/dfo" onClick={() => setOpenMenu(null)}>{t('header.dfo')}</Link>
    <Link to="/login/ro" onClick={() => setOpenMenu(null)}>{t('header.ro')}</Link>

  </div>
</div>
            <div
              className={`translator-wrapper${openMenu === "language" ? " is-open" : ""}`}
            >
              <button
                type="button"
                className="hs-header__btn hs-header__btn--language"
                aria-haspopup="true"
                aria-expanded={openMenu === "language"}
                aria-label={t('header.openLanguageSelector')}
                onClick={() => setOpenMenu((current) => current === "language" ? null : "language")}
              >
                <FiGlobe className="hs-header__icon hs-header__action-icon" aria-hidden="true" />
                <span>{t('header.translate')}</span>
                <FiChevronDown className="hs-header__icon hs-header__action-chevron" aria-hidden="true" />
              </button>
              
              {/* Hamara Custom Dropdown UI */}
              {openMenu === "language" && (
                <div className="custom-lang-dropdown">
                  <ul className="lang-list">
                    {languages.map((lang) => (
                      <li key={lang.code}>
                        <button
                          type="button"
                          className="lang-option"
                          aria-pressed={i18n.resolvedLanguage === lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                        >
                          {lang.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </div>
        </nav>
      </div>

      <svg className="hs-header__growthline" viewBox="0 0 1400 3" preserveAspectRatio="none">
        <path d="M0 1.5 L1400 1.5" />
      </svg>
    </header>
    </>
  );
}

export default Header;