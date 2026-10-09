import React from "react";
import { useTranslation } from "react-i18next";
import {
  FiBookOpen,
  FiCheckCircle,
  FiCpu,
  FiDatabase,
  FiExternalLink,
  FiGitBranch,
  FiMapPin,
  FiUsers,
  FiUserPlus,
} from "react-icons/fi";
import "./UserGuides.css";

import registrationManual from "../../assets/documents/1_Harit_Sankalp_User_Registration_Guide_for_RO.pdf";
import approvalManual from "../../assets/documents/2_Harit_Sankalp_User_Approval_Guide_for_DFO.pdf";
import speciesManual from "../../assets/documents/3_Harit_Sankalp_Species_Master_Management.pdf";
import heightManual from "../../assets/documents/4_Harit_Sankalp_User_Guide_Species_Height_Master.pdf";
import directoryManual from "../../assets/documents/5_Harit_Sankalp_User_Guide_DIRECTORY_MASTER.pdf";
import nurseryMappingManual from "../../assets/documents/6_Harit_Sankalp_User_Guide_Mapping_Existing_Nurseries.pdf";
import locationManual from "../../assets/documents/7_Harit_Sankalp_User_Guide_Enable_Location.pdf";
import platformManual from "../../assets/documents/8_Harit_Sankalp_User_manual_MIS.pdf";
import supportManual from "../../assets/documents/9_Harit_Sankalp_Troubleshooting_FAQ (1).pdf";

const guideSections = [
  {
    titleKey: "guides.sections.users",
    icon: FiUsers,
    guides: [
      { titleKey: "guides.registration.title", descriptionKey: "guides.registration.description", icon: FiUserPlus, document: registrationManual },
      { titleKey: "guides.approval.title", descriptionKey: "guides.approval.description", icon: FiCheckCircle, document: approvalManual },
    ],
  },
  {
    titleKey: "guides.sections.masters",
    icon: FiDatabase,
    guides: [
      { titleKey: "guides.species.title", descriptionKey: "guides.species.description", icon: FiBookOpen, document: speciesManual },
      { titleKey: "guides.height.title", descriptionKey: "guides.height.description", icon: FiCpu, document: heightManual },
      { titleKey: "guides.directory.title", descriptionKey: "guides.directory.description", icon: FiGitBranch, document: directoryManual },
    ],
  },
  {
    titleKey: "guides.sections.operations",
    icon: FiCpu,
    guides: [
      { titleKey: "guides.migration.title", descriptionKey: "guides.migration.description", icon: FiDatabase, document: nurseryMappingManual },
      { titleKey: "guides.geo.title", descriptionKey: "guides.geo.description", icon: FiMapPin, document: locationManual },
      { titleKey: "guides.platform.title", descriptionKey: "guides.platform.description", icon: FiBookOpen, document: platformManual },
      { titleKey: "guides.support.title", descriptionKey: "guides.support.description", icon: FiCheckCircle, document: supportManual },
    ],
  },
];

function UserGuides() {
  const { t } = useTranslation();

  return (
    <div className="guides-page">
      <div className="guides-content">
        <header className="guides-heading">
          <span className="guides-heading__icon"><FiBookOpen aria-hidden="true" /></span>
          <span className="guides-eyebrow">{t("home.portalName")}</span>
          <h1>{t("guides.title")}</h1>
          <p>{t("guides.description")}</p>
        </header>

        {guideSections.map(({ titleKey, icon: SectionIcon, guides }) => (
          <section className="guide-section" key={titleKey}>
            <h2 className="guide-section__title">
              <SectionIcon aria-hidden="true" />
              {t(titleKey)}
            </h2>
            <div className="guide-grid">
              {guides.map(({ titleKey: guideTitle, descriptionKey, icon: GuideIcon, document }) => (
                <article className="guide-card" key={guideTitle}>
                  <span className="guide-card__icon"><GuideIcon aria-hidden="true" /></span>
                  <h3>{t(guideTitle)}</h3>
                  <p>{t(descriptionKey)}</p>
                  <a href={document} target="_blank" rel="noopener noreferrer" className="guide-card__link">
                    <span>{t("guides.openManual")}</span>
                    <FiExternalLink aria-hidden="true" />
                  </a>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default UserGuides;
