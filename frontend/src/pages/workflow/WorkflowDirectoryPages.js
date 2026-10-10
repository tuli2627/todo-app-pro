import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { CircleMarker, MapContainer, Popup, useMap } from "react-leaflet";
import { FiExternalLink, FiMapPin, FiRefreshCw, FiUsers } from "react-icons/fi";
import api from "../../services/api";
import SatelliteTileLayer from "../../components/Map/SatelliteTileLayer";
import Loader from "../../components/common/Loader";
import { getNurseryPhotoUrl } from "../../components/Map/NurseryDetailsModal";
import "leaflet/dist/leaflet.css";
import "./WorkflowDirectoryPages.css";

const PAGE_SIZE = 100;
const INDIA_CENTER = [22.9734, 78.6569];
const INDIA_BOUNDS = [[6.4, 68.1], [37.6, 97.5]];

function NurseryMapViewport({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 1) {
      map.setView(positions[0].position, 8);
    } else if (positions.length > 1) {
      map.fitBounds(positions.map((item) => item.position), {
        padding: [28, 28],
        maxZoom: 10,
        maxBounds: INDIA_BOUNDS,
      });
    } else {
      map.setView(INDIA_CENTER, 5);
    }
  }, [map, positions]);

  return null;
}

function NurseryMapMarker({ nursery, t }) {
  const map = useMap();
  const photoUrl = getNurseryPhotoUrl(nursery);
  return (
    <CircleMarker
      center={nursery.mapPosition}
      radius={7}
      eventHandlers={{ click: () => map.flyTo(nursery.mapPosition, 12, { duration: 0.6 }) }}
    >
      <Popup>
        <article className="workflow-nursery-popup">
          {photoUrl && <img src={photoUrl} alt={nursery.Nursery_Name || ""} />}
          <strong>{nursery.Nursery_Name || nursery.Nursery_UniqueCode}</strong>
          <span>{t("workflow.fields.recordCode")}: {nursery.Nursery_UniqueCode || "—"}</span>
          <span>{t("workflow.fields.address")}: {nursery.Nursery_Address || nursery.Nursery_Location || "—"}</span>
          <span>{t("workflow.fields.state")}: {nursery.display_values?.Nursery_State_ID || "—"}</span>
          <span>{t("workflow.fields.district")}: {nursery.display_values?.Nursery_District_ID || "—"}</span>
          <span>{t("workflow.fields.division")}: {nursery.display_values?.Nursery_Division_ID || "—"}</span>
          <span>{t("workflow.fields.range")}: {nursery.display_values?.Nursery_Range_ID || "—"}</span>
          <span>{nursery.Nursery_Latitude}, {nursery.Nursery_Longitude}</span>
          <Link to={`/internal/records/nursery/${nursery.Nursery_ID}`}>
            {t("workflow.recordDetails")}
          </Link>
        </article>
      </Popup>
    </CircleMarker>
  );
}

