import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CircleMarker, MapContainer, Popup } from "react-leaflet";
import {
  FiActivity,
  FiArrowRight,
  FiCheckCircle,
  FiClipboard,
  FiFileText,
  FiDownload,
  FiSearch,
  FiMap,
  FiMapPin,
  FiTrendingUp,
  FiPlus,
  FiRefreshCw,
  FiShield,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import api from "../../services/api";
import SatelliteTileLayer from "../../components/Map/SatelliteTileLayer";
import Loader from "../../components/common/Loader";
import { getNurseryPhotoUrl } from "../../components/Map/NurseryDetailsModal";
import "./InternalWorkflow.css";
import sankalpLogo from "../../assets/images/sankalp.png";

const registrationModules = [
  "spa",
  "seed-orchard",
  "nursery",
  "processing-unit",
];
const operationModules = [
  "seed-collection",
  "seed-processing",
  "nursery-distribution",
  "plant-production",
  "plant-disposal",
];
const allWorkflowModules = [...registrationModules, ...operationModules];
const silviculturistModules = [
  "spa",
  "seed-orchard",
  "nursery",
  "research-institute",
  "processing-unit",
  "seed-collection",
  "seed-processing",
  "nursery-distribution",
  "plant-production",
  "plant-disposal",
];
const technicalLookupIdKeys = {
  states: "state_id",
  districts: "district_id",
  subdistricts: "subdistrict_id",
  blocks: "block_code",
  circles: "circle_id",
  divisions: "division_id",
  ranges: "range_id",
  sections: "section_id",
  compartments: "compart_id",
};
const technicalLookupNameKeys = {
  states: "state_name",
  districts: "district_name",
  subdistricts: "subdistrict_name",
  blocks: "block_name",
  circles: "circle_name",
  divisions: "division_name",
  ranges: "range_name",
  sections: "section_name",
  compartments: "compart_name",
};
const moduleIcons = {
  spa: FiActivity,
  "seed-orchard": FiActivity,
  nursery: FiMap,
  "research-institute": FiFileText,
  "processing-unit": FiActivity,
  "seed-collection": FiPlus,
  "seed-processing": FiActivity,
  "nursery-distribution": FiArrowRight,
  "plant-production": FiActivity,
  "plant-disposal": FiCheckCircle,
};
const workflowOptionLabelKeys = {
  propagation: { S: "seed", V: "vegetative" },
  sourceType: { S: "spa", O: "orchard" },
  yesNo: { Y: "yes", N: "no" },
  treatmentType: { T: "treated", U: "untreated" },
  distributionType: { N: "nursery", S: "orchard" },
};
const workflowColumnLabelKeys = {
  SPA_Name: "spaName",
  SO_Name: "orchardName",
  Nursery_Name: "nurseryName",
  RI_Name: "instituteName",
  PTU_Name: "processingUnitName",
  PD_Name: "recipientName",
  PD_Staff_Name: "staffName",
  PD_PlantationSite_Name: "plantationSite",
  PD_PP_ID: "plantProduction",
  ND_PU_ID: "processingUnit",
  PP_PUSCS_ID: "sourceBatch",
  Nursery_Contact_Person_Name: "contactName",
  Nursery_Contact_Person_Designation: "contactDesignation",
  Nursery_Contact_Person_Phone: "contactPhone",
  Nursery_Address: "fullAddress",
  Nursery_Website: "website",
};
const workflowColumnSuffixLabelKeys = {
  UniqueCode: "recordCode",
  ID: "recordId",
  State_ID: "state",
  District_ID: "district",
  SubDistrict_ID: "subDistrict",
  Block_ID: "block",
  Circle_ID: "circle",
  Division_ID: "division",
  Range_ID: "range",
  Section_ID: "section",
  Compart_ID: "compartment",
  Propagation_Type: "propagationType",
  Species: "species",
  Species_ID: "species",
  Type: "instituteType",
  MaintainBy: "maintainedBy",
  Year_ID: "establishmentYear",
  Location: "address",
  Distance: "distanceKm",
  Seed_Source_Type: "sourceType",
  Seed_Source_ID: "sourceName",
  Quantity_Collect: "quantityKg",
  Date_Collect: "collectionDate",
  TreatmentReq: "treatmentRequired",
  Mode_Collection: "collectionMode",
  PTUNUR_ID: "destination",
  PTU_ID: "processingUnit",
  SCS_ID: "seedCollection",
  Quantity_Unviable: "unviableKg",
  Quantity_Viable: "viableKg",
  Treatment_Type: "treatmentType",
  Treatment_Date: "treatmentDate",
  Quantity_Process: "quantityProcessed",
  Bag_Packs_No: "numberOfBags",
  Quantity_Per_Bag: "quantityPerBag",
  Processing_Date: "processingDate",
  Distribution_Type: "distributionType",
  Distribution_ID: "distributionDestination",
  Nursery_ID: "nursery",
  PU_ID: "sourceBatch",
  Germinated_No: "germinatedPlants",
  Available_No: "availablePlants",
  Sold_Gov_No: "soldGovernment",
  Sold_Pri_No: "soldPrivate",
  Sold_Ind_No: "soldIndividual",
  Bed_No: "bedNumber",
  Bed_Date_In: "bedDateIn",
  Bed_Date_Out: "bedDateOut",
  Transplant_No: "transplantedPlants",
  Bed_Date_Transplant: "transplantDate",
  ComeFrom: "sourceType",
  SoldTo: "soldTo",
  Staff_Contact: "staffContact",
  Plant_Age: "plantAge",
  Plant_Height: "plantHeight",
  Plant_No: "plantQuantity",
  Disposal_Date: "disposalDate",
  PlantationSite_Name: "plantationSite",
  Amount: "amount",
  Status: "statusLabel",
  Active: "activeStatus",
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("userData") || "null");
  } catch {
    return null;
  }
};

const getScopeDefaults = (user) => {
  const scope = user?.scope || {};
  return {
    state_id: scope.state_id ? String(scope.state_id) : "",
    district_id: scope.district_id ? String(scope.district_id) : "",
    circle_id: scope.circle_id ? String(scope.circle_id) : "",
    division_id: scope.division_id ? String(scope.division_id) : "",
    range_id: scope.range_id ? String(scope.range_id) : "",
  };
};

export function RequireWorkflowLogin({ children }) {
  const location = useLocation();
  if (!localStorage.getItem("accessToken") || !getStoredUser()) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return children;
}

