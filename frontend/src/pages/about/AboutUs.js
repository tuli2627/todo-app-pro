import React from "react";
import { useTranslation } from "react-i18next";
import { FiCompass, FiGlobe, FiMapPin, FiTarget } from "react-icons/fi";
import campaLogo from "../../assets/images/campa.png";  
import moefccLogo from "../../assets/images/moefcc.png";
import bhupenderPhoto from "../../assets/images/Bhupender.png";
import kirtiVardhanPhoto from "../../assets/images/kirtivardhan.png";

import tanmayKumarPhoto from "../../assets/images/Secretary, MoEF&CC.jpeg";
import santoshTewariPhoto from "../../assets/images/santosh-tewari.jpg";
import anandMohanPhoto from "../../assets/images/anand-Mohan.jpeg";
import "./AboutUs.css";

const ministryLeaders = [
  { nameKey: "about.leaders.bhupenderYadav", photo: bhupenderPhoto, roleKey: "about.minister" },
  { nameKey: "about.leaders.kirtiVardhanSingh", photo: kirtiVardhanPhoto, roleKey: "about.ministerOfState" },
];

const authorityLeaders = [
  { nameKey: "about.leaders.narendraBhooshan", photo: tanmayKumarPhoto, roleKey: "about.secretary" },
  { nameKey: "about.leaders.santoshTewari", photo: santoshTewariPhoto, roleKey: "about.directorGeneral" },
  { nameKey: "about.leaders.anandMohan", photo: anandMohanPhoto, roleKey: "about.ceo" },
];

