import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapContainer, Marker } from "react-leaflet";
import api from "../../services/api";
import IndiaSatelliteMap from "../../components/Map/IndiaSatelliteMap";
import SatelliteTileLayer from "../../components/Map/SatelliteTileLayer";
import { getNurseryPhotoUrl } from "../../components/Map/NurseryDetailsModal";
import "leaflet/dist/leaflet.css";
import "./DashboardDetails.css";

const levels = ["state", "circle", "division", "range"];

function Metric({ label, value }) {
  return <article className="progress-detail-metric"><span>{label}</span><strong>{Number(value || 0).toLocaleString()}</strong></article>;
}

function FieldReportMap({ report, t }) {
  const latitude = Number(report.site_location?.latitude);
  const longitude = Number(report.site_location?.longitude);
  if (
    !Number.isFinite(latitude)
    || !Number.isFinite(longitude)
    || latitude < 5.5 || latitude > 38.8
    || longitude < 67 || longitude > 98.5
  ) {
    return <p className="progress-detail-empty">{t("dashboardDetails.noCoordinates")}</p>;
  }

  return (
    <div className="progress-report-map">
      <MapContainer center={[latitude, longitude]} zoom={14} scrollWheelZoom={false}>
        <SatelliteTileLayer />
        <Marker position={[latitude, longitude]} />
      </MapContainer>
    </div>
  );
}

