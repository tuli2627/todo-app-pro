
import React, { useEffect, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  useMap,
} from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import SatelliteTileLayer from "../../components/Map/SatelliteTileLayer";
import { getNurseryPhotoUrl } from "../../components/Map/NurseryDetailsModal";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";
import "./Nursery.css";

// Fix Leaflet's default marker image paths.
const nurseryMarkerIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER = [22.9734, 78.6569];

function NurseryMapCenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 14);
    } else {
      map.setView(DEFAULT_CENTER, 5);
    }
  }, [map, position]);

  return null;
}

function NurseryLocation({ nursery }) {
  const hasCoordinates =
    nursery.latitude !== null &&
    nursery.latitude !== undefined &&
    String(nursery.latitude).trim() !== "" &&
    nursery.longitude !== null &&
    nursery.longitude !== undefined &&
    String(nursery.longitude).trim() !== "";

  const latitude = hasCoordinates ? Number(nursery.latitude) : NaN;
  const longitude = hasCoordinates ? Number(nursery.longitude) : NaN;

  const position =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= 5.5 &&
    latitude <= 38.8 &&
    longitude >= 67 &&
    longitude <= 98.5
      ? [latitude, longitude]
      : null;

  return (
    <div className="nursery-detail-map">
      <MapContainer
        center={position || DEFAULT_CENTER}
        zoom={position ? 14 : 5}
        scrollWheelZoom={false}
        style={{ height: "400px", width: "100%" }}
      >
        <SatelliteTileLayer />

        <NurseryMapCenter position={position} />

        {position && (
          <Marker
            position={position}
            icon={nurseryMarkerIcon}
          />
        )}
      </MapContainer>

      {!position && (
        <p role="status">
          GPS coordinates are not available for this nursery.
        </p>
      )}
    </div>
  );
}

function NurseryCard({ nursery, onOpen, t }) {
  const [imageFailed, setImageFailed] = useState(false);

  const photo = getNurseryPhotoUrl(nursery);
  const address =
    nursery.address || nursery.location || nursery.district || "";

  return (
    <article className="nursery-live-card">
      <button
        className="nursery-live-card__image-button"
        type="button"
        onClick={onOpen}
      >
        {photo && !imageFailed ? (
          <img
            src={photo}
            alt={nursery.name || "Nursery"}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="nursery-live-card__no-image">
            {t("nursery.imageUnavailable")}
          </span>
        )}
      </button>

      <div className="nursery-live-card__body">
        <h2>{nursery.name || t("nursery.nursery")}</h2>

        <p>
          {[address, nursery.district, nursery.state]
            .filter(Boolean)
            .join(", ") || t("nursery.addressUnavailable")}
        </p>

        <button
          className="nursery-live-card__details"
          type="button"
          onClick={onOpen}
        >
          {t("nursery.viewDetails")} →
        </button>
      </div>
    </article>
  );
}

