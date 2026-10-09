import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiChevronDown, FiHelpCircle } from 'react-icons/fi';
import './Faqs.css';

const faqKeys = Array.from({ length: 10 }, (_, index) => index + 1);

function Faqs() {
  const [openIndex, setOpenIndex] = useState(null);
  const { t } = useTranslation();

  const toggleFaq = (index) => {
    setOpenIndex((currentIndex) => currentIndex === index ? null : index);
  };

  return (
    <div className="faqs-container">
      
      <div className="faqs-content">
        <div className="faqs-heading">
          <span className="faqs-heading__icon"><FiHelpCircle aria-hidden="true" /></span>
          <div>
            <span className="faqs-eyebrow">{t('header.faqs')}</span>
            <h1 className="faqs-title">{t('faq.title')}</h1>
            <p className="faqs-subtitle">{t('home.portalName')} · {t('home.portalExpansion')}</p>
          </div>
        </div>

        <div className="faqs-accordion">
          {faqKeys.map((faqNumber, index) => (
            <section key={faqNumber} className={`faq-item${openIndex === index ? ' is-open' : ''}`}>
              <h2 className="faq-question-heading">
                <button
                  type="button"
                  className="faq-question"
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-answer-${faqNumber}`}
                  id={`faq-question-${faqNumber}`}
                  onClick={() => toggleFaq(index)}
                >
                  <span className="faq-number">{String(faqNumber).padStart(2, '0')}</span>
                  <span className="faq-question__text">{t(`faq.items.${faqNumber}.question`)}</span>
                  <FiChevronDown className={`faq-icon${openIndex === index ? ' open' : ''}`} aria-hidden="true" />
                </button>
              </h2>
              <div
                className="faq-answer"
                id={`faq-answer-${faqNumber}`}
                role="region"
                aria-labelledby={`faq-question-${faqNumber}`}
                hidden={openIndex !== index}
              >
                {t(`faq.items.${faqNumber}.answer`)}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Faqs;