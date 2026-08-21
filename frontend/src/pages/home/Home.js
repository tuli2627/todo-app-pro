
import React, { useEffect, useState } from "react";
import "./Home.css";

import hero1 from "../../assets/images/hero1.jpeg";
import hero2 from "../../assets/images/hero2.jpg";
import hero3 from "../../assets/images/hero3.jpeg";
import hero4 from "../../assets/images/hero4.jpg";
import hero5 from "../../assets/images/hero5.jpg";
import hero6 from "../../assets/images/hero6.jpg";
import why_1 from "../../assets/images/why_1.png";
import why_2 from "../../assets/images/why_2.png";
import why_3 from "../../assets/images/why_3.png";
import why_4 from "../../assets/images/why_4.png";
import why_5 from "../../assets/images/why_5.png";
import why_6 from "../../assets/images/why_6.png";
import why_7 from "../../assets/images/why_7.png";
import why_8 from "../../assets/images/why_8.png";
import why_9 from "../../assets/images/why_9.png";
import { TbBinaryTree2 } from "react-icons/tb";

import { TbMapSearch } from "react-icons/tb";

import { PiMapPinAreaDuotone } from "react-icons/pi";
import { TbHash } from "react-icons/tb";

const slides = [
  {
    image: hero1,
    title: "Modern Forest Nursery",
    desc: "Digitally managed nursery ecosystem."
  },
  {
    image: hero2,
    title: "Quality Plantation",
    desc: "Healthy planting material across India."
  },
  {
    image: hero3,
    title: "Afforestation Mission",
    desc: "Supporting sustainable green development."
  },
  {
    image: hero4,
    title: "Seed to Plantation",
    desc: "Complete nursery lifecycle monitoring."
  }
];

const nurseryImages = [
  hero1,
  hero2,
  hero3,
  hero4,
  hero5,
  hero6
];

const services = [
  {
    icon: why_1,
    text: "Seed Production Area (SPA)/ Candidate Plus Tree (CPT)"
  },
  {
    icon: why_2,
   
    text: "Seed Orchard (SO)"
  },
  {
    icon: why_3,
   
    text: "Nursery"
  },
  {
    icon: why_4,
    
    text: "Research Institute (RI)"
  },
  {
     icon: why_9,
   
    text: "Seed Processing cum Treatment Unit"
  },
  {
     icon: why_5,
    
    text: "Seed Collection"
  },
  {
     icon: why_6,
    
    text: "Processing Unit"
  },
  {
     icon: why_7,
   
    text: "Plant Produced and Disposal"
  },
  {
     icon: why_8,
  
    text: "Advance Booking"
  }
];