export function InternalApprovals() {
  const { t } = useTranslation();
  const currentUser = useMemo(() => getStoredUser(), []);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDecision, setPendingDecision] = useState("");
  const decisionLockRef = useRef(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setRecords([]);
    try {
      const responses = await Promise.all(
        allWorkflowModules.map((module) =>
          api.get(`workflow/records/${module}/?status=P`).then(({ data }) =>
            (data.records || []).map((record) => ({ module, record }))
          )
        )
      );
      setRecords(responses.flat());
    } catch (requestError) {
      setError(requestError.message || t("workflow.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  if (["ro", "silviculturist"].includes(currentUser?.workflow_role)) {
    return <Navigate to="/internal/dashboard" replace />;
  }

  const decide = async (item, decision) => {
    const decisionKey = `${item.module}-${item.record[Object.keys(item.record)[0]]}`;
    if (decisionLockRef.current) return;
    decisionLockRef.current = true;
    setPendingDecision(decisionKey);
    const keyByModule = {
      spa: "SPA_ID", "seed-orchard": "SO_ID", nursery: "Nursery_ID",
      "research-institute": "RI_ID", "processing-unit": "PTU_ID",
      "seed-collection": "SCS_ID", "seed-processing": "PU_ID",
      "nursery-distribution": "ND_ID", "plant-production": "PP_ID",
      "plant-disposal": "PD_ID",
    };
    setError("");
    try {
      await api.post(
        `workflow/records/${item.module}/${item.record[keyByModule[item.module]]}/decision/`,
        { decision }
      );
      await load();
    } catch (requestError) {
      setError(requestError.message || t("workflow.saveError"));
    } finally {
      decisionLockRef.current = false;
      setPendingDecision("");
    }
  };

  return (
    <div className="workflow-page workflow-module-page">
      <div className="workflow-page__topline">
        <Link className="workflow-back" to="/internal/dashboard">{t("workflow.backToDashboard")}</Link>
      </div>
      <section className="workflow-module-heading">
        <span className="workflow-eyebrow"><FiShield aria-hidden="true" /> {t("workflow.internalPortal")}</span>
        <h1>{t("workflow.approvalsTitle")}</h1>
        <p>{t("workflow.approvalQueue")}</p>
      </section>
      {error && <div className="workflow-alert" role="alert">{error}</div>}
      {loading ? (
        <div className="workflow-loading"><Loader /><span>{t("workflow.loading")}</span></div>
      ) : records.length === 0 ? (
        <div className="workflow-empty"><FiFileText aria-hidden="true" /><p>{t("workflow.noRecords")}</p></div>
      ) : (
        <div className="workflow-approval-list">
          {records.map((item) => {
            const nameColumn = Object.keys(item.record).find((column) => /_Name$/.test(column));
            const codeColumn = Object.keys(item.record).find((column) => /_UniqueCode$/.test(column));
            return (
              <article className="workflow-approval-item" key={`${item.module}-${item.record[Object.keys(item.record)[0]]}`}>
                <div className="workflow-approval-item__content">
                  <span className="workflow-approval-item__module">{t(`workflow.modules.${item.module}`)}</span>
                  <h2>{(nameColumn && item.record[nameColumn]) || (codeColumn && item.record[codeColumn]) || t("workflow.recordDetails")}</h2>
                  {codeColumn && nameColumn && (
                    <p className="workflow-approval-item__code">{item.record[codeColumn]}</p>
                  )}
                </div>
                <div className="workflow-approval-item__actions">
                  <Link className="workflow-button workflow-button--quiet" to={`/internal/records/${item.module}/${item.record[{
                    spa: "SPA_ID", "seed-orchard": "SO_ID", nursery: "Nursery_ID",
                    "research-institute": "RI_ID", "processing-unit": "PTU_ID",
                    "seed-collection": "SCS_ID", "seed-processing": "PU_ID",
                    "nursery-distribution": "ND_ID", "plant-production": "PP_ID",
                    "plant-disposal": "PD_ID",
                  }[item.module]]}`}>
                    {t("workflow.viewDetails")}
                  </Link>
                  <button type="button" className="workflow-button workflow-button--quiet workflow-approval-item__return" disabled={Boolean(pendingDecision)} onClick={() => decide(item, "reject")}>{t("workflow.reject")}</button>
                  <button type="button" className="workflow-button" disabled={Boolean(pendingDecision)} onClick={() => decide(item, "approve")}>{t("workflow.approve")}</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function InternalDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useMemo(() => getStoredUser(), []);
  const [overview, setOverview] = useState(null);
  const [progressDashboard, setProgressDashboard] = useState(null);
  const [showProgressAlert, setShowProgressAlert] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("workflow/overview/");
      setOverview(data);
    } catch (requestError) {
      setError(requestError.message || t("workflow.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    api.get("workflow/progress/dashboard/")
      .then(({ data }) => setProgressDashboard(data))
      .catch((requestError) => {
        setError(requestError.message || t("workflow.progress.loadError"));
      });
  }, [t]);

  const countByModule = useMemo(
    () => Object.fromEntries((overview?.counts || []).map((item) => [item.module, item])),
    [overview]
  );
  const userRole = user?.workflow_role || "ro";
  const isSilviculturist = userRole === "silviculturist";
  const visibleRegistrationModules = isSilviculturist
    ? registrationModules.filter((module) => silviculturistModules.includes(module))
    : registrationModules;
  const visibleOperationModules = isSilviculturist
    ? operationModules.filter((module) => silviculturistModules.includes(module))
    : operationModules;
  const technicalQueueModule = silviculturistModules.find(
    (module) => (countByModule[module]?.pending || 0) > 0
  ) || "spa";
  const scopeLabel =
    user?.scope?.office_name ||
    user?.scope?.state_name ||
    user?.stateName ||
    user?.officeName ||
    "";

  const renderCards = (modules) =>
    modules.map((module) => {
      const Icon = moduleIcons[module] || FiClipboard;
      const counts = countByModule[module] || { total: 0, pending: 0 };
      return (
        <article className="workflow-card" key={module}>
          <span className="workflow-card__icon"><Icon aria-hidden="true" /></span>
          <span className="workflow-card__eyebrow">{t(`workflow.category.${registrationModules.includes(module) ? "registration" : "operations"}`)}</span>
          <h3>{t(`workflow.modules.${module}`)}</h3>
          <p>{t(`workflow.moduleDescription.${module}`)}</p>
          <div className="workflow-card__stats">
            <span><strong>{counts.total}</strong>{t("workflow.totalRecords")}</span>
            <span><strong>{counts.pending}</strong>{t("workflow.pending")}</span>
            <span title={t("workflow.status.legacy")}><strong>{counts.legacy || 0}</strong>{t("workflow.legacyRecords")}</span>
          </div>
          <div className="workflow-card__actions">
            {!isSilviculturist && (
              <button type="button" onClick={() => navigate(`/internal/workflow/${module}`)}>
                <FiPlus aria-hidden="true" /> {t(registrationModules.includes(module) ? "workflow.register" : "workflow.addRecord")}
              </button>
            )}
            <button type="button" className="workflow-card__secondary" onClick={() => navigate(`/internal/reports/${module}`)}>
              {isSilviculturist
                ? <FiCheckCircle aria-hidden="true" />
                : <FiFileText aria-hidden="true" />}
              {t(isSilviculturist ? "workflow.technicalReviews" : "workflow.reports")}
            </button>
          </div>
        </article>
      );
    });

  return (
    <div className="workflow-page">
      <section className="workflow-welcome">
        <div className="workflow-welcome__copy">
          <span className="workflow-eyebrow"><FiShield aria-hidden="true" /> {t("workflow.internalPortal")}</span>
          <h1>{t("workflow.welcome", { name: overview?.name || user?.name || "" })}</h1>
          <p>{t(`workflow.roles.${userRole}`)}{scopeLabel ? ` · ${scopeLabel}` : ""}</p>
        </div>
        <button type="button" className="workflow-refresh" onClick={loadOverview} disabled={loading}>
          <FiRefreshCw aria-hidden="true" /> {t("workflow.refresh")}
        </button>
      </section>

      {error && <div className="workflow-alert" role="alert">{error}</div>}
      {progressDashboard?.overdue && showProgressAlert && (
        <div className="workflow-overdue-popup__backdrop" role="presentation">
          <section className="workflow-overdue-popup" role="alertdialog" aria-modal="true" aria-labelledby="progress-alert-title">
            <button type="button" className="workflow-overdue-popup__close" onClick={() => setShowProgressAlert(false)} aria-label={t("common.close")}>×</button>
            <span className="workflow-eyebrow">{t("workflow.progress.eyebrow")}</span>
            <h2 id="progress-alert-title">{t("workflow.progress.overdueTitle")}</h2>
            <p>{t("workflow.progress.overdueCount", { count: progressDashboard.missing?.length || 0 })}</p>
            <ul className="workflow-overdue-popup__list">
              {(progressDashboard.missing || []).slice(0, 8).map((item, index) => (
                <li key={`${item.task || "report"}-${item.module}-${item.record_id}-${index}`}>
                  <strong>{item.site_name || item.name}</strong>
                  <span>{t(`workflow.modules.${item.module}`)}</span>
                  <em>{t(`workflow.progress.tasks.${item.task || "ro_report"}`)}</em>
                </li>
              ))}
            </ul>
            <div className="workflow-overdue-popup__actions">
              <button type="button" onClick={() => navigate("/internal/progress")}>{t("workflow.progress.viewOverdue")}</button>
              <button type="button" className="workflow-overdue-popup__secondary" onClick={() => setShowProgressAlert(false)}>{t("common.close")}</button>
            </div>
          </section>
        </div>
      )}

      {!["ro", "silviculturist"].includes(userRole) && (
        <section className="workflow-approval-banner">
          <div><FiUsers aria-hidden="true" /><span>{t("workflow.approvalQueue")}</span></div>
          <strong>{overview?.counts?.reduce((sum, item) => sum + item.pending, 0) || 0}</strong>
          <button type="button" onClick={() => navigate("/internal/approvals")}>{t("workflow.reviewPending")} <FiArrowRight aria-hidden="true" /></button>
        </section>
      )}
      {isSilviculturist && (
        <section className="workflow-approval-banner">
          <div><FiCheckCircle aria-hidden="true" /><span>{t("workflow.technicalQueue")}</span></div>
          <strong>{silviculturistModules.reduce(
            (sum, module) => sum + (countByModule[module]?.pending || 0), 0
          )}</strong>
          <button type="button" onClick={() => navigate(`/internal/reports/${technicalQueueModule}`)}>
            {t("workflow.reviewTechnicalData")} <FiArrowRight aria-hidden="true" />
          </button>
        </section>
      )}
      <section className="workflow-tools">
        <button type="button" onClick={() => navigate("/internal/progress")}>
          <FiTrendingUp aria-hidden="true" />{t("workflow.progress.title")}
        </button>
        {userRole === "dfo" && (
          <button type="button" onClick={() => navigate("/internal/admin/directory")}>
            <FiMapPin aria-hidden="true" />{t("workflow.admin.manageBeats")}
          </button>
        )}
      </section>

      {loading ? (
        <div className="workflow-loading"><Loader /><span>{t("workflow.loading")}</span></div>
      ) : (
        <>
          {visibleRegistrationModules.length > 0 && (
            <section className="workflow-section">
              <div className="workflow-section__heading">
                <div><span>{t("workflow.category.registration")}</span><h2>{t("workflow.registrationTitle")}</h2></div>
              </div>
              <div className="workflow-grid">{renderCards(visibleRegistrationModules)}</div>
            </section>
          )}
          <section className="workflow-section">
            <div className="workflow-section__heading">
              <div><span>{t("workflow.category.operations")}</span><h2>{t("workflow.operationsTitle")}</h2></div>
            </div>
            <div className="workflow-grid">{renderCards(visibleOperationModules)}</div>
          </section>
          <section className="workflow-tools">
            {!isSilviculturist && <button type="button" onClick={() => navigate("/internal/mapping")}><FiMap aria-hidden="true" />{t("workflow.nurseryMapping")}</button>}
            {userRole !== "ro" && !isSilviculturist && (
              <button type="button" onClick={() => navigate("/internal/users")}><FiUsers aria-hidden="true" />{t("workflow.userManagement")}</button>
            )}
            {userRole !== "ro" && !isSilviculturist && (
              <button type="button" onClick={() => navigate("/internal/admin/users")}><FiUsers aria-hidden="true" />{t("workflow.admin.addUser")}</button>
            )}
            <Link to="/dashboard">{t("workflow.publicDashboard")}</Link>
          </section>
        </>
      )}
    </div>
  );
}

const clearDependentFields = (name, values) => {
  const clear = {
    state_id: ["district_id", "subdistrict_id", "block_id", "circle_id", "division_id", "range_id", "section_id", "compart_id"],
    district_id: ["subdistrict_id", "block_id"],
    circle_id: ["division_id", "range_id", "section_id", "compart_id"],
    division_id: ["range_id", "section_id", "compart_id"],
    range_id: ["section_id", "compart_id"],
    section_id: ["compart_id"],
  };
  return Object.fromEntries((clear[name] || []).map((key) => [key, ""]));
};

const workflowModuleKeys = {
  spa: ["SPA_ID", "SPA_Status"], "seed-orchard": ["SO_ID", "SO_Status"],
  nursery: ["Nursery_ID", "Nursery_Status"], "research-institute": ["RI_ID", "RI_Status"],
  "processing-unit": ["PTU_ID", "PTU_Status"], "seed-collection": ["SCS_ID", "SCS_Status"],
  "seed-processing": ["PU_ID", "PU_Status"], "nursery-distribution": ["ND_ID", "ND_Status"],
  "plant-production": ["PP_ID", "PP_Status"], "plant-disposal": ["PD_ID", "PD_Status"],
};
const recordLookupOptions = new Set([
  "sources",
  "processingUnits",
  "seedCollections",
  "seedBatches",
  "plantProduction",
  "nurseries",
  "destinations",
]);

const escapeHtml = (value) =>
  String(value).replace(/[&<>"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;",
  })[character]);

const normalizeMobileNumber = (value) => value.replace(/\D/g, "").slice(0, 10);

const normalizeDecimalInput = (value, maxDecimalPlaces, allowNegative = false) => {
  if (
    value.includes("+")
    || (value.includes("-") && (!allowNegative || !value.startsWith("-") || value.indexOf("-", 1) >= 0))
  ) return "";
  const negative = allowNegative && value.startsWith("-");
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  const separator = normalized.indexOf(".");
  const number = separator < 0
    ? normalized
    : `${normalized.slice(0, separator)}.${normalized.slice(separator + 1).replace(/\./g, "").slice(0, maxDecimalPlaces)}`;
  return `${negative ? "-" : ""}${number}`;
};

const labelFromColumn = (column, t) => {
  const suffix = column.includes("_") ? column.slice(column.indexOf("_") + 1) : column;
  const label = workflowColumnLabelKeys[column] || workflowColumnSuffixLabelKeys[suffix];
  return label
    ? t(`workflow.fields.${label}`)
    : column.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
};

function WorkflowModulePage() {
  const { module } = useParams();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useMemo(() => getStoredUser(), []);
  const reportOnly = location.pathname.startsWith("/internal/reports/");
  const [fields, setFields] = useState([]);
  const [records, setRecords] = useState([]);
  const [lookups, setLookups] = useState({});
  const [locationFilterFields, setLocationFilterFields] = useState([]);
  const [values, setValues] = useState(() => getScopeDefaults(user));
  const [selectedFiles, setSelectedFiles] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [exporting, setExporting] = useState(false);
  const [locationFilters, setLocationFilters] = useState({
    state_id: "", district_id: "", circle_id: "", division_id: "", range_id: "",
  });
  const [offset, setOffset] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState(null);
  const deleteLockRef = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const lookupRequestRef = useRef(0);

  const lookupParams = useMemo(() => {
    const keys = ["state_id", "district_id", "circle_id", "division_id", "range_id", "section_id"];
    const params = new URLSearchParams();
    keys.forEach((key) => {
      const selected = locationFilters[key] || values[key];
      if (selected) params.set(key, selected);
    });
    return params.toString();
  }, [locationFilters, values]);

  const load = useCallback(async () => {
    const lookupRequestId = ++lookupRequestRef.current;
    setLoading(true);
    setError("");
    setFields([]);
    setRecords([]);
    try {
      const query = new URLSearchParams();
      if (statusFilter) query.set("status", statusFilter);
      if (search.trim()) query.set("search", search.trim());
      Object.entries(locationFilters).forEach(([key, value]) => {
        if (value) query.set(key, value);
      });
      query.set("limit", "100");
      query.set("offset", String(offset));
      const lookupQuery = new URLSearchParams(lookupParams);
      if (module === "nursery") lookupQuery.set("module", module);
      if (reportOnly) lookupQuery.set("report_only", "1");
      const [recordResult, lookupResult] = await Promise.allSettled([
        api.get(`workflow/records/${module}/${query.size ? `?${query}` : ""}`),
        api.get(`workflow/lookups/${lookupQuery.size ? `?${lookupQuery}` : ""}`),
      ]);
      if (recordResult.status === "fulfilled") {
        setFields(recordResult.value.data.fields || []);
        setLocationFilterFields(recordResult.value.data.location_filters || []);
        setRecords(recordResult.value.data.records || []);
        setCount(recordResult.value.data.count || 0);
      } else {
        throw recordResult.reason;
      }
      if (lookupRequestId === lookupRequestRef.current) {
        if (lookupResult.status === "fulfilled") {
          setLookups(lookupResult.value.data || {});
        } else {
          setLookups({});
          setError(lookupResult.reason.message || t("workflow.lookupError"));
        }
      }
    } catch (requestError) {
      setError(requestError.message || t("workflow.loadError"));
    } finally {
      setLoading(false);
    }
  }, [locationFilters, lookupParams, module, offset, reportOnly, search, statusFilter, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setLocationFilters({
      state_id: "", district_id: "", circle_id: "", division_id: "", range_id: "",
    });
    setStatusFilter("");
    setSearch("");
    setSearchInput("");
    setOffset(0);
  }, [module]);

  const scopeDefaults = useMemo(() => getScopeDefaults(user), [user]);

  useEffect(() => {
    setValues(scopeDefaults);
    setSelectedFiles({});
  }, [module, scopeDefaults]);

  useEffect(() => {
    if (
      module !== "nursery" ||
      user?.workflow_role !== "ro" ||
      !lookups.ownContactPersonId ||
      values.contact_person_user_id
    ) return;
    const person = (lookups.contactPeople || []).find(
      (item) => String(item.id) === String(lookups.ownContactPersonId)
    );
    if (!person) return;
    setValues((current) => ({
      ...current,
      contact_person_user_id: String(person.id),
      contact_person_name: person.name,
      contact_person_designation: person.designation,
      contact_person_phone: person.phone,
    }));
  }, [lookups, module, user, values.contact_person_user_id]);

  const setField = (name, value) => {
    setValues((current) => ({
      ...current,
      ...clearDependentFields(name, current),
      ...(module === "nursery" && ["state_id", "district_id", "circle_id", "division_id", "range_id"].includes(name)
        ? {
          contact_person_user_id: "",
          contact_person_name: "",
          contact_person_designation: "",
          contact_person_phone: "",
        }
        : {}),
      [name]: value,
    }));
    setNotice("");
  };

  const selectContactPerson = (personId) => {
    const person = (lookups.contactPeople || []).find(
      (item) => String(item.id) === personId
    );
    setValues((current) => ({
      ...current,
      contact_person_user_id: personId,
      contact_person_name: person?.name || "",
      contact_person_designation: person?.designation || "",
      contact_person_phone: person?.phone || "",
    }));
  };

  const getOptions = (field) => {
    const options = lookups[field.options] || [];
    if (field.name === "compart_id") {
      return options.filter(
        (item) => String(item.compart_section_id) === String(values.section_id || "")
      );
    }
    if (field.name === "source_id" && values.source_type) {
      return options.filter((item) => item.type === values.source_type);
    }
    if (field.name === "distribution_id" && values.distribution_type) {
      const requiredType = values.distribution_type === "N" ? "N" : "S";
      return (lookups.destinations || []).filter(
        (item) => item.type === (requiredType === "N" ? "N" : "P")
      );
    }
    return options;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const body = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value !== "" && value != null) body.append(key, value);
      });
      Object.entries(selectedFiles).forEach(([key, value]) => {
        if (value) body.append(key, value);
      });
      const { data } = await api.post(`workflow/records/${module}/`, body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNotice(t(data.status === "A" ? "workflow.approved" : "workflow.submittedForReview"));
      setValues(getScopeDefaults(user));
      setSelectedFiles({});
      event.target.reset();
      await load();
    } catch (requestError) {
      setError(requestError.message || t("workflow.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (recordId) => {
    if (deleteLockRef.current || !window.confirm(t("workflow.confirmDelete"))) return;
    deleteLockRef.current = true;
    setDeletingRecordId(recordId);
    setError("");
    try {
      await api.delete(`workflow/records/${module}/${recordId}/`);
      setNotice(t("workflow.recordDeleted"));
      await load();
    } catch (requestError) {
      setError(requestError.message || t("workflow.saveError"));
    } finally {
      deleteLockRef.current = false;
      setDeletingRecordId(null);
    }
  };

  const tableColumns = useMemo(() => {
    if (!records.length) return [];
    return Object.keys(records[0]).filter((key) => !["display_values", "created_by", "can_delete"].includes(key) && !/EntryBy|EntryOn|Updated|ApprovedBy|ApprovedOn|Status|PHoto|PHOTO|Latitude|Longitude|KML[_]?URL/i.test(key));
  }, [records]);
  const showActions = !reportOnly && records.some((record) => record.can_delete === true);

  const displayValue = (record, column) => {
    if (record.display_values?.[column]) return record.display_values[column];
    if (record[column] == null || record[column] === "") return "—";
    const lookupKey = column.endsWith("_Propagation_Type") ? "propagation"
      : column.endsWith("_MaintainBy") ? "maintainBy"
        : column.endsWith("_Year_ID") ? "years"
          : column.endsWith("_Type") ? "type"
            : column === "SPA_Species" ? "species"
              : null;
    const option = lookupKey && (lookups[lookupKey] || []).find(
      (item) => String(item.id) === String(record[column])
    );
    if (option) {
      const labelKey = workflowOptionLabelKeys[lookupKey]?.[String(option.id)];
      return labelKey ? t(`workflow.options.${labelKey}`) : option.name;
    }
    return String(record[column]);
  };

  const [primaryKey, statusColumn] = workflowModuleKeys[module] || [];
  const exportReport = async (format) => {
    const printWindow = format === "pdf"
      ? window.open("", "_blank")
      : null;
    if (format === "pdf" && !printWindow) {
      setError(t("workflow.exportPopupBlocked"));
      return;
    }
    if (printWindow) printWindow.opener = null;
    setExporting(true);
    setError("");
    try {
      const query = new URLSearchParams();
      if (statusFilter) query.set("status", statusFilter);
      if (search.trim()) query.set("search", search.trim());
      Object.entries(locationFilters).forEach(([key, value]) => {
        if (value) query.set(key, value);
      });
      query.set("limit", "500");
      let exportOffset = 0;
      let exportCount = count;
      const exportRows = [];
      do {
        query.set("offset", String(exportOffset));
        const { data } = await api.get(`workflow/records/${module}/?${query}`);
        exportRows.push(...(data.records || []));
        exportCount = data.count || 0;
        exportOffset += (data.records || []).length;
      } while (exportOffset < exportCount && exportOffset > 0);

      const statusName = (record) => ({
        P: "pending", A: "approved", R: "rejected",
      })[record[statusColumn]] || "legacy";
      const rows = [
        [t(`workflow.modules.${module}`), ...tableColumns.map((column) => labelFromColumn(column, t)), t("workflow.statusLabel")],
        ...exportRows.map((record) => [
          ...tableColumns.map((column) => displayValue(record, column)),
          t(`workflow.status.${statusName(record)}`),
        ]),
      ];
      const stateColumn = tableColumns.find((column) => /_State_ID$/.test(column));
      const stateTotals = new Map();
      exportRows.forEach((record) => {
        const stateName = stateColumn
          ? displayValue(record, stateColumn)
          : t("workflow.allStates");
        stateTotals.set(stateName, (stateTotals.get(stateName) || 0) + 1);
      });
      const summaryRows = [
        [t("workflow.exportState"), t("workflow.exportTotal")],
        ...[...stateTotals.entries()].sort(([left], [right]) => left.localeCompare(right)),
        [t("workflow.exportGrandTotal"), exportRows.length],
      ];
      const htmlRows = rows.map((row, index) =>
        `<tr>${row.map((cell) => {
          const safeCell = format === "excel" && /^[\t\r ]*[=+\-@]/.test(String(cell))
            ? `'${cell}`
            : cell;
          return `<${index ? "td" : "th"}>${escapeHtml(safeCell)}</${index ? "td" : "th"}>`;
        }).join("")}</tr>`
      );
      const table = `<thead>${htmlRows[0]}</thead><tbody>${htmlRows.slice(1).join("")}</tbody>`;
      if (format === "excel") {
        const xmlRows = (values, style) =>
          `<Row>${values.map((value) => {
            const text = String(value ?? "");
            const safeText = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text;
            return `<Cell ss:StyleID="${style}"><Data ss:Type="String">${escapeHtml(safeText)}</Data></Cell>`;
          }).join("")}</Row>`;
        const reportSheet = rows.map((row, index) =>
          xmlRows(row, index === 0 ? "Header" : index % 2 === 0 ? "Stripe" : "Body")
        ).join("");
        const workbook = `<?xml version="1.0" encoding="UTF-8"?>
          <?mso-application progid="Excel.Sheet"?>
          <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
            xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
            <Styles>
              <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/>
                <Interior ss:Color="#205F43" ss:Pattern="Solid"/>
                <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#174A34"/>
                  <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#174A34"/>
                  <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#174A34"/>
                  <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#174A34"/></Borders>
              </Style>
              <Style ss:ID="Body"><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B9CBBB"/>
                <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B9CBBB"/>
                <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B9CBBB"/>
                <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B9CBBB"/></Borders></Style>
              <Style ss:ID="Stripe"><Interior ss:Color="#EAF2EC" ss:Pattern="Solid"/>
                <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B9CBBB"/>
                  <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B9CBBB"/>
                  <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B9CBBB"/>
                  <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#B9CBBB"/></Borders></Style>
              <Style ss:ID="Total"><Font ss:Bold="1"/><Interior ss:Color="#DCEBDD" ss:Pattern="Solid"/>
                <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#79927E"/>
                  <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#79927E"/>
                  <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#79927E"/>
                  <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#79927E"/></Borders></Style>
            </Styles>
            <Worksheet ss:Name="${escapeHtml(t("workflow.exportSummary"))}"><Table>${summaryRows.map((row, index) =>
              xmlRows(row, index === 0 ? "Header" : index === summaryRows.length - 1 ? "Total" : index % 2 === 0 ? "Stripe" : "Body")
            ).join("")}</Table></Worksheet>
            <Worksheet ss:Name="${escapeHtml(t("workflow.exportRecords"))}"><Table>${reportSheet}</Table></Worksheet>
          </Workbook>`;
        const blob = new Blob(
          [workbook],
          { type: "application/vnd.ms-excel;charset=utf-8" }
        );
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `${module}-report.xls`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      } else {
        printWindow.document.write(
          `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(t(`workflow.modules.${module}`))}</title><style>
            *{box-sizing:border-box}body{font:12px Arial,sans-serif;padding:24px;color:#1d3427}
            .watermark{position:fixed;top:24%;left:30%;width:40%;height:auto;opacity:.08;z-index:0}
            body>header,body>section,body>table{position:relative;z-index:1}
            .report-header{display:flex;align-items:center;gap:16px;padding:14px 20px;background:#205f43;color:#fff;border-radius:8px}
            .report-header img{width:68px;height:68px;object-fit:contain;background:#fff;border-radius:50%;padding:4px}
            h1{font-size:20px;margin:0}.report-header p{margin:5px 0 0}.summary{margin:20px 0}
            h2{font-size:16px;color:#205f43;margin:0 0 8px}
            table{border-collapse:collapse;width:100%;margin-bottom:18px;break-inside:auto}thead{display:table-header-group}
            tr{break-inside:avoid}th,td{border:1px solid #79927e;padding:6px;text-align:left}
            th{background:#205f43!important;color:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
            tbody tr:nth-child(even){background:#eaf2ec!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
            tbody tr.total-row{font-weight:bold;background:#dcebdd!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
            .report-summary{width:min(520px,100%)}@page{size:landscape;margin:12mm}
            </style></head><body>
            <img class="watermark" src="${escapeHtml(sankalpLogo)}" alt="">
            <header class="report-header"><img src="${escapeHtml(sankalpLogo)}" alt="Harit Sankalp">
            <div><h1>${escapeHtml(t(`workflow.modules.${module}`))}</h1>
            <p>${escapeHtml(t("workflow.exportRows", { count: exportRows.length }))}</p></div></header>
            <section class="summary"><h2>${escapeHtml(t("workflow.exportSummary"))}</h2>
            <table class="report-summary"><thead><tr>${summaryRows[0].map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr></thead>
            <tbody>${summaryRows.slice(1).map((row, index) => `<tr${index === summaryRows.length - 2 ? ' class="total-row"' : ""}>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></section>
            <table>${table}</table><script>window.onload=()=>window.print()</script></body></html>`
        );
        printWindow.document.close();
      }
    } catch (requestError) {
      if (printWindow) printWindow.close();
      setError(requestError.message || t("workflow.exportError"));
    } finally {
      setExporting(false);
    }
  };

  const selectOptionList = (field) => {
    const options = getOptions(field);
    const idKey = field.options === "states" ? "state_id"
      : field.options === "districts" ? "district_id"
        : field.options === "subdistricts" ? "subdistrict_id"
          : field.options === "blocks" ? "block_code"
            : field.options === "circles" ? "circle_id"
              : field.options === "divisions" ? "division_id"
                : field.options === "ranges" ? "range_id"
                  : field.options === "sections" ? "section_id"
                    : field.options === "compartments" ? "compart_id"
                      : "id";
    const nameKey = {
      states: "state_name", districts: "district_name", subdistricts: "subdistrict_name",
      blocks: "block_name", circles: "circle_name", divisions: "division_name",
      ranges: "range_name", sections: "section_name", compartments: "compart_name",
    }[field.options] || "name";
    return options.map((option) => {
      const id = option[idKey] ?? option.id;
      const optionLabel = workflowOptionLabelKeys[field.options]?.[String(id)];
      return {
        id,
        type: option.type,
        name: optionLabel
          ? t(`workflow.options.${optionLabel}`)
          : option[nameKey] ?? option.name,
      };
    });
  };

  const renderSelectOptions = (field) => {
    const options = selectOptionList(field);
    const emptyRecordLookup = options.length === 0
      && recordLookupOptions.has(field.options);
    return [
      <option key="placeholder" value="">
        {t(emptyRecordLookup ? "workflow.noApprovedOptions" : "workflow.selectOption")}
      </option>,
      ...options.map((option) => (
        <option key={`${option.type || field.options}-${option.id}`} value={option.id}>{option.name}</option>
      )),
    ];
  };

  return (
    <div className="workflow-page workflow-module-page">
      <div className="workflow-page__topline">
        <button type="button" className="workflow-back" onClick={() => navigate("/internal/dashboard")}>
          {t("workflow.backToDashboard")}
        </button>
        <span>{t(`workflow.roles.${user?.workflow_role || "ro"}`)}</span>
      </div>
      <section className="workflow-module-heading">
        <span className="workflow-eyebrow"><FiClipboard aria-hidden="true" /> {t(reportOnly ? "workflow.reports" : "workflow.internalPortal")}</span>
        <h1>{t(`workflow.modules.${module}`)}</h1>
        <p>{t(reportOnly ? "workflow.reportDescription" : `workflow.moduleDescription.${module}`)}</p>
      </section>

      {error && <div className="workflow-alert" role="alert">{error}</div>}
      {notice && <div className="workflow-success" role="status">{notice}</div>}

      {!reportOnly && (
        <form className="workflow-form" onSubmit={handleSubmit}>
          <div className="workflow-form__heading"><h2>{t("workflow.recordDetails")}</h2><span>{t("workflow.requiredFields")}</span></div>
          <div className="workflow-form__grid">
            {module === "nursery" && (
              <label className="workflow-field workflow-form__contact-person">
                <span>{t("workflow.fields.contactName")}</span>
                <select
                  value={values.contact_person_user_id || ""}
                  required={user?.workflow_role !== "ro"}
                  disabled={user?.workflow_role === "ro"}
                  onChange={(event) => selectContactPerson(event.target.value)}
                >
                  <option value="">{t("workflow.selectOption")}</option>
                  {(lookups.contactPeople || []).map((person) => (
                    <option key={person.id} value={person.id}>{person.name}</option>
                  ))}
                </select>
              </label>
            )}
            {fields.map((field) => (
              <label className={`workflow-field${field.type === "file" ? " workflow-field--file" : ""}`} key={field.name}>
                <span>{t(field.label)}{field.required && <b aria-hidden="true"> *</b>}</span>
                {field.type === "select" ? (
                  <select
                    value={values[field.name] || ""}
                    required={field.required}
                    disabled={
                      user?.workflow_role !== "national" &&
                      Boolean(user?.scope?.[field.name])
                    }
                    onChange={(event) => setField(field.name, event.target.value)}
                  >
                    {renderSelectOptions(field)}
                  </select>
                ) : field.type === "file" ? (
                  <>
                    <input
                      type="file"
                      required={field.required}
                      accept={field.upload === "photo" ? ".jpg,.jpeg,image/jpeg" : ".kml,application/vnd.google-earth.kml+xml"}
                      onChange={(event) => setSelectedFiles((current) => ({ ...current, [field.name]: event.target.files?.[0] || null }))}
                    />
                    <small>{t(field.upload === "photo" ? "workflow.photoRules" : "workflow.kmlRules")}</small>
                  </>
                ) : (
                  <input
                    type={field.type === "number" || ["contact_person_phone", "staff_contact"].includes(field.name) ? "text" : field.type || "text"}
                    inputMode={
                      field.type === "number"
                        ? "decimal"
                        : ["contact_person_phone", "staff_contact"].includes(field.name)
                          ? "numeric"
                          : undefined
                    }
                    maxLength={
                      ["contact_person_phone", "staff_contact"].includes(field.name)
                        ? 10
                        : ["latitude", "longitude"].includes(field.name)
                          ? 20
                          : undefined
                    }
                    pattern={
                      ["contact_person_phone", "staff_contact"].includes(field.name)
                        ? "[0-9]{10}"
                        : field.type === "number"
                          ? ["latitude", "longitude"].includes(field.name)
                            ? "-?([0-9]+([.,][0-9]*)?|[.,][0-9]+)"
                            : "([0-9]+([.,][0-9]*)?|[.,][0-9]+)"
                          : undefined
                    }
                    required={field.required}
                    value={values[field.name] || ""}
                    onChange={(event) => {
                      const nextValue = field.type === "number"
                        ? normalizeDecimalInput(
                          event.target.value,
                          ["latitude", "longitude"].includes(field.name) ? 8 : 12,
                          ["latitude", "longitude"].includes(field.name)
                        )
                        : ["contact_person_phone", "staff_contact"].includes(field.name)
                          ? normalizeMobileNumber(event.target.value)
                          : event.target.value;
                      setField(field.name, nextValue);
                    }}
                    placeholder={t("workflow.enterValue")}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="workflow-form__actions">
            <button type="button" className="workflow-button workflow-button--quiet" onClick={() => { setValues(getScopeDefaults(user)); setSelectedFiles({}); }}>
              {t("workflow.clearForm")}
            </button>
            <button type="submit" className="workflow-button" disabled={saving}>
              {saving
                ? t("workflow.saving")
                : t(user?.workflow_role === "national" ? "workflow.submitAndApprove" : "workflow.submitForReview")}
            </button>
          </div>
        </form>
      )}

      <section className="workflow-records">
        <div className="workflow-records__heading">
          <div><span>{t("workflow.records")}</span><h2>{t(reportOnly ? "workflow.reportTitle" : "workflow.submittedRecords")}</h2></div>
          <div className="workflow-records__controls">
            <select aria-label={t("workflow.filterStatus")} value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setOffset(0); }}>
              <option value="">{t("workflow.allStatuses")}</option>
              <option value="P">{t("workflow.status.pending")}</option>
              <option value="A">{t("workflow.status.approved")}</option>
              <option value="R">{t("workflow.status.rejected")}</option>
              <option value="legacy">{t("workflow.status.legacy")}</option>
            </select>
            <button type="button" onClick={() => exportReport("excel")} disabled={exporting} aria-label={t("workflow.exportExcel")}><FiDownload aria-hidden="true" /> XLS</button>
            <button type="button" onClick={() => exportReport("pdf")} disabled={exporting} aria-label={t("workflow.exportPdf")}><FiFileText aria-hidden="true" /> PDF</button>
            <button type="button" onClick={load} aria-label={t("workflow.refresh")}><FiRefreshCw aria-hidden="true" /></button>
          </div>
        </div>
        <div className="workflow-report-filters">
          <label className="workflow-report-search">
            <FiSearch aria-hidden="true" />
            <input
              value={searchInput}
              aria-label={t("workflow.searchRecords")}
              placeholder={t("workflow.searchRecords")}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  setOffset(0);
                  setSearch(searchInput);
                }
              }}
            />
            <button type="button" onClick={() => { setOffset(0); setSearch(searchInput); }}>{t("workflow.applyFilters")}</button>
          </label>
          {[
            ["state_id", "states", "state_id", "state_name", "state"],
            ["district_id", "districts", "district_id", "district_name", "district"],
            ["circle_id", "circles", "circle_id", "circle_name", "circle"],
            ["division_id", "divisions", "division_id", "division_name", "division"],
            ["range_id", "ranges", "range_id", "range_name", "range"],
          ].filter(([filterKey]) => locationFilterFields.includes(filterKey))
            .map(([filterKey, optionsKey, idKey, nameKey, labelKey]) => (
            <label key={filterKey}>
              <span>{t(`workflow.fields.${labelKey}`)}</span>
              <select
                value={locationFilters[filterKey]}
                onChange={(event) => {
                  const next = { ...locationFilters, [filterKey]: event.target.value };
                  const dependent = {
                    state_id: ["district_id", "circle_id", "division_id", "range_id"],
                    district_id: [],
                    circle_id: ["division_id", "range_id"],
                    division_id: ["range_id"],
                  }[filterKey] || [];
                  dependent.forEach((key) => { next[key] = ""; });
                  setLocationFilters(next);
                  setOffset(0);
                }}
              >
                <option value="">{t("workflow.allLocations")}</option>
                {(lookups[optionsKey] || []).map((option) => (
                  <option key={option[idKey]} value={option[idKey]}>{option[nameKey]}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        {loading ? (
          <div className="workflow-loading"><Loader /><span>{t("workflow.loading")}</span></div>
        ) : records.length === 0 && !error ? (
          <div className="workflow-empty"><FiFileText aria-hidden="true" /><p>{t("workflow.noRecords")}</p></div>
        ) : records.length === 0 ? null : (
          <div className="workflow-table-wrap">
            <table className="workflow-table">
              <thead><tr>{tableColumns.map((column) => <th key={column}>{labelFromColumn(column, t)}</th>)}<th>{t("workflow.createdBy")}</th><th>{t("workflow.statusLabel")}</th>{showActions && <th>{t("workflow.actions")}</th>}</tr></thead>
                <tbody>
                  {records.map((record) => {
                    const rowId = record[primaryKey];
                    const rowStatus = record[statusColumn];
                    const canDelete = record.can_delete === true;
                  return (
                    <tr
                      key={rowId}
                      className="workflow-table__clickable"
                      tabIndex={0}
                      onClick={() => navigate(`/internal/records/${module}/${rowId}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") navigate(`/internal/records/${module}/${rowId}`);
                      }}
                    >
                      {tableColumns.map((column) => <td key={column}>{displayValue(record, column)}</td>)}
                      <td>{record.created_by || "—"}</td>
                      <td><span className={`workflow-status workflow-status--${rowStatus || "legacy"}`}>{t(`workflow.status.${({ P: "pending", A: "approved", R: "rejected" })[rowStatus] || "legacy"}`)}</span></td>
                      {showActions && <td className="workflow-table__actions">
                        {canDelete && <button
                          type="button"
                          className="workflow-table__delete"
                          disabled={deletingRecordId !== null}
                          aria-label={t("workflow.deleteRecord")}
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteRecord(rowId);
                          }}
                        ><FiTrash2 aria-hidden="true" /> {t("workflow.deleteRecord")}</button>}
                      </td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && count > 0 && (
          <footer className="workflow-report-pagination">
            <span>{t("workflow.directory.pageSummary", { start: offset + 1, end: Math.min(offset + records.length, count), count })}</span>
            <div>
              <button type="button" onClick={() => setOffset(Math.max(0, offset - 100))} disabled={offset === 0}>{t("workflow.directory.previous")}</button>
              <button type="button" onClick={() => setOffset(offset + 100)} disabled={offset + records.length >= count}>{t("workflow.directory.next")}</button>
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}

export function WorkflowRecordDetail() {
  const { module, recordId } = useParams();
  const { t } = useTranslation();
  const currentUser = useMemo(() => getStoredUser(), []);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [recommendationText, setRecommendationText] = useState("");
  const [requestedFields, setRequestedFields] = useState([]);
  const [correctionChanges, setCorrectionChanges] = useState({});
  const [reviewLookups, setReviewLookups] = useState({});
  const [correcting, setCorrecting] = useState(false);
  const [error, setError] = useState("");
  const [position, setPosition] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data: result } = await api.get(`workflow/records/${module}/${recordId}/`);
        if (!mounted) return;
        setData(result);
        const record = result.record || {};
        const pendingRecommendation = result.pending_recommendation;
        if (pendingRecommendation) {
          const fieldsByName = Object.fromEntries(
            (result.review_fields || []).map((field) => [field.name, field])
          );
          setCorrectionChanges(Object.fromEntries(
            (pendingRecommendation.requested_fields || []).map((name) => [
              name,
              record[fieldsByName[name]?.column] ?? "",
            ])
          ));
        } else {
          setCorrectionChanges({});
        }
        if (result.can_correct) {
          const query = new URLSearchParams({ module });
          const prefix = Object.keys(record).find((key) => /_State_ID$/.test(key))?.split("_")[0];
          [
            ["state_id", "State_ID"],
            ["district_id", "District_ID"],
            ["circle_id", "Circle_ID"],
            ["division_id", "Division_ID"],
            ["range_id", "Range_ID"],
          ].forEach(([queryName, suffix]) => {
            const value = prefix && record[`${prefix}_${suffix}`];
            if (value != null) query.set(queryName, String(value));
          });
          const { data: lookups } = await api.get(`workflow/lookups/?${query}`);
          if (mounted) setReviewLookups(lookups);
        }
        const latitudeColumn = Object.keys(record).find((key) => /Latitude$/i.test(key));
        const longitudeColumn = Object.keys(record).find((key) => /Longitude$/i.test(key));
        const related = record.related_nursery_location;
        const latitude = Number(latitudeColumn ? record[latitudeColumn] : related?.latitude);
        const longitude = Number(longitudeColumn ? record[longitudeColumn] : related?.longitude);
        if (Number.isFinite(latitude) && Number.isFinite(longitude) &&
            latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 &&
            !(latitude === 0 && longitude === 0)) {
          setPosition([latitude, longitude]);
        } else {
          setPosition(null);
        }
      } catch (requestError) {
        if (mounted) setError(requestError.message || t("workflow.loadError"));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [module, recordId, t]);

  if (loading) {
    return <main className="workflow-page"><div className="workflow-loading"><Loader /><span>{t("workflow.loading")}</span></div></main>;
  }
  if (error || !data) {
    return (
      <main className="workflow-page">
        <div className="workflow-alert" role="alert">{error || t("workflow.loadError")}</div>
        <Link className="workflow-back" to={`/internal/reports/${module}`}>{t("workflow.backToReport")}</Link>
      </main>
    );
  }

  const record = data.record || {};
  const workflow = data.workflow || {};
  const statusKey = { P: "pending", A: "approved", R: "rejected" }[workflow.status] || "legacy";
  const hierarchy = ["national", "state", "circle", "dfo", "ro"];
  const titleColumn = Object.keys(record).find((key) => /_(Name|UniqueCode)$/.test(key));
  const title = (titleColumn && (record.display_values?.[titleColumn] || record[titleColumn])) ||
    t("workflow.recordDetails");
  const detailColumns = Object.keys(record).filter((key) =>
    key !== "display_values" && key !== "related_nursery_location"
  );
  const submitTechnicalReview = async (event) => {
    event.preventDefault();
    setReviewing(true);
    setError("");
    try {
      await api.post(`workflow/records/${module}/${recordId}/technical-review/`, {
        recommendation: recommendationText,
        fields: requestedFields,
      });
      const { data: refreshed } = await api.get(`workflow/records/${module}/${recordId}/`);
      setData(refreshed);
      setRecommendationText("");
      setRequestedFields([]);
    } catch (requestError) {
      setError(requestError.message || t("workflow.saveError"));
    } finally {
      setReviewing(false);
    }
  };
  const saveRecommendedCorrections = async (event) => {
    event.preventDefault();
    setCorrecting(true);
    setError("");
    try {
      await api.patch(`workflow/records/${module}/${recordId}/`, {
        changes: correctionChanges,
      });
      const { data: refreshed } = await api.get(`workflow/records/${module}/${recordId}/`);
      setData(refreshed);
    } catch (requestError) {
      setError(requestError.message || t("workflow.saveError"));
    } finally {
      setCorrecting(false);
    }
  };
  const correctionFieldOptions = (field) => {
    let options = reviewLookups[field.options] || [];
    if (field.options === "sources") {
      const sourceTypeColumn = Object.keys(record).find((column) => /_Seed_Source_Type$/.test(column));
      const sourceType = sourceTypeColumn && record[sourceTypeColumn];
      if (sourceType) options = options.filter((option) => option.type === sourceType);
    }
    const idKey = technicalLookupIdKeys[field.options] || "id";
    const nameKey = technicalLookupNameKeys[field.options] || "name";
    return options.map((option) => ({
      id: option[idKey] ?? option.id,
      name: option[nameKey] ?? option.name ?? String(option[idKey] ?? option.id),
      type: option.type,
    }));
  };
  const reviewFieldsByName = Object.fromEntries(
    (data.review_fields || []).map((field) => [field.name, field])
  );
  const currentPendingRecommendation = data.pending_recommendation;
  const mapPhotoUrl = getNurseryPhotoUrl({
    Nursery_PHOTO: record.Nursery_PHOTO || record.related_nursery_location?.photo,
  });
  const mapTitle = record.related_nursery_location?.name || title;

  return (
    <main className="workflow-page workflow-detail">
      <div className="workflow-page__topline">
        <Link className="workflow-back" to={`/internal/reports/${module}`}>{t("workflow.backToReport")}</Link>
        <span>{t(`workflow.modules.${module}`)}</span>
      </div>
      <section className="workflow-module-heading">
        <span className="workflow-eyebrow"><FiFileText aria-hidden="true" /> {t("workflow.recordDetails")}</span>
        <h1>{title}</h1>
        <p>{t("workflow.fields.recordId")}: {record[workflowModuleKeys[module]?.[0]] || recordId}</p>
      </section>

      <section className="workflow-detail__status">
        <div>
          <span>{t("workflow.statusLabel")}</span>
          <strong className={`workflow-status workflow-status--${workflow.status || "legacy"}`}>{t(`workflow.status.${statusKey}`)}</strong>
        </div>
        <div>
          <span>{t("workflow.submissionAndReview")}</span>
          <p>{workflow.status === "P" ? t("workflow.approvalQueue") : t("workflow.noReviewHistory")}</p>
        </div>
        {SILVICULTURIST_REVIEW_MODULES.has(module) && (
          <div>
            <span>{t("workflow.technicalReview")}</span>
            <p>{workflow.technical_reviewed
              ? t("workflow.technicalReviewedBy", {
                name: workflow.technical_reviewed_by?.name || t("workflow.unknownActor"),
              })
              : t(workflow.status === "P"
                ? "workflow.technicalReviewPending"
                : "workflow.technicalReviewNotRecorded")}</p>
          </div>
        )}
      </section>

      {SILVICULTURIST_REVIEW_MODULES.has(module) && (
        <section className="workflow-detail__section">
          <h2>{t("workflow.technicalReview")}</h2>
          {currentUser?.workflow_role === "silviculturist" && workflow.status === "P" && (
            <form className="workflow-detail__review-form" onSubmit={submitTechnicalReview}>
              <label>
                {t("workflow.technicalRecommendation")}
                <textarea
                  value={recommendationText}
                  onChange={(event) => setRecommendationText(event.target.value)}
                  maxLength={8000}
                  required
                />
              </label>
              <fieldset>
                <legend>{t("workflow.fieldsRequestedForCorrection")}</legend>
                <p>{t("workflow.fieldsRequestedHelp")}</p>
                <div className="workflow-detail__review-fields">
                  {(data.review_fields || []).map((field) => (
                    <label key={field.name}>
                      <input
                        type="checkbox"
                        checked={requestedFields.includes(field.name)}
                        onChange={(event) => setRequestedFields((current) => (
                          event.target.checked
                            ? [...current, field.name]
                            : current.filter((name) => name !== field.name)
                        ))}
                      />
                      {labelFromColumn(field.column, t)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <button type="submit" className="workflow-button" disabled={reviewing}>
                {reviewing ? t("workflow.saving") : t("workflow.submitTechnicalRecommendation")}
              </button>
            </form>
          )}
          {data.technical_reviews?.length ? (
            <div className="workflow-detail__recommendations">
              {data.technical_reviews.map((item) => (
                <article key={item.id}>
                  <header>
                    <strong>{t("workflow.technicalRecommendation")}</strong>
                    <span>{item.reviewed_by} · {new Date(item.created_at).toLocaleString()}</span>
                  </header>
                  <p>{item.recommendation}</p>
                  {!!item.requested_fields?.length && (
                    <p><strong>{t("workflow.fieldsRequestedForCorrection")}:</strong>{" "}
                      {item.requested_fields.map((name) => (
                        labelFromColumn(reviewFieldsByName[name]?.column || name, t)
                      )).join(", ")}
                    </p>
                  )}
                  {item.addressed_at && (
                    <div className="workflow-detail__correction-note">
                      <strong>{t("workflow.correctionsSavedBy", { name: item.addressed_by })}</strong>
                      {Object.entries(item.correction_values || {}).map(([name, value]) => (
                        <span key={name}>
                          {labelFromColumn(reviewFieldsByName[name]?.column || name, t)}: {String(value ?? "—")}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="workflow-detail__note">{t("workflow.noTechnicalRecommendations")}</p>
          )}
        </section>
      )}

      {data.can_correct && currentPendingRecommendation && (
        <section className="workflow-detail__section">
          <h2>{t("workflow.correctRequestedFields")}</h2>
          <p className="workflow-detail__note">{currentPendingRecommendation.recommendation}</p>
          <form className="workflow-detail__review-form" onSubmit={saveRecommendedCorrections}>
            {currentPendingRecommendation.requested_fields.map((name) => {
              const field = reviewFieldsByName[name];
              if (!field) return null;
              const value = correctionChanges[name] ?? "";
              if (field.type === "select") {
                const options = correctionFieldOptions(field);
                return (
                  <label key={name}>
                    {labelFromColumn(field.column, t)}
                    <select
                      value={String(value)}
                      onChange={(event) => setCorrectionChanges((current) => ({
                        ...current,
                        [name]: event.target.value,
                      }))}
                      required={field.required}
                    >
                      <option value="">{t("workflow.selectOption")}</option>
                      {options.map((option) => (
                        <option key={`${option.type || field.options}-${option.id}`} value={option.id}>{option.name}</option>
                      ))}
                    </select>
                  </label>
                );
              }
              return (
                <label key={name}>
                  {labelFromColumn(field.column, t)}
                  {field.type === "text" && value.length > 100
                    ? <textarea value={value} maxLength={2000} required={field.required} onChange={(event) => setCorrectionChanges((current) => ({ ...current, [name]: event.target.value }))} />
                    : <input
                      type={field.type === "date" || field.type === "number" ? field.type : "text"}
                      value={value == null ? "" : String(value)}
                      required={field.required}
                      onChange={(event) => setCorrectionChanges((current) => ({
                        ...current,
                        [name]: event.target.value,
                      }))}
                    />}
                </label>
              );
            })}
            <button type="submit" className="workflow-button" disabled={correcting}>
              {correcting ? t("workflow.saving") : t("workflow.saveRequestedCorrections")}
            </button>
          </form>
        </section>
      )}

      <section className="workflow-detail__section">
        <h2>{t("workflow.detailCardTitle")}</h2>
        <dl className="workflow-detail__grid">
          {detailColumns.map((column) => {
            const value = record.display_values?.[column] ?? record[column];
            if (value == null || value === "") return null;
            const shown = ({ P: t("workflow.status.pending"), A: t("workflow.status.approved"), R: t("workflow.status.rejected") })[value] ||
              (column.endsWith("_Status") ? t("workflow.status.legacy") : String(value));
            return (
              <div key={column}>
                <dt>{labelFromColumn(column, t)}</dt>
                <dd>{shown}</dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section className="workflow-detail__section">
        <h2><FiShield aria-hidden="true" /> {t("workflow.approvalHierarchy")}</h2>
        <p className="workflow-detail__note">{t("workflow.singleDecisionNote")}</p>
        <ol className="workflow-detail__hierarchy">
          {hierarchy.map((role) => (
            <li key={role}>
              <span>{t(`workflow.roles.${role}`)}</span>
              {workflow.submitted_by?.role === role && <b>{t("workflow.submittedByRole")}: {workflow.submitted_by.name || workflow.submitted_by.id}</b>}
              {workflow.reviewed_by?.role === role && <b>{t("workflow.latestReviewer")}: {workflow.reviewed_by.name || workflow.reviewed_by.id}</b>}
            </li>
          ))}
        </ol>
        <h3>{t("workflow.reviewHistory")}</h3>
        {workflow.history?.length ? (
          <ol className="workflow-detail__history">
            {workflow.history.map((item, index) => (
              <li key={`${item.action}-${index}`}>
                <strong>{t(`workflow.historyActions.${item.action}`)}</strong>
                <span>{item.actor?.name || (item.actor?.id ? `#${item.actor.id}` : t("workflow.unknownActor"))}</span>
                {item.actor?.role && <span>{t(`workflow.roles.${item.actor.role}`)}</span>}
                {item.at && <time>{new Date(item.at).toLocaleString()}</time>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="workflow-detail__note">{t("workflow.noReviewHistory")}</p>
        )}
      </section>

      <section className="workflow-detail__section">
        <h2><FiMapPin aria-hidden="true" /> {t("workflow.recordMap")}</h2>
        {position ? (
          <>
            <div className="workflow-detail__map">
              <MapContainer center={position} zoom={13} scrollWheelZoom className="workflow-detail__map-canvas">
                <SatelliteTileLayer />
                <CircleMarker center={position} radius={10}>
                  <Popup>
                    <article className="workflow-nursery-popup">
                      {mapPhotoUrl && <img src={mapPhotoUrl} alt={mapTitle} />}
                      <strong>{mapTitle}</strong>
                      {record.related_nursery_location?.address && <span>{record.related_nursery_location.address}</span>}
                      <span>{position.join(", ")}</span>
                    </article>
                  </Popup>
                </CircleMarker>
              </MapContainer>
            </div>
            <a className="workflow-detail__map-link" href={`https://www.google.com/maps/search/?api=1&query=${position.join(",")}`} target="_blank" rel="noreferrer">
              {position.join(", ")}
            </a>
          </>
        ) : (
          <p className="workflow-detail__note">{t("workflow.noRecordCoordinates")}</p>
        )}
        {record.related_nursery_location?.name && (
          <p>{t("workflow.relatedNursery")}: {record.related_nursery_location.name} · {record.related_nursery_location.address || ""}</p>
        )}
      </section>
    </main>
  );
}

const SILVICULTURIST_REVIEW_MODULES = new Set(silviculturistModules);

export default WorkflowModulePage;