function AboutUs() {
  const { t } = useTranslation();

  return (
    <div className="about-page">
      <section className="about-intro">
        <span className="about-intro__icon"><FiCompass aria-hidden="true" /></span>
        <span className="about-eyebrow">{t("home.portalName")}</span>
        <h1>{t("about.title")}</h1>
        <p className="about-intro__lead">{t("about.description")}</p>
        <p className="about-intro__body">{t("about.mission")}</p>
        <div className="about-pillars">
          <div><FiGlobe aria-hidden="true" /><span>{t("about.pillarNationwide")}</span></div>
          <div><FiMapPin aria-hidden="true" /><span>{t("about.pillarTraceability")}</span></div>
          <div><FiTarget aria-hidden="true" /><span>{t("about.pillarPlanning")}</span></div>
        </div>
      </section>

      <section className="about-leadership">
        <header className="about-section-heading">
          <span>{t("about.government")}</span>
          <h2>{t("about.ministryLeadership")}</h2>
        </header>
        <div className="about-ministry-grid">
          {ministryLeaders.map((person) => (
            <article className="about-person about-person--minister" key={person.nameKey}>
              <div className="about-person__portrait">
                <img src={person.photo} alt={t(person.nameKey)} />
              </div>
              <div className="about-person__details">
                <h3>{t(person.nameKey)}</h3>
                <p>{t(person.roleKey)}</p>
                <small>{t("about.ministryName")}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-authority">
        <header className="about-section-heading">
          <span>{t("about.nationalCampa")}</span>
          <h2>{t("about.authorityLeadership")}</h2>
        </header>
        <div className="about-authority-grid">
          {authorityLeaders.map((person) => (
            <article className="about-person about-person--authority" key={person.nameKey}>
              <div className="about-person__portrait">
                <img src={person.photo} alt={t(person.nameKey)} />
              </div>
              <h3>{t(person.nameKey)}</h3>
              <p>{t(person.roleKey)}</p>
              <small>{t("about.authorityName")}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="about-contact">
        <header className="about-contact__heading">
          <span className="about-contact__icon"><FiMapPin aria-hidden="true" /></span>
          <div>
            <span className="about-eyebrow">{t("about.contactEyebrow")}</span>
            <h2>{t("about.contactTitle")}</h2>
          </div>
        </header>
        <div className="about-contact-grid">
          <article className="about-contact-card">
            <img src={moefccLogo} alt="" />
            <h3>{t("about.ministryName")}</h3>
            <p>{t("about.ministryAddress")}</p>
            <a href="mailto:nationalcampa-moefcc@gov.in">nationalcampa-moefcc@gov.in</a>
          </article>
          <article className="about-contact-card">
            <img src={campaLogo} alt="" />
            <h3>{t("about.authorityName")}</h3>
            <p>{t("about.authorityAddress")}</p>
            <a href="mailto:nationalcampa-moefcc@gov.in">nationalcampa-moefcc@gov.in</a>
          </article>
        </div>
      </section>
    </div>
  );
}

export default AboutUs;

// import React from "react";
// import { useTranslation } from "react-i18next";
// import { FiCompass, FiGlobe, FiMapPin, FiTarget } from "react-icons/fi";
// import campaLogo from "../../assets/images/campa.png";
// import moefccLogo from "../../assets/images/moefcc.png";
// import bhupenderPhoto from "../../assets/images/Bhupender.png";
// import kirtiVardhanPhoto from "../../assets/images/kirtivardhan.png";

// import tanmayKumarPhoto from "../../assets/images/Secretary, MoEF&CC.jpeg";
// import santoshTewariPhoto from "../../assets/images/santosh-tewari.jpg";
// import anandMohanPhoto from "../../assets/images/anand-Mohan.jpeg";
// import "./AboutUs.css";

// const ministryLeaders = [
//   {
//     nameKey: "about.leaders.bhupenderYadav",
//     photo: bhupenderPhoto,
//     roleKey: "about.minister",
//   },
//   {
//     nameKey: "about.leaders.kirtiVardhanSingh",
//     photo: kirtiVardhanPhoto,
//     roleKey: "about.ministerOfState",
//   },
// ];

// const authorityLeaders = [
//   {
//     nameKey: "about.leaders.tanmayKumar",
//     photo: tanmayKumarPhoto,
//     roleKey: "about.secretary",
//   },
//   {
//     nameKey: "about.leaders.narendraBhooshan",
//     photo: santoshTewariPhoto,
//     roleKey: "about.directorGeneral",
//   },
//   {
//     nameKey: "about.leaders.anandMohan",
//     photo: anandMohanPhoto,
//     roleKey: "about.ceo",
//   },
// ];

// function AboutUs() {
//   const { t } = useTranslation();

//   return (
//     <div className="about-page">
//       <section className="about-intro">
//         <span className="about-intro__icon">
//           <FiCompass aria-hidden="true" />
//         </span>
//         <span className="about-eyebrow">{t("home.portalName")}</span>
//         <h1>{t("about.title")}</h1>
//         <p className="about-intro__lead">{t("about.description")}</p>
//         <p className="about-intro__body">{t("about.mission")}</p>

//         <div className="about-pillars">
//           <div>
//             <FiGlobe aria-hidden="true" />
//             <span>{t("about.pillarNationwide")}</span>
//           </div>
//           <div>
//             <FiMapPin aria-hidden="true" />
//             <span>{t("about.pillarTraceability")}</span>
//           </div>
//           <div>
//             <FiTarget aria-hidden="true" />
//             <span>{t("about.pillarPlanning")}</span>
//           </div>
//         </div>
//       </section>

//       <section className="about-leadership">
//         <header className="about-section-heading">
//           <span>{t("about.government")}</span>
//           <h2>{t("about.ministryLeadership")}</h2>
//         </header>

//         <div className="about-ministry-grid">
//           {ministryLeaders.map((person) => (
//             <article
//               className="about-person about-person--minister"
//               key={person.nameKey}
//             >
//               <div className="about-person__portrait">
//                 <img src={person.photo} alt={t(person.nameKey)} />
//               </div>
//               <div className="about-person__details">
//                 <h3>{t(person.nameKey)}</h3>
//                 <p>{t(person.roleKey)}</p>
//                 <small>{t("about.ministryName")}</small>
//               </div>
//             </article>
//           ))}
//         </div>
//       </section>

//       <section className="about-authority">
//         <header className="about-section-heading">
//           <span>{t("about.nationalCampa")}</span>
//           <h2>{t("about.authorityLeadership")}</h2>
//         </header>

//         <div className="about-authority-grid">
//           {authorityLeaders.map((person) => (
//             <article
//               className="about-person about-person--authority"
//               key={person.nameKey}
//             >
//               <div className="about-person__portrait">
//                 <img src={person.photo} alt={t(person.nameKey)} />
//               </div>
//               <h3>{t(person.nameKey)}</h3>
//               <p>{t(person.roleKey)}</p>
//               <small>{t("about.authorityName")}</small>
//             </article>
//           ))}
//         </div>
//       </section>

//       <section className="about-contact">
//         <header className="about-contact__heading">
//           <span className="about-contact__icon">
//             <FiMapPin aria-hidden="true" />
//           </span>
//           <div>
//             <span className="about-eyebrow">
//               {t("about.contactEyebrow")}
//             </span>
//             <h2>{t("about.contactTitle")}</h2>
//           </div>
//         </header>

//         <div className="about-contact-grid">
//           <article className="about-contact-card">
//             <img src={moefccLogo} alt="" />
//             <h3>{t("about.ministryName")}</h3>
//             <p>{t("about.ministryAddress")}</p>
//             <a href="mailto:nationalcampa-moefcc@gov.in">
//               nationalcampa-moefcc@gov.in
//             </a>
//           </article>

//           <article className="about-contact-card">
//             <img src={campaLogo} alt="" />
//             <h3>{t("about.authorityName")}</h3>
//             <p>{t("about.authorityAddress")}</p>
//             <a href="mailto:nationalcampa-moefcc@gov.in">
//               nationalcampa-moefcc@gov.in
//             </a>
//           </article>
//         </div>
//       </section>
//     </div>
//   );
// }

// export default AboutUs;