function Home() {

  const [current, setCurrent] = useState(0);

  useEffect(() => {

    const timer = setInterval(() => {

      setCurrent((prev) => (prev + 1) % slides.length);

    }, 5000);

    return () => clearInterval(timer);

  }, []);

  const nextSlide = () =>
    setCurrent((current + 1) % slides.length);

  const prevSlide = () =>
    setCurrent((current - 1 + slides.length) % slides.length);

  return (
    <>

      {/* ================= HERO ================= */}

      <section className="hero">

        <div className="floating-leaves">

          <span className="leaf">🍃</span>
          <span className="leaf">🌿</span>
          <span className="leaf">🍀</span>
          <span className="leaf">🍃</span>

        </div>

        {/* LEFT */}

        <div className="hero-left">

          <div className="glass-card">

            <span className="tag">
              🌿 Government of India Initiative
            </span>

            <h1>
              हरित -
              <span> SANKALP</span>
            </h1>

            <h2>
              (System for Afforestation,
              Nursery Knowledge &
              Linkage Platform)
            </h2>

            <p>
              A centralized digital platform for planning,
              monitoring and managing forest nurseries,
              plantation activities and planting material
              across India.
            </p>

            <div className="hero-buttons">

              <button className="btn-primary">
                Explore Nursery
              </button>

              <button className="btn-outline">
                Learn More
              </button>

            </div>

            <div className="stats">

              <div className="stat-card">
                <h3>12K+</h3>
                <span>Nurseries</span>
              </div>

              <div className="stat-card">
                <h3>3M+</h3>
                <span>Plants</span>
              </div>

              <div className="stat-card">
                <h3>28</h3>
                <span>States</span>
              </div>

            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="hero-right">

          <div className="carousel">

            <img
              src={slides[current].image}
              alt=""
              className="main-image"
            />

            <div className="overlay">

              <h3>{slides[current].title}</h3>

              <p>{slides[current].desc}</p>

            </div>

            <button
              className="arrow left"
              onClick={prevSlide}
            >
              ❮
            </button>

            <button
              className="arrow right"
              onClick={nextSlide}
            >
              ❯
            </button>

            <div className="dots">

              {slides.map((_, index) => (

                <span
                  key={index}
                  className={
                    current === index
                      ? "dot active"
                      : "dot"
                  }
                  onClick={() => setCurrent(index)}
                />

              ))}

            </div>

          </div>

        </div>

      </section>
            {/* ================= WHY HARIT ================= */}

      <section className="why-section">

        <div className="section-title">

          <span>WHY हरित-SANKALP</span>

          <h2>
            Building India's Green Future Through
            Smart Digital Forestry
          </h2>

          <p>
            In order to strengthen planning, transparency, and traceability in nursery management and supply of planting material under Forest Nurseries, the <strong> Harit-SANKALP (System for Afforestation, Nursery Knowledge & Linkage Platform) Portal</strong> has been developed as a centralized digital platform with FAO-India as the consultative partners. The portal interface reflects a comprehensive, role-based workflow covering advance planning, inventory management, traceability, and monitoring from seed source to dispatch.
          </p>

        </div>

        <div className="why-container">

          {/* LEFT */}

          <div className="why-image">

            <img
              src="https://nationalcampa.nic.in/Harit-SANKALP/wwwroot/assets/images/Logo/png/sankalp.png"
              alt="Harit Sankalp"
            />

            <div className="experience-card">

              <h2>25+</h2>

              <span>
                Years of Forestry
                Excellence
              </span>

            </div>

          </div>

          {/* RIGHT */}

          <div className="why-content">

            <div className="feature-box">

              <div className="feature-icon">
                <TbBinaryTree2 />
              </div>

              <div>

                <h3>
                 Unique Code Generation for Every Entity
                </h3>


              </div>

            </div>

            <div className="feature-box">

              <div className="feature-icon">
                <TbHash />
              </div>

              <div>

                <h3>
                  QR Code Generation
                </h3>

              

              </div>

            </div>

            <div className="feature-box">

              <div className="feature-icon">
                <TbMapSearch />
              </div>

              <div>

                <h3>
                  Mapping of Existing Nurseries of Forest Departments
                </h3>

              

              </div>

            </div>

            <div className="feature-box">

              <div className="feature-icon">
                <PiMapPinAreaDuotone />
              </div>

              <div>

                <h3>
                  End-to-End Traceability of Planting Material
                </h3>

             

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* ================= SERVICES ================= */}

      <section className="services-section">

        <div className="section-title">

          <span>OUR SERVICES</span>

          <h2>
            Smart Forestry Services
          </h2>

          <p>
            Digital solutions for planning,
            monitoring and managing forests
            across India.
          </p>

        </div>

        <div className="services-grid">

          {services.map((item,index)=>(

            <div
              className="service-card"
              key={index}
            >

              <div className="service-container">
                <img src={item.icon} alt={item.title} height={50} width={50}/>
                 <p>
                {item.text}
              </p>

              </div>
            <div className="service-button">
                 <button >

                Learn More →

              </button>
            </div>
             

            </div>

          ))}

        </div>

      </section>
            {/* ================= NURSERY GALLERY ================= */}

      <section className="gallery-section">

        <div className="section-title">

          <span>OUR NURSERIES</span>

          <h2>
            Featured Forest Nurseries
          </h2>

          <p>
            Explore some of India's modern forest nurseries
            managed through the Harit SANKALP platform.
          </p>

        </div>

        <div className="gallery-grid">

          {nurseryImages.map((image,index)=>(

            <div
              className="gallery-card"
              key={index}
            >

              <img
                src={image}
                alt=""
              />

              <div className="gallery-overlay">

                <h3>

                  Forest Nursery {index+1}

                </h3>

                <p>

                  Healthy plantation, quality seedlings,
                  scientific nursery management and
                  digital monitoring.

                </p>

                <button>

                  View Details →

                </button>

              </div>

            </div>

          ))}

        </div>

      </section>

    </>

  );

}

export default Home;