const Nursery = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedId = searchParams.get("nursery");

  const [nurseries, setNurseries] = useState([]);
  const [selectedNursery, setSelectedNursery] = useState(null);
  const [states, setStates] = useState([]);
  const [stateId, setStateId] = useState("");
  const [query, setQuery] = useState("");
  const [nextOffset, setNextOffset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load state filters from the backend.
  useEffect(() => {
    let current = true;

    api
      .get("states/")
      .then(({ data }) => {
        if (current) {
          setStates(Array.isArray(data) ? data : []);
        }
      })
      .catch((requestError) => {
        console.error(
          "Unable to load nursery state filters:",
          requestError
        );
      });

    return () => {
      current = false;
    };
  }, []);

  // Load nursery list or the selected nursery details.
  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    api
      .get("public-dashboard/nurseries/", {
        params: selectedId
          ? { nursery_id: selectedId, limit: 1 }
          : {
              state_id: stateId || undefined,
              q: query.trim() || undefined,
              limit: 24,
            },
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (controller.signal.aborted) return;

        const results = Array.isArray(data.results)
          ? data.results
          : [];

        if (selectedId) {
          setSelectedNursery(results[0] || null);
        } else {
          setNurseries(results);
          setNextOffset(data.next_offset ?? null);
        }
      })
      .catch((requestError) => {
        if (controller.signal.aborted) return;

        console.error(
          "Unable to load public nursery records:",
          requestError
        );

        setError(t("nursery.loadError"));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [selectedId, stateId, query, t]);

  const openNursery = (nursery) => {
    setSearchParams({ nursery: String(nursery.id) });
  };

  // Load the next page of nursery records.
  const loadMore = async () => {
    if (nextOffset === null || loading) return;

    setLoading(true);
    setError("");

    try {
      const { data } = await api.get(
        "public-dashboard/nurseries/",
        {
          params: {
            state_id: stateId || undefined,
            q: query.trim() || undefined,
            limit: 24,
            offset: nextOffset,
          },
        }
      );

      setNurseries((current) => [
        ...current,
        ...(Array.isArray(data.results) ? data.results : []),
      ]);

      setNextOffset(data.next_offset ?? null);
    } catch (requestError) {
      console.error(
        "Unable to load more public nursery records:",
        requestError
      );

      setError(t("nursery.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedNursery(null);
    setSearchParams({});
  };

  const selectedPhoto = selectedNursery
    ? getNurseryPhotoUrl(selectedNursery)
    : null;

  return (
    <div className="nursery-page">
      <section className="nursery-hero">
        <div className="nursery-hero-overlay" />

        <div className="nursery-hero-content">
          <h1>{t("nursery.title")}</h1>
          <p>{t("nursery.liveDescription")}</p>
        </div>
      </section>

      <section className="nursery-gallery-section">
        <div className="nursery-gallery-container">
          {selectedId ? (
            <div className="nursery-detail-page">
              <button
                className="nursery-back-button"
                type="button"
                onClick={closeDetails}
              >
                ← {t("nursery.backToList")}
              </button>

              {loading ? (
                <p role="status">{t("nursery.loading")}</p>
              ) : selectedNursery ? (
                <>
                  <div className="nursery-detail-heading">
                    <div>
                      <span className="nursery-detail-eyebrow">
                        {t("nursery.title")}
                      </span>

                      <h2>{selectedNursery.name}</h2>

                      <p>
                        {[
                          selectedNursery.address,
                          selectedNursery.district,
                          selectedNursery.state,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>

                    {selectedPhoto ? (
                      <img
                        src={selectedPhoto}
                        alt={selectedNursery.name || "Nursery"}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="nursery-live-card__no-image">
                        {t("nursery.imageUnavailable")}
                      </span>
                    )}
                  </div>

                  <div className="nursery-detail-grid">
                    <article>
                      <span>{t("nursery.location")}</span>
                      <strong>
                        {selectedNursery.location ||
                          selectedNursery.address ||
                          t("nursery.addressUnavailable")}
                      </strong>
                    </article>

                    <article>
                      <span>{t("booking.state")}</span>
                      <strong>{selectedNursery.state || "—"}</strong>
                    </article>

                    <article>
                      <span>{t("booking.district")}</span>
                      <strong>{selectedNursery.district || "—"}</strong>
                    </article>

                    <article>
                      <span>{t("nursery.contact")}</span>
                      <strong>
                        {selectedNursery.contact_person || "—"}
                      </strong>
                    </article>

                    <article>
                      <span>{t("nursery.phone")}</span>
                      <strong>{selectedNursery.phone || "—"}</strong>
                    </article>

                    <article>
                      <span>{t("nursery.propagationType")}</span>
                      <strong>
                        {selectedNursery.propagation_type || "—"}
                      </strong>
                    </article>

                    <article>
                      <span>{t("nursery.coordinates")}</span>
                      <strong>
                        {selectedNursery.latitude !== null &&
                        selectedNursery.latitude !== undefined &&
                        String(selectedNursery.latitude).trim() !== "" &&
                        selectedNursery.longitude !== null &&
                        selectedNursery.longitude !== undefined &&
                        String(selectedNursery.longitude).trim() !== ""
                          ? `${selectedNursery.latitude}, ${selectedNursery.longitude}`
                          : "—"}
                      </strong>
                    </article>
                  </div>

                  <NurseryLocation nursery={selectedNursery} />
                </>
              ) : (
                <p role="status">
                  {error || t("nursery.notFound")}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="nursery-list-heading">
                <div>
                  <span className="nursery-detail-eyebrow">
                    {t("nursery.title")}
                  </span>

                  <h2>{t("nursery.directoryHeading")}</h2>
                </div>

                <div className="nursery-list-filters">
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("nursery.searchPlaceholder")}
                    aria-label={t("nursery.searchPlaceholder")}
                  />

                  <select
                    value={stateId}
                    onChange={(event) => setStateId(event.target.value)}
                    aria-label={t("booking.state")}
                  >
                    <option value="">
                      {t("nursery.allStates")}
                    </option>

                    {states.map((state) => (
                      <option
                        key={state.state_id}
                        value={state.state_id}
                      >
                        {state.state_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading && (
                <p role="status">{t("nursery.loading")}</p>
              )}

              {error && (
                <p className="nursery-load-error" role="alert">
                  {error}
                </p>
              )}

              {!loading && !error && nurseries.length === 0 && (
                <p role="status">{t("nursery.noResults")}</p>
              )}

              <div className="nursery-live-grid">
                {nurseries.map((nursery) => (
                  <NurseryCard
                    key={nursery.id}
                    nursery={nursery}
                    onOpen={() => openNursery(nursery)}
                    t={t}
                  />
                ))}
              </div>

              {nextOffset !== null && (
                <button
                  className="nursery-load-more"
                  type="button"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading
                    ? t("nursery.loading")
                    : t("nursery.loadMore")}
                </button>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Nursery;