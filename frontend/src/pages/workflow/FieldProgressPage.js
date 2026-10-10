import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiCamera, FiMapPin, FiPlus, FiRefreshCw } from "react-icons/fi";
import { CircleMarker, MapContainer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import api from "../../services/api";
import SatelliteTileLayer from "../../components/Map/SatelliteTileLayer";
import Loader from "../../components/common/Loader";
import "./FieldProgressPage.css";

const initialSpecies = {
  species: "",
  plant_count: "",
  planting_year: "",
  age_years: "",
  height_cm: "",
  girth_cm: "",
  growth_since_last_cm: "",
  alive: "",
  dead: "",
};

const emptyAssessment = {
  category: "satisfactory",
  reasons: "",
  recommendations: "",
  scientific_assessment: "",
};

const requestErrorMessage = (error, fallback) => {
  const responseData = error?.response?.data;
  if (typeof responseData === "string") return responseData;
  if (responseData && typeof responseData === "object") {
    if (typeof responseData.detail === "string") return responseData.detail;
    const messages = Object.values(responseData)
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .filter((value) => typeof value === "string");
    if (messages.length) return messages.join(" ");
  }
  return error?.message || fallback;
};

function FieldProgressPage() {
  const { t } = useTranslation();
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userData") || "null");
    } catch {
      return null;
    }
  }, []);
  const role = user?.workflow_role || "ro";
  const isRo = role === "ro";
  const isSilviculturist = role === "silviculturist";
  const [dashboard, setDashboard] = useState(null);
  const [sites, setSites] = useState([]);
  const [assessmentSites, setAssessmentSites] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportsNextOffset, setReportsNextOffset] = useState(null);
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedAssessmentSite, setSelectedAssessmentSite] = useState("");
  const [gps, setGps] = useState(null);
  const [speciesRows, setSpeciesRows] = useState([{ ...initialSpecies }]);
  const [assessment, setAssessment] = useState(emptyAssessment);
  const [assessmentGps, setAssessmentGps] = useState(null);
  const [assessmentPhoto, setAssessmentPhoto] = useState(null);
  const [assessmentPhotoKey, setAssessmentPhotoKey] = useState(0);
  const [form, setForm] = useState({
    inspection_date: new Date().toISOString().slice(0, 10),
    planted_last_3_months: "",
    plants_alive: "",
    plants_dead: "",
    seedlings_produced: "",
    seedlings_available: "",
    seedlings_distributed: "",
    seed_source: "",
    seed_quantity_kg: "",
    seed_collection_date: "",
    issues: "",
  });
  const [photo, setPhoto] = useState(null);
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: dashboardData } = await api.get("workflow/progress/dashboard/");
      const periodQuery = new URLSearchParams({
        period_start: dashboardData.period.start,
        period_end: dashboardData.period.end,
      }).toString();
      const requests = [
        api.get(`workflow/progress/reports/?limit=100&${periodQuery}`),
        api.get("workflow/progress/site-assessments/"),
      ];
      if (isRo) requests.push(api.get(`workflow/progress/sites/?${periodQuery}`));
      const responses = await Promise.all(requests);
      setDashboard(dashboardData);
      setReports(responses[0].data.reports || []);
      setReportsNextOffset(responses[0].data.next_offset);
      setAssessmentSites(responses[1].data.sites || []);
      if (isRo) setSites(responses[2].data.sites || []);
      setForm((current) => ({
        ...current,
        inspection_date:
          current.inspection_date >= dashboardData.period.start
          && current.inspection_date <= dashboardData.period.end
            ? current.inspection_date
            : dashboardData.period.end,
      }));
    } catch (requestError) {
      setError(requestErrorMessage(requestError, t("workflow.progress.loadError")));
    } finally {
      setLoading(false);
    }
  }, [isRo, t]);

  const loadMoreReports = async () => {
    if (reportsNextOffset == null || !dashboard?.period) return;
    setError("");
    try {
      const query = new URLSearchParams({
        period_start: dashboard.period.start,
        period_end: dashboard.period.end,
        limit: "100",
        offset: String(reportsNextOffset),
      });
      const { data } = await api.get(`workflow/progress/reports/?${query}`);
      setReports((current) => [...current, ...(data.reports || [])]);
      setReportsNextOffset(data.next_offset);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, t("workflow.progress.loadError")));
    }
  };

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const siteOptions = useMemo(
    () => sites.filter((site) => !site.already_reported),
    [sites]
  );
  const pendingTechnicalReviews = sites.filter(
    (site) => site.technical_review_required && !site.technical_review_complete
  );
  const reportBlockedByTechnicalReview = pendingTechnicalReviews.length > 0;
  const gpsAccuracyInvalid = gps && (
    !Number.isFinite(gps.accuracy) || gps.accuracy < 0 || gps.accuracy > 200
  );
  const assessmentGpsAccuracyInvalid = assessmentGps && (
    !Number.isFinite(assessmentGps.accuracy)
    || assessmentGps.accuracy < 0
    || assessmentGps.accuracy > 200
  );

  const captureLocation = (saveLocation = setGps) => {
    if (!navigator.geolocation) {
      setError(t("workflow.progress.gpsUnavailable"));
      return;
    }
    setCapturing(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        saveLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
        setCapturing(false);
      },
      () => {
        setError(t("workflow.progress.gpsFailed"));
        setCapturing(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const submitReport = async (event) => {
    event.preventDefault();
    const [module, recordId] = selectedSite.split(":");
    if (!module || !recordId || !gps || !photo) {
      setError(t("workflow.progress.completeEvidence"));
      return;
    }
    if (gpsAccuracyInvalid) {
      setError(t("workflow.progress.gpsAccuracyTooLow"));
      return;
    }
    const rows = speciesRows.filter((row) => row.species.trim());
    if (!rows.length) {
      setError(t("workflow.progress.addSpecies"));
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = new FormData();
      payload.append("site_module", module);
      payload.append("site_record_id", recordId);
      payload.append("period_start", dashboard.period.start);
      payload.append("period_end", dashboard.period.end);
      payload.append("captured_latitude", String(gps.latitude));
      payload.append("captured_longitude", String(gps.longitude));
      payload.append("gps_accuracy_m", String(gps.accuracy));
      payload.append("field_photo", photo);
      payload.append("inspection_date", form.inspection_date);
      payload.append("species_details", JSON.stringify(rows.map((row) => ({
        ...row,
        plant_count: Number(row.plant_count || 0),
        planting_year: row.planting_year ? Number(row.planting_year) : null,
        age_years: row.age_years ? Number(row.age_years) : null,
        height_cm: row.height_cm ? Number(row.height_cm) : null,
        girth_cm: row.girth_cm ? Number(row.girth_cm) : null,
        growth_since_last_cm: row.growth_since_last_cm ? Number(row.growth_since_last_cm) : null,
        alive: Number(row.alive || 0),
        dead: Number(row.dead || 0),
      }))));
      [
        "planted_last_3_months",
        "plants_alive",
        "plants_dead",
        "seedlings_produced",
        "seedlings_available",
        "seedlings_distributed",
        "seed_source",
        "seed_quantity_kg",
        "seed_collection_date",
      ].forEach((field) => payload.append(field, form[field] || ""));
      payload.append("issues", JSON.stringify(form.issues.trim()
        ? [{ type: "field_issue", details: form.issues.trim() }]
        : []));
      await api.post("workflow/progress/reports/", payload, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      setNotice(t("workflow.progress.reportSubmitted"));
      setSelectedSite("");
      setPhoto(null);
      setPhotoInputKey((key) => key + 1);
      setGps(null);
      setSpeciesRows([{ ...initialSpecies }]);
      await loadPage();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, t("workflow.progress.submitError")));
    } finally {
      setSaving(false);
    }
  };

  const openReport = async (report) => {
    setSelectedReport(null);
    setError("");
    try {
      const { data } = await api.get(`workflow/progress/reports/${report.id}/`);
      setSelectedReport(data.report);
      setAssessment(emptyAssessment);
      setAssessmentGps(null);
      setAssessmentPhoto(null);
      setAssessmentPhotoKey((key) => key + 1);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, t("workflow.progress.loadError")));
    }
  };

  const submitAssessment = async (event) => {
    event.preventDefault();
    if (!selectedReport) return;
    if (assessment.field_inspection && (!assessmentGps || !assessmentPhoto)) {
      setError(t("workflow.progress.completeEvidence"));
      return;
    }
    if (assessment.field_inspection && assessmentGpsAccuracyInvalid) {
      setError(t("workflow.progress.gpsAccuracyTooLow"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = assessment.field_inspection ? new FormData() : { ...assessment };
      if (assessment.field_inspection) {
        Object.entries(assessment).forEach(([key, value]) => {
          payload.append(key, String(value));
        });
        payload.append("captured_latitude", String(assessmentGps.latitude));
        payload.append("captured_longitude", String(assessmentGps.longitude));
        payload.append("gps_accuracy_m", String(assessmentGps.accuracy));
        payload.append("field_photo", assessmentPhoto);
      }
      await api.post(
        `workflow/progress/reports/${selectedReport.id}/assessment/`,
        payload,
        assessment.field_inspection
          ? {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 120000,
          }
          : undefined
      );
      setNotice(t("workflow.progress.assessmentSaved"));
      await openReport({ id: selectedReport.id });
      await loadPage();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, t("workflow.progress.submitError")));
    } finally {
      setSaving(false);
    }
  };

  const submitApprovedSiteAssessment = async (event) => {
    event.preventDefault();
    const site = assessmentSites.find(
      (item) => `${item.module}:${item.record_id}` === selectedAssessmentSite
    );
    if (!site) return;
    if (assessment.field_inspection && (!assessmentGps || !assessmentPhoto)) {
      setError(t("workflow.progress.completeEvidence"));
      return;
    }
    if (assessment.field_inspection && assessmentGpsAccuracyInvalid) {
      setError(t("workflow.progress.gpsAccuracyTooLow"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = assessment.field_inspection
        ? new FormData()
        : {
          ...assessment,
          site_module: site.module,
          site_record_id: String(site.record_id),
        };
      if (assessment.field_inspection) {
        Object.entries(assessment).forEach(([key, value]) => {
          payload.append(key, String(value));
        });
        payload.append("captured_latitude", String(assessmentGps.latitude));
        payload.append("captured_longitude", String(assessmentGps.longitude));
        payload.append("gps_accuracy_m", String(assessmentGps.accuracy));
        payload.append("field_photo", assessmentPhoto);
        payload.append("site_module", site.module);
        payload.append("site_record_id", String(site.record_id));
      }
      await api.post("workflow/progress/site-assessments/", payload, assessment.field_inspection
        ? {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000,
        }
        : undefined);
      setNotice(t("workflow.progress.assessmentSaved"));
      setAssessment(emptyAssessment);
      setAssessmentGps(null);
      setAssessmentPhoto(null);
      setAssessmentPhotoKey((key) => key + 1);
      await loadPage();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, t("workflow.progress.submitError")));
    } finally {
      setSaving(false);
    }
  };

  const updateSpecies = (index, field, value) => {
    setSpeciesRows((current) => current.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [field]: value } : row
    ));
  };

  const currentSite = sites.find((site) => `${site.module}:${site.record_id}` === selectedSite);
  const completion = dashboard?.completion;
  const progress = dashboard?.rankings || {};

  if (loading) {
    return <div className="progress-loading"><Loader /><span>{t("workflow.progress.loading")}</span></div>;
  }

  return (
    <main className="workflow-page field-progress">
      <div className="field-progress__topline">
        <Link to="/internal/dashboard"><FiArrowLeft aria-hidden="true" />{t("workflow.backToDashboard")}</Link>
        <button type="button" onClick={loadPage} disabled={loading}>
          <FiRefreshCw aria-hidden="true" />{t("workflow.refresh")}
        </button>
      </div>
      <section className="workflow-welcome">
        <div className="workflow-welcome__copy">
          <span className="workflow-eyebrow">{t("workflow.progress.eyebrow")}</span>
          <h1>{t("workflow.progress.title")}</h1>
          <p>{t("workflow.progress.period", {
            start: dashboard?.period?.start || "",
            end: dashboard?.period?.end || "",
          })}</p>
        </div>
      </section>

      {error && <div className="workflow-alert" role="alert">{error}</div>}
      {notice && <div className="field-progress__notice" role="status">{notice}</div>}

      <section className="field-progress__summary" aria-label={t("workflow.progress.summary")}>
        <article><strong>{completion?.required_sites ?? 0}</strong><span>{t("workflow.progress.sites")}</span></article>
        <article><strong>{completion?.ro_completed ?? 0}</strong><span>{t("workflow.progress.roReports")}</span></article>
        <article><strong>{completion?.silviculturist_completed ?? 0}</strong><span>{t("workflow.progress.technicalReviews")}</span></article>
      </section>

      {dashboard?.overdue && dashboard.missing?.length > 0 && (
        <section className="field-progress__overdue" role="status" aria-labelledby="progress-overdue-title">
          <h2 id="progress-overdue-title">{t("workflow.progress.overdueTitle")}</h2>
          <p>{t("workflow.progress.overdueCount", { count: dashboard.missing.length })}</p>
          <ul className="field-progress__pending-list">{dashboard.missing.map((item, index) => (
            <li key={`${item.task || "report"}-${item.module}-${item.record_id}-${index}`}>
              <strong>{item.site_name || item.name}</strong>
              <span>{t(`workflow.modules.${item.module}`)}</span>
              <em>{t(`workflow.progress.tasks.${item.task || "ro_report"}`)}</em>
            </li>
          ))}</ul>
        </section>
      )}

      {isRo && (
        <section className="workflow-section field-progress__form-section">
          <div className="workflow-section__heading">
            <div><span>{t("workflow.progress.fieldEntry")}</span><h2>{t("workflow.progress.submitReport")}</h2></div>
          </div>
          {reportBlockedByTechnicalReview && (
            <div className="field-progress__overdue" role="status" aria-labelledby="pending-review-title">
              <h3 id="pending-review-title">{t("workflow.technicalReviewGate", { count: pendingTechnicalReviews.length })}</h3>
              <ul className="field-progress__pending-list">{pendingTechnicalReviews.map((site) => (
                <li key={`${site.module}:${site.record_id}`}>
                  <strong>{site.name}</strong>
                  <span>{t(`workflow.modules.${site.module}`)}</span>
                </li>
              ))}</ul>
            </div>
          )}
          <form className="field-progress__form" onSubmit={submitReport}>
            <label>
              {t("workflow.progress.site")}
              <select value={selectedSite} onChange={(event) => {
                const nextValue = event.target.value;
                setSelectedSite(nextValue);
                const nextSite = sites.find(
                  (site) => `${site.module}:${site.record_id}` === nextValue
                );
                const siteSpecies = [...new Set(
                  (nextSite?.species || [])
                    .map((species) => String(species).trim())
                    .filter(Boolean)
                    .filter((species, index, all) =>
                      all.findIndex((candidate) =>
                        candidate.toLocaleLowerCase() === species.toLocaleLowerCase()
                      ) === index
                    )
                )];
                setSpeciesRows(
                  siteSpecies.length
                    ? siteSpecies.map((species) => ({ ...initialSpecies, species }))
                    : [{ ...initialSpecies }]
                );
                setGps(null);
                setPhoto(null);
                setPhotoInputKey((key) => key + 1);
              }} required>
                <option value="">{t("workflow.progress.selectSite")}</option>
                {siteOptions.map((site) => (
                  <option
                    key={`${site.module}:${site.record_id}`}
                    value={`${site.module}:${site.record_id}`}
                    disabled={site.missing_coordinates}
                  >
                    {site.name} · {t(`workflow.modules.${site.module}`)}
                    {site.missing_coordinates ? ` — ${t("workflow.progress.noSiteGps")}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="field-progress__site-meta">
              {currentSite && [currentSite.state_name, currentSite.division_name, currentSite.range_name].filter(Boolean).join(" · ")}
              <button type="button" onClick={() => captureLocation()} disabled={!currentSite || capturing || currentSite.missing_coordinates}>
                <FiMapPin aria-hidden="true" />{capturing ? t("workflow.progress.locating") : t("workflow.progress.captureGps")}
              </button>
              {gps && <span className="field-progress__gps">{gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)} · ±{Math.round(gps.accuracy)} m</span>}
            </div>
            <div className="field-progress__grid">
              <label>{t("workflow.progress.inspectionDate")}<input type="date" value={form.inspection_date} onChange={(event) => setForm({ ...form, inspection_date: event.target.value })} required /></label>
              {[
                ["planted_last_3_months", "plantedLast3Months"],
                ["plants_alive", "plantsAlive"],
                ["plants_dead", "plantsDead"],
                ["seedlings_produced", "seedlingsProduced"],
                ["seedlings_available", "seedlingsAvailable"],
                ["seedlings_distributed", "seedlingsDistributed"],
              ].map(([name, label]) => (
                <label key={name}>{t(`workflow.progress.${label}`)}<input type="number" min="0" value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} /></label>
              ))}
              <label>{t("workflow.progress.seedSource")}<input value={form.seed_source} onChange={(event) => setForm({ ...form, seed_source: event.target.value })} /></label>
              <label>{t("workflow.progress.seedQuantity")}<input type="number" min="0" step="0.001" value={form.seed_quantity_kg} onChange={(event) => setForm({ ...form, seed_quantity_kg: event.target.value })} /></label>
              <label>{t("workflow.progress.seedCollectionDate")}<input type="date" value={form.seed_collection_date} onChange={(event) => setForm({ ...form, seed_collection_date: event.target.value })} /></label>
            </div>
            <div className="field-progress__species">
              <div className="field-progress__species-heading">
                <h3>{t("workflow.progress.speciesDetails")}</h3>
                <button type="button" onClick={() => setSpeciesRows((rows) => [...rows, { ...initialSpecies }])}><FiPlus aria-hidden="true" />{t("workflow.progress.addSpecies")}</button>
              </div>
              {speciesRows.map((row, index) => (
                <fieldset className="field-progress__species-row" key={index}>
                  <legend>{t("workflow.progress.speciesRow", { number: index + 1 })}</legend>
                  {[
                    ["species", "species", true],
                    ["plant_count", "plantCount", true],
                    ["planting_year", "plantingYear", true],
                    ["age_years", "ageYears"],
                    ["height_cm", "heightCm"],
                    ["girth_cm", "girthCm"],
                    ["growth_since_last_cm", "growthSinceLast"],
                    ["alive", "plantsAlive", true],
                    ["dead", "plantsDead", true],
                  ].map(([field, label, required = false]) => (
                    <label key={field}>{t(`workflow.progress.${label}`)}
                      <input
                        type={field === "species" ? "text" : "number"}
                        min={field === "species" ? undefined : "0"}
                        value={row[field]}
                        onChange={(event) => updateSpecies(index, field, event.target.value)}
                        required={required}
                      />
                    </label>
                  ))}
                  {speciesRows.length > 1 && (
                    <button type="button" className="field-progress__remove" onClick={() => setSpeciesRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}>
                      {t("workflow.progress.removeSpecies")}
                    </button>
                  )}
                </fieldset>
              ))}
            </div>
            <label>{t("workflow.progress.problems")}<textarea rows="3" value={form.issues} onChange={(event) => setForm({ ...form, issues: event.target.value })} /></label>
            <label className="field-progress__photo">
              <FiCamera aria-hidden="true" />{t("workflow.progress.sitePhoto")}
              <input key={photoInputKey} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => setPhoto(event.target.files?.[0] || null)} required />
              {photo && <span>{photo.name}</span>}
            </label>
            <button className="field-progress__submit" type="submit" disabled={saving || !gps || gpsAccuracyInvalid || !photo || !selectedSite || reportBlockedByTechnicalReview}>
              {saving ? t("workflow.progress.saving") : t("workflow.progress.submitReport")}
            </button>
            {reportBlockedByTechnicalReview && (
              <p className="field-progress__submit-hint" role="status">
                {t("workflow.technicalReviewGate", { count: pendingTechnicalReviews.length })}
              </p>
            )}
            {gpsAccuracyInvalid && (
              <p className="field-progress__submit-hint" role="status">
                {t("workflow.progress.gpsAccuracyTooLow")}
              </p>
            )}
          </form>
        </section>
      )}

      {(isSilviculturist || assessmentSites.length > 0) && (
        <section className="workflow-section field-progress__form-section">
          <div className="workflow-section__heading">
            <div>
              <span>{t("workflow.progress.eyebrow")}</span>
              <h2>{t("workflow.progress.approvedSiteAssessments")}</h2>
            </div>
          </div>
          {assessmentSites.length > 0 && (
            <>
              <label>
                {t("workflow.progress.site")}
                <select
                  value={selectedAssessmentSite}
                  onChange={(event) => {
                    setSelectedAssessmentSite(event.target.value);
                    setAssessment(emptyAssessment);
                    setAssessmentGps(null);
                    setAssessmentPhoto(null);
                    setAssessmentPhotoKey((key) => key + 1);
                  }}
                >
                  <option value="">{t("workflow.progress.selectApprovedSite")}</option>
                  {assessmentSites.map((site) => (
                    <option key={`${site.module}:${site.record_id}`} value={`${site.module}:${site.record_id}`}>
                      {site.name} · {t(`workflow.modules.${site.module}`)}
                    </option>
                  ))}
                </select>
              </label>
              {assessmentSites.find(
                (site) => `${site.module}:${site.record_id}` === selectedAssessmentSite
              )?.assessments.map((item) => (
                <article className="field-progress__assessment-card" key={item.id}>
                  <strong>{t(`workflow.progress.categories.${item.category}`)} · {item.assessed_by}</strong>
                  <p>{item.reasons}</p>
                  <p>{item.recommendations}</p>
                  {item.scientific_assessment && <p>{item.scientific_assessment}</p>}
                  {item.field_inspection && (
                    <p>{t("workflow.progress.gpsVerified")}: {item.captured_latitude}, {item.captured_longitude} · {item.distance_m} m</p>
                  )}
                  {item.field_photo && <img className="field-progress__detail-photo" src={item.field_photo} alt={t("workflow.progress.sitePhoto")} />}
                </article>
              ))}
              {isSilviculturist && selectedAssessmentSite && (
                <form className="field-progress__assessment-form" onSubmit={submitApprovedSiteAssessment}>
                  <h3>{t("workflow.progress.addAssessment")}</h3>
                  <label>{t("workflow.progress.assessment")}
                    <select value={assessment.category} onChange={(event) => setAssessment({ ...assessment, category: event.target.value })}>
                      {["satisfactory", "needs_improvement", "critical"].map((category) => <option key={category} value={category}>{t(`workflow.progress.categories.${category}`)}</option>)}
                    </select>
                  </label>
                  <label>{t("workflow.progress.reasons")}<textarea value={assessment.reasons} onChange={(event) => setAssessment({ ...assessment, reasons: event.target.value })} required /></label>
                  <label>{t("workflow.progress.recommendations")}<textarea value={assessment.recommendations} onChange={(event) => setAssessment({ ...assessment, recommendations: event.target.value })} required /></label>
                  <label>{t("workflow.progress.scientificAssessment")}<textarea value={assessment.scientific_assessment} onChange={(event) => setAssessment({ ...assessment, scientific_assessment: event.target.value })} /></label>
                  <label className="field-progress__checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(assessment.field_inspection)}
                      onChange={(event) => {
                        setAssessment({ ...assessment, field_inspection: event.target.checked });
                        setAssessmentGps(null);
                        setAssessmentPhoto(null);
                        setAssessmentPhotoKey((key) => key + 1);
                      }}
                    />
                    {t("workflow.progress.fieldInspection")}
                  </label>
                  {assessment.field_inspection && (
                    <div className="field-progress__site-meta">
                      <button type="button" onClick={() => captureLocation(setAssessmentGps)} disabled={capturing}>
                        <FiMapPin aria-hidden="true" />{capturing ? t("workflow.progress.locating") : t("workflow.progress.captureGps")}
                      </button>
                      {assessmentGps && <span className="field-progress__gps">{assessmentGps.latitude.toFixed(6)}, {assessmentGps.longitude.toFixed(6)} · ±{Math.round(assessmentGps.accuracy)} m</span>}
                      <label className="field-progress__photo">
                        <FiCamera aria-hidden="true" />{t("workflow.progress.sitePhoto")}
                        <input key={assessmentPhotoKey} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => setAssessmentPhoto(event.target.files?.[0] || null)} required />
                        {assessmentPhoto && <span>{assessmentPhoto.name}</span>}
                      </label>
                    </div>
                  )}
                  {assessment.field_inspection && assessmentGpsAccuracyInvalid && (
                    <p className="field-progress__submit-hint" role="status">
                      {t("workflow.progress.gpsAccuracyTooLow")}
                    </p>
                  )}
                  <button type="submit" disabled={saving || Boolean(assessment.field_inspection && assessmentGpsAccuracyInvalid)}>{saving ? t("workflow.progress.saving") : t("workflow.progress.saveAssessment")}</button>
                </form>
              )}
            </>
          )}
          {assessmentSites.length === 0 && (
            <p className="field-progress__empty">{t("workflow.progress.noApprovedSites")}</p>
          )}
        </section>
      )}

      <section className="workflow-section">
        <div className="workflow-section__heading">
          <div><span>{t("workflow.progress.recent")}</span><h2>{t(isSilviculturist ? "workflow.progress.reviewQueue" : "workflow.progress.reportHistory")}</h2></div>
        </div>
        {reports.length === 0 ? (
          <p className="field-progress__empty">{t("workflow.progress.noReports")}</p>
        ) : (
          <div className="field-progress__table-wrap">
            <table className="field-progress__table">
              <thead><tr>
                <th>{t("workflow.progress.site")}</th>
                <th>{t("workflow.progress.reportingPeriod")}</th>
                <th>{t("workflow.progress.submittedBy")}</th>
                <th>{t("workflow.progress.plantedLast3Months")}</th>
                <th>{t("workflow.progress.assessment")}</th>
              </tr></thead>
              <tbody>{reports.map((report) => (
                <tr key={report.id} onClick={() => openReport(report)} tabIndex={0} onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") openReport(report);
                }}>
                  <td>{report.site_name}<small>{t(`workflow.modules.${report.site_module}`)}</small></td>
                  <td>{report.period_start} – {report.period_end}</td>
                  <td>{report.submitted_by.name}</td>
                  <td>{report.planted_last_3_months}</td>
                  <td>{report.latest_assessment ? t(`workflow.progress.categories.${report.latest_assessment.category}`) : t("workflow.progress.awaitingAssessment")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {reportsNextOffset != null && (
          <button type="button" className="field-progress__load-more" onClick={loadMoreReports}>
            {t("workflow.progress.loadMore")}
          </button>
        )}
      </section>

      {Object.entries(progress).map(([level, rows]) => rows.length > 0 && (
        <section className="workflow-section field-progress__rankings" key={level}>
          <div className="workflow-section__heading">
            <div><span>{t("workflow.progress.last90Days")}</span><h2>{t(`workflow.progress.levels.${level}`)}</h2></div>
          </div>
          <div className="field-progress__table-wrap">
            <table className="field-progress__table">
              <thead><tr><th>{t("workflow.progress.rank")}</th><th>{t("workflow.progress.office")}</th><th>{t("workflow.progress.planted")}</th><th>{t("workflow.progress.survival")}</th><th>{t("workflow.progress.score")}</th></tr></thead>
              <tbody>{rows.map((row) => <tr key={`${level}-${row.office_id}`}>
                <td>{row.rank}</td><td>{row.office_name}</td><td>{row.planted_last_3_months}</td><td>{row.survival_percent}%</td><td>{row.combined_score}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </section>
      ))}

      {selectedReport && (
        <div className="field-progress__backdrop" role="presentation" onClick={() => setSelectedReport(null)}>
          <section className="field-progress__detail" role="dialog" aria-modal="true" aria-labelledby="progress-detail-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="field-progress__close" onClick={() => setSelectedReport(null)} aria-label={t("common.close")}>×</button>
            <h2 id="progress-detail-title">{selectedReport.site_name}</h2>
            <p>{selectedReport.scope?.state_name} · {selectedReport.scope?.circle_name} · {selectedReport.scope?.division_name} · {selectedReport.scope?.range_name}</p>
            <p>{t("workflow.progress.submittedBy")}: {selectedReport.submitted_by.name} · {selectedReport.inspection_date}</p>
            <p>{t("workflow.progress.gpsVerified")}: {selectedReport.site_location.latitude}, {selectedReport.site_location.longitude} · {selectedReport.site_location.distance_m} m</p>
            <MapContainer
              className="field-progress__map"
              center={[Number(selectedReport.site_location.latitude), Number(selectedReport.site_location.longitude)]}
              zoom={15}
              scrollWheelZoom={false}
            >
              <SatelliteTileLayer />
              <CircleMarker
                center={[Number(selectedReport.site_location.latitude), Number(selectedReport.site_location.longitude)]}
                radius={10}
                pathOptions={{ color: "#22613b", fillColor: "#4eae6d", fillOpacity: 0.85 }}
              />
              <CircleMarker
                center={[Number(selectedReport.site_location.captured_latitude), Number(selectedReport.site_location.captured_longitude)]}
                radius={7}
                pathOptions={{ color: "#bd6d22", fillColor: "#f0a64b", fillOpacity: 0.9 }}
              />
            </MapContainer>
            {selectedReport.field_photo && <img className="field-progress__detail-photo" src={selectedReport.field_photo} alt={t("workflow.progress.sitePhoto")} />}
            <section className="field-progress__comparison">
              <h3>{t("workflow.progress.summary")}</h3>
              <div className="field-progress__comparison-grid">
                {[
                  "planted_last_3_months",
                  "plants_alive",
                  "plants_dead",
                  "seedlings_produced",
                  "seedlings_available",
                  "seedlings_distributed",
                ].map((field) => (
                  <span key={field}>
                    {t(`workflow.progress.metrics.${field}`)}:{" "}
                    <strong>{selectedReport[field] ?? 0}</strong>
                  </span>
                ))}
              </div>
              <p>{t("workflow.progress.seedSource")}: <strong>{selectedReport.seed_source || "—"}</strong></p>
              <p>{t("workflow.progress.seedQuantity")}: <strong>{selectedReport.seed_quantity_kg ?? "—"}</strong></p>
              <p>{t("workflow.progress.seedCollectionDate")}: <strong>{selectedReport.seed_collection_date || "—"}</strong></p>
              {selectedReport.issues?.length > 0 && (
                <div>
                  <h4>{t("workflow.progress.problems")}</h4>
                  <ul>{selectedReport.issues.map((issue, index) => (
                    <li key={`${issue.type || "issue"}-${index}`}>{issue.details || issue.type}</li>
                  ))}</ul>
                </div>
              )}
            </section>
            <section className="field-progress__comparison">
              <h3>{t("workflow.progress.previousComparison")}</h3>
              {selectedReport.previous_comparison?.available ? (
                <>
                  <p>{selectedReport.previous_comparison.period_start} – {selectedReport.previous_comparison.period_end}</p>
                  <div className="field-progress__comparison-grid">
                    {Object.entries(selectedReport.previous_comparison.changes).map(([field, change]) => (
                      <span key={field}>{t(`workflow.progress.metrics.${field}`)}: <strong>{change > 0 ? "+" : ""}{change}</strong></span>
                    ))}
                  </div>
                  <h4>{t("workflow.progress.speciesComparison")}</h4>
                  <div className="field-progress__species-cards">
                    {selectedReport.previous_comparison.species_changes.map((item) => (
                      <article key={item.species}>
                        <strong>{item.species}</strong>
                        {item.previous_available
                          ? Object.entries(item.changes).map(([field, change]) => (
                            <span key={field}>{t(`workflow.progress.speciesMetrics.${field}`)}: {change > 0 ? "+" : ""}{change}</span>
                          ))
                          : <span>{t("workflow.progress.speciesNotInPrevious")}</span>}
                      </article>
                    ))}
                  </div>
                </>
              ) : <p>{t("workflow.progress.noPreviousReport")}</p>}
            </section>
            <h3>{t("workflow.progress.speciesDetails")}</h3>
            <div className="field-progress__species-cards">{selectedReport.species_details.map((item, index) => (
              <article key={`${item.species}-${index}`}>
                <strong>{item.species}</strong>
                <span>{t("workflow.progress.plantCount")}: {item.plant_count}</span>
                <span>{t("workflow.progress.plantingYear")}: {item.planting_year || "—"}</span>
                <span>{t("workflow.progress.ageYears")}: {item.age_years || "—"}</span>
                <span>{t("workflow.progress.heightCm")}: {item.height_cm || "—"}</span>
                <span>{t("workflow.progress.girthCm")}: {item.girth_cm || "—"}</span>
                <span>{t("workflow.progress.growthSinceLast")}: {item.growth_since_last_cm || "—"}</span>
                <span>{t("workflow.progress.plantsAlive")}: {item.alive} · {t("workflow.progress.plantsDead")}: {item.dead}</span>
              </article>
            ))}</div>
            {selectedReport.assessments?.map((item) => (
              <article className="field-progress__assessment-card" key={item.id}>
                <strong>{t(`workflow.progress.categories.${item.category}`)} · {item.assessed_by}</strong>
                <p>{item.reasons}</p><p>{item.recommendations}</p>
                {item.scientific_assessment && <p>{item.scientific_assessment}</p>}
                {item.field_inspection && (
                  <p>{t("workflow.progress.gpsVerified")}: {item.captured_latitude}, {item.captured_longitude} · {item.distance_m} m</p>
                )}
                {item.field_photo && <img className="field-progress__detail-photo" src={item.field_photo} alt={t("workflow.progress.sitePhoto")} />}
              </article>
            ))}
            {isSilviculturist && (
              <form className="field-progress__assessment-form" onSubmit={submitAssessment}>
                <h3>{t("workflow.progress.addAssessment")}</h3>
                <label>{t("workflow.progress.assessment")}
                  <select value={assessment.category} onChange={(event) => setAssessment({ ...assessment, category: event.target.value })}>
                    {["satisfactory", "needs_improvement", "critical"].map((category) => <option key={category} value={category}>{t(`workflow.progress.categories.${category}`)}</option>)}
                  </select>
                </label>
                <label>{t("workflow.progress.reasons")}<textarea value={assessment.reasons} onChange={(event) => setAssessment({ ...assessment, reasons: event.target.value })} required /></label>
                <label>{t("workflow.progress.recommendations")}<textarea value={assessment.recommendations} onChange={(event) => setAssessment({ ...assessment, recommendations: event.target.value })} required /></label>
                <label>{t("workflow.progress.scientificAssessment")}<textarea value={assessment.scientific_assessment} onChange={(event) => setAssessment({ ...assessment, scientific_assessment: event.target.value })} /></label>
                <label className="field-progress__checkbox">
                  <input
                    type="checkbox"
                    checked={Boolean(assessment.field_inspection)}
                    onChange={(event) => {
                      setAssessment({ ...assessment, field_inspection: event.target.checked });
                      setAssessmentGps(null);
                      setAssessmentPhoto(null);
                      setAssessmentPhotoKey((key) => key + 1);
                    }}
                  />
                  {t("workflow.progress.fieldInspection")}
                </label>
                {assessment.field_inspection && (
                  <div className="field-progress__site-meta">
                    <button type="button" onClick={() => captureLocation(setAssessmentGps)} disabled={capturing}>
                      <FiMapPin aria-hidden="true" />{capturing ? t("workflow.progress.locating") : t("workflow.progress.captureGps")}
                    </button>
                    {assessmentGps && <span className="field-progress__gps">{assessmentGps.latitude.toFixed(6)}, {assessmentGps.longitude.toFixed(6)} · ±{Math.round(assessmentGps.accuracy)} m</span>}
                    <label className="field-progress__photo">
                      <FiCamera aria-hidden="true" />{t("workflow.progress.sitePhoto")}
                      <input key={assessmentPhotoKey} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => setAssessmentPhoto(event.target.files?.[0] || null)} required />
                      {assessmentPhoto && <span>{assessmentPhoto.name}</span>}
                    </label>
                  </div>
                )}
                {assessment.field_inspection && assessmentGpsAccuracyInvalid && (
                  <p className="field-progress__submit-hint" role="status">
                    {t("workflow.progress.gpsAccuracyTooLow")}
                  </p>
                )}
                <button type="submit" disabled={saving || Boolean(assessment.field_inspection && assessmentGpsAccuracyInvalid)}>{saving ? t("workflow.progress.saving") : t("workflow.progress.saveAssessment")}</button>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

export default FieldProgressPage;