export function InternalNurseryMapping() {
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [mapRecords, setMapRecords] = useState([]);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (pageOffset = 0) => {
    setLoading(true);
    setError("");
    try {
      const allRecords = [];
      let currentOffset = 0;
      let total = 0;
      do {
        const { data } = await api.get(
          `workflow/records/nursery/?limit=500&offset=${currentOffset}`
        );
        const batch = data.records || [];
        allRecords.push(...batch);
        total = data.count || 0;
        currentOffset += batch.length;
      } while (currentOffset < total && currentOffset > 0);
      setMapRecords(allRecords);
      setRecords(allRecords.slice(pageOffset, pageOffset + PAGE_SIZE));
      setCount(total);
      setOffset(pageOffset);
    } catch (requestError) {
      setError(requestError.message || t("workflow.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load(0);
  }, [load]);

  const nurseries = useMemo(
    () => mapRecords.map((record) => {
      const lat = Number(record.Nursery_Latitude);
      const lng = Number(record.Nursery_Longitude);
      const inIndia = lat >= INDIA_BOUNDS[0][0] && lat <= INDIA_BOUNDS[1][0] &&
        lng >= INDIA_BOUNDS[0][1] && lng <= INDIA_BOUNDS[1][1];
      return {
        ...record,
        mapPosition: inIndia && Number.isFinite(lat) && Number.isFinite(lng) &&
          lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
          ? [lat, lng]
          : null,
      };
    }),
    [mapRecords]
  );
  const mappedNurseries = useMemo(
    () => nurseries.filter((nursery) => nursery.mapPosition),
    [nurseries]
  );
  const mapPositions = useMemo(
    () => mappedNurseries.map((nursery) => ({ position: nursery.mapPosition })),
    [mappedNurseries]
  );

  return (
    <main className="workflow-page workflow-directory">
      <div className="workflow-page__topline">
        <Link className="workflow-back" to="/internal/dashboard">{t("workflow.backToDashboard")}</Link>
      </div>
      <section className="workflow-module-heading">
        <span className="workflow-eyebrow"><FiMapPin aria-hidden="true" /> {t("workflow.internalPortal")}</span>
        <h1>{t("workflow.directory.mappingTitle")}</h1>
        <p>{t("workflow.directory.mappingDescription")}</p>
      </section>

      {error && <div className="workflow-alert" role="alert">{error}</div>}
      <section className="workflow-directory__panel">
        <header className="workflow-directory__heading">
          <div>
            <h2>{t("workflow.nurseryMapping")}</h2>
            <p>{t("workflow.directory.totalNurseries", { count })}</p>
          </div>
          <button type="button" className="workflow-directory__refresh" onClick={() => load(offset)} disabled={loading}>
            <FiRefreshCw aria-hidden="true" /> {t("workflow.refresh")}
          </button>
        </header>

        {loading ? (
          <div className="workflow-loading"><Loader /><span>{t("workflow.loading")}</span></div>
        ) : count === 0 ? (
          <div className="workflow-empty"><FiMapPin aria-hidden="true" /><p>{t("workflow.noRecords")}</p></div>
        ) : (
          <>
            {mappedNurseries.length ? (
              <div className="workflow-directory__map">
                <MapContainer
                  center={INDIA_CENTER}
                  zoom={5}
                  maxBounds={INDIA_BOUNDS}
                  maxBoundsViscosity={0.8}
                  scrollWheelZoom
                  className="workflow-directory__map-canvas"
                >
                  <SatelliteTileLayer />
                  <NurseryMapViewport positions={mapPositions} />
                  {mappedNurseries.map((nursery) => (
                    <NurseryMapMarker key={nursery.Nursery_ID} nursery={nursery} t={t} />
                  ))}
                </MapContainer>
              </div>
            ) : (
              <div className="workflow-directory__notice">{t("workflow.directory.noMappedCoordinates")}</div>
            )}

            <div className="workflow-table-wrap">
              <table className="workflow-table">
                <thead>
                  <tr>
                    <th>{t("workflow.fields.nurseryName")}</th>
                    <th>{t("workflow.fields.recordCode")}</th>
                    <th>{t("workflow.fields.address")}</th>
                    <th>{t("workflow.fields.state")}</th>
                    <th>{t("workflow.fields.district")}</th>
                    <th>{t("workflow.directory.location")}</th>
                  </tr>
                </thead>
                <tbody>
                  {nurseries.map((nursery) => (
                    <tr key={nursery.Nursery_ID}>
                      <td>{nursery.Nursery_Name || "—"}</td>
                      <td>{nursery.Nursery_UniqueCode || "—"}</td>
                      <td>{nursery.Nursery_Location || nursery.Nursery_Address || "—"}</td>
                      <td>{nursery.display_values?.Nursery_State_ID || "—"}</td>
                      <td>{nursery.display_values?.Nursery_District_ID || "—"}</td>
                      <td>
                        {nursery.mapPosition ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${nursery.mapPosition.join(",")}`}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={t("workflow.directory.openMapFor", { name: nursery.Nursery_Name || nursery.Nursery_UniqueCode })}
                          >
                            <FiExternalLink aria-hidden="true" /> {nursery.Nursery_Latitude}, {nursery.Nursery_Longitude}
                          </a>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="workflow-directory__pagination">
              <span>{t("workflow.directory.pageSummary", {
                start: offset + 1,
                end: Math.min(offset + records.length, count),
                count,
              })}</span>
              <div>
                <button type="button" onClick={() => load(Math.max(0, offset - PAGE_SIZE))} disabled={loading || offset === 0}>
                  {t("workflow.directory.previous")}
                </button>
                <button type="button" onClick={() => load(offset + PAGE_SIZE)} disabled={loading || offset + records.length >= count}>
                  {t("workflow.directory.next")}
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </main>
  );
}

export function InternalUserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async (pageOffset = 0) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(
        `workflow/users/?limit=${PAGE_SIZE}&offset=${pageOffset}`
      );
      setUsers(data.users || []);
      setCount(data.count || 0);
      setOffset(pageOffset);
    } catch (requestError) {
      setError(requestError.message || t("workflow.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const updateUser = async (user, action) => {
    setUpdatingId(user.id);
    setError("");
    try {
      await api.patch("workflow/users/", { user_id: user.id, action });
      await load(offset);
    } catch (requestError) {
      setError(requestError.message || t("workflow.saveError"));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="workflow-page workflow-directory">
      <div className="workflow-page__topline">
        <Link className="workflow-back" to="/internal/dashboard">{t("workflow.backToDashboard")}</Link>
      </div>
      <section className="workflow-module-heading">
        <span className="workflow-eyebrow"><FiUsers aria-hidden="true" /> {t("workflow.internalPortal")}</span>
        <h1>{t("workflow.directory.usersTitle")}</h1>
        <p>{t("workflow.directory.usersDescription")}</p>
      </section>
      {error && <div className="workflow-alert" role="alert">{error}</div>}
      <section className="workflow-directory__panel">
        <header className="workflow-directory__heading">
          <div>
            <h2>{t("workflow.userManagement")}</h2>
            <p>{t("workflow.directory.totalUsers", { count })}</p>
          </div>
          <button type="button" className="workflow-directory__refresh" onClick={() => load(offset)} disabled={loading}>
            <FiRefreshCw aria-hidden="true" /> {t("workflow.refresh")}
          </button>
        </header>
        {loading ? (
          <div className="workflow-loading"><Loader /><span>{t("workflow.loading")}</span></div>
        ) : users.length === 0 ? (
          <div className="workflow-empty"><FiUsers aria-hidden="true" /><p>{t("workflow.directory.noUsers")}</p></div>
        ) : (
          <div className="workflow-table-wrap">
            <table className="workflow-table">
              <thead>
                <tr>
                  <th>{t("workflow.directory.userName")}</th>
                  <th>{t("workflow.directory.email")}</th>
                  <th>{t("workflow.fields.state")}</th>
                  <th>{t("workflow.fields.district")}</th>
                  <th>{t("workflow.directory.userStatus")}</th>
                  <th>{t("workflow.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const approved = user.approved === "Y";
                  const active = user.active === "Y";
                  const blocked = user.account_blocked === "Y";
                  const actions = approved
                    ? [active ? "deactivate" : "activate"]
                    : ["approve"];
                  actions.push(blocked ? "unblock" : "block");
                  return (
                    <tr key={user.id}>
                      <td>{[user.fname, user.lname].filter(Boolean).join(" ") || "—"}</td>
                      <td>{user.emailid || "—"}</td>
                      <td>{user.state_id || "—"}</td>
                      <td>{user.district_id || "—"}</td>
                      <td>
                        {t(approved ? "workflow.directory.approved" : "workflow.directory.notApproved")}
                        {" · "}
                        {t(active ? "workflow.directory.active" : "workflow.directory.inactive")}
                        {blocked && ` · ${t("workflow.directory.blocked")}`}
                      </td>
                      <td className="workflow-directory__user-actions">
                        {actions.map((action) => (
                          <button
                            type="button"
                            key={action}
                            className={action === "block" || action === "deactivate" ? "is-quiet" : ""}
                            disabled={updatingId === user.id}
                            onClick={() => updateUser(user, action)}
                          >
                            {t(`workflow.directory.actions.${action}`)}
                          </button>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && count > 0 && (
          <footer className="workflow-directory__pagination">
            <span>{t("workflow.directory.pageSummary", {
              start: offset + 1,
              end: Math.min(offset + users.length, count),
              count,
            })}</span>
            <div>
              <button type="button" onClick={() => load(Math.max(0, offset - PAGE_SIZE))} disabled={loading || offset === 0}>
                {t("workflow.directory.previous")}
              </button>
              <button type="button" onClick={() => load(offset + PAGE_SIZE)} disabled={loading || offset + users.length >= count}>
                {t("workflow.directory.next")}
              </button>
            </div>
          </footer>
        )}
      </section>
    </main>
  );
}

export default InternalNurseryMapping;
