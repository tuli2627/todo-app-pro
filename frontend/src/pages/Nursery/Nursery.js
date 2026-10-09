import React from "react";
import { useTranslation } from "react-i18next";
import "./Nursery.css";

// =========================================
// IMPORT NURSERY IMAGES
// =========================================

import Banner1 from "./Banner_1.jpg";
import Banner2 from "./Banner_2.jpg";
import Banner3 from "./Banner_3.jpg";
import Banner4 from "./Banner_4.jpeg";
import Banner5 from "./Banner_5.jpg";
import Banner6 from "./Banner_6.jpeg";
import Banner7 from "./Banner_7.jpeg";
import Banner8 from "./Banner_8.jpg";
import Banner9 from "./Banner_9.jpg";
import Banner10 from "./Banner_10.jpg";
import Banner11 from "./Banner_11.jpeg";
import Banner12 from "./Banner_12.JPG";
import Banner14 from "./Banner_14.jpg";
import Banner15 from "./Banner_15.jpg";
import Banner16 from "./Banner_16.jpg";
import Banner17 from "./Banner_17.jpeg";
import Banner18 from "./Banner_18.jpg";
import Banner19 from "./Banner_19.jpg";
import Banner20 from "./Banner_20.jpg";
import Banner21 from "./Banner_21.jpg";
import Banner22 from "./Banner_22.jpg";
import Banner24 from "./Banner_24.jpg";
import Banner25 from "./Banner_25.jpeg";
import Banner26 from "./Banner_26.jpg";


// =========================================
// OUR NURSERIES COMPONENT
// =========================================

const Nursery = () => {
  const { t } = useTranslation();

  // =========================================
  // NURSERY IMAGE LIST
  // =========================================

  const nurseryImages = [
    {
      image: Banner1,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner2,
      titleKey: "nursery.forestNursery",
    },
    {
      image: Banner3,
      titleKey: "nursery.plantNursery",
    },
    {
      image: Banner4,
      titleKey: "nursery.seedlingNursery",
    },
    {
      image: Banner5,
      titleKey: "nursery.forestDepartmentNursery",
    },
    {
      image: Banner6,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner7,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner8,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner9,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner10,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner11,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner12,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner14,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner15,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner16,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner17,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner18,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner19,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner20,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner21,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner22,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner24,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner25,
      titleKey: "nursery.nursery",
    },
    {
      image: Banner26,
      titleKey: "nursery.nursery",
    },
  ];


  // =========================================
  // PAGE
  // =========================================

  return (
    <div className="nursery-page">

      {/* =========================================
          HERO / BANNER SECTION
      ========================================= */}

      <section className="nursery-hero">

        {/* Dark overlay */}
        <div className="nursery-hero-overlay"></div>

        {/* Hero content */}
        <div className="nursery-hero-content">

          <h1>{t('nursery.title')}</h1>

        </div>

      </section>


      {/* =========================================
          NURSERY GALLERY
      ========================================= */}

      <section className="nursery-gallery-section">

        <div className="nursery-gallery-container">

          <div className="nursery-gallery-grid">

            {nurseryImages.map((nursery, index) => (

              <div
                className="nursery-card"
                key={index}
              >

                {/* Nursery image */}

                <img
                  src={nursery.image}
                  alt={t(nursery.titleKey)}
                  className="nursery-image"
                />

                {/* Image hover title */}

                <div className="nursery-card-overlay">

                  <h3>
                    {t(nursery.titleKey)}
                  </h3>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

    </div>
  );
};


// =========================================
// EXPORT
// =========================================

export default Nursery;