function OfficeTable({ title, rows, onSelect, t }) {
  return (
    <section className="progress-office-section">
      <h3>{title}</h3>
      {rows?.length ? (
        <div className="progress-detail-table-wrap">
          <table className="progress-detail-table">
            <thead><tr>
              <th>{t("dashboardDetails.rank")}</th>
              <th>{t("dashboardDetails.office")}</th>
              <th>{t("dashboardDetails.planted")}</th>
              <th>{t("dashboardDetails.survival")}</th>
              <th>{t("dashboardDetails.score")}</th>
            </tr></thead>
            <tbody>{rows.map((row) => (
              <tr key={`${row.office_id}-${row.rank}`} onClick={() => onSelect(row)}>
                <td>#{row.rank}</td>
                <td>{row.office_name || t(`dashboardDetails.${title}`)}</td>
                <td>{Number(row.planted_last_3_months || 0).toLocaleString()}</td>
                <td>{Number(row.survival_percent || 0).toFixed(1)}%</td>
                <td>{Number(row.combined_score || 0).toFixed(1)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <p className="progress-detail-empty">{t("dashboardDetails.noOfficeData")}</p>}
    </section>
  );
}

function SilviculturistTable({ rows, restricted, t }) {
  return (
    <section className="progress-office-section">
      <h3>{t("dashboardDetails.levels.silviculturist")}</h3>
      {rows?.length ? (
        <div className="progress-detail-table-wrap">
          <table className="progress-detail-table">
            <thead><tr>
              <th>{t("dashboardDetails.rank")}</th>
              <th>{t("dashboardDetails.office")}</th>
              <th>{t("dashboardDetails.technicalReviews")}</th>
              <th>{t("dashboardDetails.satisfactory")}</th>
              <th>{t("dashboardDetails.critical")}</th>
            </tr></thead>
            <tbody>{rows.map((row) => (
              <tr key={`${row.office_id}-${row.rank}`}>
                <td>#{row.rank}</td>
                <td>{row.office_name}</td>
                <td>{row.reviews}</td>
                <td>{row.satisfactory}</td>
                <td>{row.critical}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : restricted ? (
        <p className="progress-detail-empty">
          {t("dashboardDetails.signInForSilviculturistRanking")}{" "}
          <Link to="/login/national">{t("navigation.login")}</Link>
        </p>
      ) : <p className="progress-detail-empty">{t("dashboardDetails.noOfficeData")}</p>}
    </section>
  );
}

function NurseryList({ t }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(null);
  useEffect(() => {
    let active = true;
    api.get("public-dashboard/nurseries/", { params: { limit: 50 } })
      .then(({ data }) => {
        if (active) {
          setItems(data.results || []);
          setNextOffset(data.next_offset);
        }
      })
      .catch((error) => console.error("Unable to load dashboard nursery details:", error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const loadMore = async () => {
    if (nextOffset === null || loadingMore) return;
    setLoadingMore(true);
    try {
      const { data } = await api.get("public-dashboard/nurseries/", {
        params: { limit: 50, offset: nextOffset },
      });
      setItems((current) => [...current, ...(data.results || [])]);
      setNextOffset(data.next_offset);
    } catch (error) {
      console.error("Unable to load more dashboard nursery details:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) return <p role="status">{t("dashboardDetails.loading")}</p>;
  return items.length ? <>
    <div className="progress-detail-table-wrap"><table className="progress-detail-table">
      <thead><tr><th>{t("map.photo")}</th><th>{t("nursery.nursery")}</th><th>{t("booking.state")}</th><th>{t("booking.district")}</th><th>{t("nursery.location")}</th><th /></tr></thead>
      <tbody>{items.map((item) => <tr key={item.id}>
        <td>{getNurseryPhotoUrl(item) ? <img className="dashboard-nursery-thumb" src={getNurseryPhotoUrl(item)} alt={item.name} /> : t("nursery.imageUnavailable")}</td>
        <td><Link to={`/our-nurseries?nursery=${item.id}`}>{item.name}</Link></td><td>{item.state}</td><td>{item.district || "—"}</td>
        <td>{item.address || item.location || "—"}</td>
        <td><Link to={`/our-nurseries?nursery=${item.id}`}>{t("nursery.viewDetails")} →</Link></td>
      </tr>)}</tbody>
    </table></div>
    {nextOffset !== null && <button className="progress-next-page" type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? t("dashboardDetails.loading") : t("nursery.loadMore")}</button>}
  </> : <p className="progress-detail-empty">{t("nursery.noResults")}</p>;
}

function DashboardDetails() {
  const { type, reportId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const level = searchParams.get("level") || "";
  const officeId = searchParams.get("office_id") || "";
  const stateId = searchParams.get("state_id") || (level === "state" ? officeId : "");
  const workflowScope = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("userData") || "null");
      return user?.workflow_role && user.workflow_role !== "national"
        ? user.workflow_scope
        : null;
    } catch {
      return null;
    }
  }, []);
  const visibleStateId = workflowScope?.state_id || stateId;
  const offset = searchParams.get("offset") || "0";

  useEffect(() => {
    if (type === "nurseries") return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api.get("public-dashboard/progress/", {
      params: {
        state_id: visibleStateId || undefined,
        level: level || undefined,
        office_id: officeId || undefined,
        report_id: reportId || undefined,
        offset,
        limit: 50,
      },
      signal: controller.signal,
    })
      .then(({ data: response }) => { if (!controller.signal.aborted) setData(response); })
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        console.error("Unable to load public progress dashboard:", requestError);
        setError(t("dashboardDetails.loadError"));
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [type, visibleStateId, level, officeId, reportId, offset, t]);

  const titleKey = type === "nurseries" ? "nurseries" : type;
  const selectOffice = (office, selectedLevel) => {
    const next = new URLSearchParams(searchParams);
    next.set("level", selectedLevel);
    next.set("office_id", String(office.office_id));
    if (selectedLevel === "state") next.set("state_id", String(office.office_id));
    else if (selectedLevel !== "state" && level === "state") next.set("state_id", String(officeId));
    next.delete("offset");
    navigate(`/dashboard/details/progress?${next.toString()}`);
  };
  const selectMapState = (state) => {
    setSearchParams({ level: "state", office_id: String(state.state_id), state_id: String(state.state_id) });
  };
  const setLevel = (event) => {
    const nextLevel = event.target.value;
    setSearchParams(nextLevel ? { level: nextLevel, ...(stateId ? { state_id: stateId } : {}) } : {});
  };

  return (
    <main className="dashboard-details-page">
      <div className="dashboard-details-heading">
        <Link to="/dashboard">← {t("dashboardDetails.back")}</Link>
        <span>{t("dashboardDetails.eyebrow")}</span>
        <h1>{t(`dashboardDetails.titles.${titleKey}`, { defaultValue: t("dashboardDetails.titles.progress") })}</h1>
        <p>{t("dashboardDetails.description")}</p>
      </div>

      {type === "nurseries" ? <NurseryList t={t} /> : (
        <>
          <section className="progress-detail-map-panel">
            <div className="progress-detail-map-heading">
              <div>
                <h2>{t(workflowScope ? "dashboardDetails.stateMapHeading" : "dashboardDetails.mapHeading")}</h2>
                <p>{t("dashboardDetails.mapHint")}</p>
              </div>
              <label>
                <span>{t("dashboardDetails.level")}</span>
                <select value={level} onChange={setLevel}>
                  <option value="">{t("dashboardDetails.allLevels")}</option>
                  {levels.map((item) => <option value={item} key={item}>{t(`dashboardDetails.levels.${item}`)}</option>)}
                </select>
              </label>
            </div>
            <IndiaSatelliteMap onStateSelect={selectMapState} scopeStateId={workflowScope?.state_id} />
          </section>

          {loading && <p role="status">{t("dashboardDetails.loading")}</p>}
          {error && <p className="dashboard-details-error" role="alert">{error}</p>}
          {data && !loading && (
            <>
              <section className="progress-detail-metrics">
                <Metric label={t("dashboardDetails.reports")} value={data.summary.reports} />
                <Metric label={t("dashboardDetails.planted")} value={data.summary.planted} />
                <Metric label={t("dashboardDetails.alive")} value={data.summary.alive} />
                <Metric label={t("dashboardDetails.dead")} value={data.summary.dead} />
                <Metric label={t("dashboardDetails.assessed")} value={data.summary.assessed} />
                <Metric label={t("dashboardDetails.pendingAssessments")} value={data.summary.pending_assessments} />
                <Metric label={t("dashboardDetails.seedlings")} value={data.summary.seedlings_available} />
              </section>

              {data.selected_office && (
                <section className="progress-selected-office">
                  <h2>{data.selected_office.office_name}</h2>
                  <p>{t("dashboardDetails.officeOverview")}</p>
                  <div className="progress-detail-metrics">
                    <Metric label={t("dashboardDetails.rank")} value={`#${data.selected_office.rank}`} />
                    <Metric label={t("dashboardDetails.planted")} value={data.selected_office.planted_last_3_months} />
                    <Metric label={t("dashboardDetails.survival")} value={`${data.selected_office.survival_percent}%`} />
                    <Metric label={t("dashboardDetails.assessed")} value={data.selected_office.assessments} />
                  </div>
                </section>
              )}

              <section className="progress-rankings-grid">
                {levels.map((rankingLevel) => (
                  <OfficeTable
                    key={rankingLevel}
                    title={t(`dashboardDetails.levels.${rankingLevel}`)}
                    rows={data.rankings[rankingLevel]}
                    t={t}
                    onSelect={(office) => selectOffice(office, rankingLevel)}
                  />
                ))}
                <SilviculturistTable rows={data.rankings.silviculturist} restricted={data.details_restricted} t={t} />
              </section>

              <section className="progress-office-section">
                <h2>{t("dashboardDetails.officeProgress", { level: level ? t(`dashboardDetails.levels.${level}`) : t("dashboardDetails.allLevels") })}</h2>
                <OfficeTable
                  title={t(`dashboardDetails.levels.${level === "state" ? "circle" : level === "circle" ? "division" : level === "division" ? "range" : "state"}`)}
                  rows={data.offices}
                  t={t}
                  onSelect={(office) => selectOffice(office, level === "state" ? "circle" : level === "circle" ? "division" : level === "division" ? "range" : "state")}
                />
              </section>

              <section className="progress-office-section">
                <h2>{reportId ? t("dashboardDetails.reportDetail") : t("dashboardDetails.recentReports")}</h2>
                {data.details_restricted ? (
                  <p className="progress-detail-empty">
                    {t("dashboardDetails.signInForReports")}{" "}
                    <Link to="/login/national">{t("navigation.login")}</Link>
                  </p>
                ) : !data.reports.length ? <p className="progress-detail-empty">{t("dashboardDetails.noReports")}</p> : (
                  <div className="progress-report-grid">
                    {data.reports.map((report) => (
                      <article className="progress-report-card" key={report.id}>
                        {!reportId && <Link to={`/dashboard/progress/${report.id}`}>{t("dashboardDetails.openReport")} →</Link>}
                        <h3>{report.site_name}</h3>
                        <p>{[report.state_name, report.circle_name, report.division_name, report.range_name].filter(Boolean).join(" / ")}</p>
                        <small>{t("dashboardDetails.inspected")}: {report.inspection_date}</small>
                        <div className="progress-report-card__stats">
                          <span>{t("dashboardDetails.planted")}: <strong>{Number(report.planted_last_3_months).toLocaleString()}</strong></span>
                          <span>{t("dashboardDetails.alive")}: <strong>{Number(report.plants_alive).toLocaleString()}</strong></span>
                          <span>{t("dashboardDetails.dead")}: <strong>{Number(report.plants_dead).toLocaleString()}</strong></span>
                          <span>{t("dashboardDetails.seedlings")}: <strong>{Number(report.seedlings_available).toLocaleString()}</strong></span>
                        </div>
                        {report.assessment && <div className="progress-report-card__assessment">
                          <strong>{t(`progress.assessmentCategories.${report.assessment.category}`, { defaultValue: report.assessment.category })}</strong>
                          <small>{report.assessment.assessed_by}</small>
                          <p>{report.assessment.reasons}</p>
                          <p>{report.assessment.recommendations}</p>
                        </div>}
                        {reportId && <>
                          {report.submitted_by?.name && <p>{report.submitted_by.name} · {report.submitted_by.role}</p>}
                          <p>{t("dashboardDetails.siteGps")}: {report.site_location?.latitude}, {report.site_location?.longitude}</p>
                          <p>{t("dashboardDetails.capturedGps")}: {report.site_location?.captured_latitude}, {report.site_location?.captured_longitude} · {report.site_location?.distance_m} m</p>
                          <div className="progress-report-detail-grid">
                            <span>{t("dashboardDetails.reportingPeriod")}: <strong>{report.period_start} – {report.period_end}</strong></span>
                            <span>{t("dashboardDetails.seedSource")}: <strong>{report.seed_source || "—"}</strong></span>
                            <span>{t("dashboardDetails.seedQuantity")}: <strong>{report.seed_quantity_kg ?? "—"} kg</strong></span>
                            <span>{t("dashboardDetails.seedCollectionDate")}: <strong>{report.seed_collection_date || "—"}</strong></span>
                            <span>{t("dashboardDetails.seedlingsProduced")}: <strong>{Number(report.seedlings_produced || 0).toLocaleString()}</strong></span>
                            <span>{t("dashboardDetails.seedlingsDistributed")}: <strong>{Number(report.seedlings_distributed || 0).toLocaleString()}</strong></span>
                          </div>
                          {report.field_photo && <img className="progress-report-photo" src={report.field_photo} alt={report.site_name} />}
                          <FieldReportMap report={report} t={t} />
                          <details open><summary>{t("dashboardDetails.speciesDetails")}</summary><pre>{JSON.stringify(report.species_details, null, 2)}</pre>{report.issues?.length > 0 && <p>{t("dashboardDetails.fieldIssues")}: {report.issues.map((issue) => [issue.type, issue.description || issue.details].filter(Boolean).join(": ")).join(" · ")}</p>}</details>
                          {report.assessments?.length > 1 && <details><summary>{t("dashboardDetails.assessmentHistory")}</summary>{report.assessments.map((assessment) => (
                            <p key={assessment.id}>{assessment.assessed_by}: {assessment.category} — {assessment.recommendations}</p>
                          ))}</details>}
                        </>}
                      </article>
                    ))}
                  </div>
                )}
                {!reportId && data.next_offset !== null && (
                  <button
                    type="button"
                    className="progress-next-page"
                    onClick={() => setSearchParams({ ...Object.fromEntries(searchParams.entries()), offset: String(data.next_offset) })}
                  >
                    {t("dashboardDetails.loadMore")}
                  </button>
                )}
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}

export default DashboardDetails;
