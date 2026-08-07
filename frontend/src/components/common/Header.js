import { Link } from "react-router-dom";
import React, { useState } from "react";
import "./Header.css";
import faoLogo from "../../assets/images/fao_logo.png";
import moefccLogo from "../../assets/images/moefcc.png";
import campaLogo from "../../assets/images/campa.png";
import emblemLogo from "../../assets/images/emblem.png";
import sankalpLogo from "../../assets/images/sankalp.png";
import GoogleTranslate from './GoogleTranslate';

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

function Header() {
  const [showTranslator, setShowTranslator] = useState(false);

  const handleTranslatorToggle = () => {
    setShowTranslator(!showTranslator);
  };

const handleLanguageChange = (langCode) => {

  localStorage.setItem("selectedLanguage", langCode);

  document.cookie = `googtrans=/en/${langCode};path=/`;
  document.cookie = `googtrans=/en/${langCode};domain=${window.location.hostname};path=/`;

  const interval = setInterval(() => {

    const select = document.querySelector(".goog-te-combo");

    if (select) {

      select.value = langCode;

      select.dispatchEvent(new Event("change"));

      clearInterval(interval);

    }

  }, 500);

  setShowTranslator(false);

};
  return (
    <header className="hs-header">
      <div className="hs-header__main">
        <div className="hs-header__logos">
          {/* <div className="hs-header__logo">
            <img src={faoLogo} alt="FAO" className="hs-header__logo-img" />
          </div> */}
          <div className="hs-header__logo">
            <img src={emblemLogo} alt="राज्य चिन्ह" className="hs-header__logo-img" />
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
            <span className="hs-header__logo-text">Harit-SANKALP</span>
          </div>
        </div>

        <nav className="hs-header__nav">
         <Link to="/" className="hs-header__link">
          
    
          
            घर
            <svg viewBox="0 0 100 6"><path d="M2 3 Q 20 -2, 50 3 T 98 3" /></svg>
          </Link>
           <Link to="/dashboard" className="hs-header__link">
            डैशबोर्ड
            <svg viewBox="0 0 100 6"><path d="M2 3 Q 20 -2, 50 3 T 98 3" /></svg>
          </Link>
          <div className="hs-header__dropdown">
  <div className="hs-header__link">
    पृष्ठों <span className="hs-header__link-caret">▾</span>
    <svg viewBox="0 0 100 6">
      <path d="M2 3 Q 20 -2, 50 3 T 98 3" />
    </svg>
  </div>

  <div className="hs-dropdown-menu">
    <Link to="/advance-booking">Advance Booking</Link>
    <Link to="/our-nurseries">Our Nurseries</Link>
    <Link to="/faqs">FAQs</Link>
    <Link to="/documentation">User Guides & Documentation</Link>
  </div>
</div>

          <div className="hs-header__actions">
           <div className="hs-header__dropdown">
  <div className="hs-header__btn hs-header__btn--login">
    लॉग इन करें <span className="hs-header__btn-icon">→ ▾</span>
  </div>

  <div className="hs-dropdown-menu">
    <Link to="/login/national">National</Link>
    <Link to="/login/state">State</Link>
    <Link to="/login/circle">Circle</Link>
    <Link to="/login/dfo">DFO</Link>
    <Link to="/login/ro">RO</Link>
    <Link to="/login/silviculturist">Silviculturist</Link>
  </div>
</div>
            <div className="translator-wrapper">
              <button 
                className="btn-blue" 
                onClick={handleTranslatorToggle}
                aria-haspopup="true"
                aria-expanded={showTranslator}
                aria-label="Open language translator"
              >
                Translate
              </button>
              
              {/* Hamara Custom Dropdown UI */}
              {showTranslator && (
                <div className="custom-lang-dropdown">
                  <ul className="lang-list">
                    {languages.map((lang) => (
                      <li 
                        key={lang.code} 
                        onClick={() => handleLanguageChange(lang.code)}
                      >
                        {lang.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Asli Google Translate ko hide kar diya hai */}
              <div style={{ display: 'none' }}>
                <GoogleTranslate />
              </div>
            </div>
          </div>
        </nav>
      </div>

      <svg className="hs-header__growthline" viewBox="0 0 1400 3" preserveAspectRatio="none">
        <path d="M0 1.5 L1400 1.5" />
      </svg>
    </header>
  );
}

export default Header;