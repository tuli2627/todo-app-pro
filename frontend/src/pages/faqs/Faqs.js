import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Faqs.css';

const faqData = [
  { question: "1. What is the purpose of this portal?", answer: "This portal is a centralized digital platform for planning, traceability, and monitoring of forest nurseries and planting material." },
  { question: "2. What are the services provided by this platform?", answer: "Services include mapping of existing nurseries, end-to-end traceability of planting material, and unique QR code generation." },
  { question: "3. What are the unique features of this platform?", answer: "Unique code generation for every entity and role-based workflows for different authorities." },
  { question: "4. Who can use this platform?", answer: "Forest departments, nursery managers, and authorized government officials." },
  { question: "5. Is user registration mandatory?", answer: "Yes, authorized personnel must register to access the role-based dashboard." },
  { question: "6. What is a Seed Production Area (SPA)?", answer: "A designated area managed specifically to produce high-quality seeds for forestry." },
  { question: "7. What is a Candidate Plus Tree (CPT)?", answer: "An outstanding tree selected based on its physical characteristics for potential use in breeding programs." },
  { question: "8. What details are required for Nursery, SPA/CPT and Seed Orchard registration?", answer: "Location details, species available, capacity, and jurisdictional forest division." },
  { question: "9. What is a Seed Orchard?", answer: "A plantation of genetically superior trees isolated to reduce pollination from genetically inferior outside sources." },
  { question: "10. What is a Seed Processing cum Treatment Unit?", answer: "A facility where collected seeds are cleaned, treated, and prepared for storage or sowing." }
];

function Faqs() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faqs-container">
      
      {/* Background Theme Elements */}
      <div className="floating-leaves">
        <span className="leaf">🍃</span>
        <span className="leaf">🌿</span>
        <span className="leaf">🍀</span>
        <span className="leaf">🍃</span>
      </div>

      <div className="faqs-content">
        
        {/* Teal Home Button */}
        <Link to="/" className="faqs-home-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Home
        </Link>

        {/* Titles */}
        <h1 className="faqs-title">Frequently Asked Questions (FAQs)</h1>
        <h2 className="faqs-subtitle">Harit-SANKALP (System for Afforestation, Nursery Knowledge & Linkage Platform)</h2>

        {/* Accordion List */}
        <div className="faqs-accordion">
          {faqData.map((faq, index) => (
            <div key={index} className="faq-item">
              <div className="faq-question" onClick={() => toggleFaq(index)}>
                <span>{faq.question}</span>
                <span className={`faq-icon ${openIndex === index ? 'open' : ''}`}>
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                </span>
              </div>
              {openIndex === index && (
                <div className="faq-answer">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}

export default Faqs;