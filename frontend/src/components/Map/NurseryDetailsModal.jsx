import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MapContainer,
  Marker,
  Popup,
  GeoJSON,
  useMap,
} from "react-leaflet";
import SatelliteTileLayer from "./SatelliteTileLayer";
import L from "leaflet";
import { FiCrosshair, FiMapPin, FiX } from "react-icons/fi";
import api from "../../services/api";
import Loader from "../common/Loader";
import "leaflet/dist/leaflet.css";
import "./NurseryDetailsModal.css";

const IMAGE_BASE_URL =
  "https://nationalcampa.nic.in/Harit-SANKALP/Uploads/NUR/";
const INDIA_CENTER = [22.9734, 78.6569];
const INDIA_BOUNDS = {
  south: 5.5,
  north: 38.8,
  west: 67,
  east: 98.5,
};

const getCoordinates = (nursery) => {
  const rawLatitude = nursery.latitude ?? nursery.nursery_latitude;
  const rawLongitude = nursery.longitude ?? nursery.nursery_longitude;
  if (
    rawLatitude == null ||
    rawLongitude == null ||
    String(rawLatitude).trim() === "" ||
    String(rawLongitude).trim() === ""
  ) {
    return null;
  }

  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < INDIA_BOUNDS.south ||
    latitude > INDIA_BOUNDS.north ||
    longitude < INDIA_BOUNDS.west ||
    longitude > INDIA_BOUNDS.east
  ) {
    return null;
  }

  return [latitude, longitude];
};

export const getNurseryPhotoUrl = (nursery) => {
  const photo =
    nursery.photo ||
    nursery.Nursery_PHOTO ||
    nursery.photo_url ||
    nursery.photoUrl;

  if (!photo) return null;

  const path = String(photo).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(path) && !/\/media\/Uploads\/NUR\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.replace(/^~\/?/, "").replace(/^\/+/, "");
  const uploadsIndex = normalizedPath.toLowerCase().indexOf("uploads/nur/");
  const photoPath =
    uploadsIndex >= 0
      ? normalizedPath.slice(uploadsIndex + "uploads/nur/".length)
      : normalizedPath.split("/").pop();

  return photoPath ? `${IMAGE_BASE_URL}${photoPath}` : null;
};

const getNurseryKmlUrl = (nursery) => {
  const rawUrl = nursery.kml_url || nursery.nursery_kmlurl;
  if (!rawUrl) {
    return String(nursery.id) === "878"
      ? `${process.env.PUBLIC_URL}/demo/johama-naked-root-nursery-sample.kml`
      : null;
  }

  const path = String(rawUrl).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/api/")) return api.getUri({ url: path });

  const normalizedPath = path.replace(/^~\/?/, "").replace(/^\/+/, "");
  const uploadsIndex = normalizedPath.toLowerCase().indexOf("uploads/nur/");
  if (uploadsIndex >= 0) {
    const relativePath = normalizedPath.slice(uploadsIndex);
    return `${IMAGE_BASE_URL}${relativePath.slice("Uploads/NUR/".length)}`;
  }

  return null;
};

const getElementsByLocalName = (element, localName) =>
  Array.from(element.getElementsByTagName("*")).filter(
    (child) => child.localName === localName
  );

const parseKmlCoordinates = (coordinatesElement) =>
  coordinatesElement.textContent
    .trim()
    .split(/\s+/)
    .map((tuple) => tuple.split(",").map(Number))
    .filter(
      (coordinate) =>
        coordinate.length >= 2 &&
        Number.isFinite(coordinate[0]) &&
        Number.isFinite(coordinate[1]) &&
        Math.abs(coordinate[0]) <= 180 &&
        Math.abs(coordinate[1]) <= 90
    );

const parseKml = (source) => {
  const document = new DOMParser().parseFromString(source, "application/xml");
  if (
    document.documentElement?.localName === "parsererror" ||
    getElementsByLocalName(document, "parsererror").length > 0
  ) {
    throw new Error("The nursery KML file is not valid XML.");
  }

  const features = [];
  const placemarks = getElementsByLocalName(document, "Placemark");

  placemarks.forEach((placemark, index) => {
    const properties = {
      name:
        getElementsByLocalName(placemark, "name")[0]?.textContent?.trim() ||
        `KML feature ${index + 1}`,
      description:
        getElementsByLocalName(placemark, "description")[0]?.textContent?.trim() ||
        "",
    };

    const geometries = getElementsByLocalName(placemark, "Polygon")
      .map((polygon) => {
        const boundaries = getElementsByLocalName(polygon, "outerBoundaryIs");
        const outerRing = boundaries
          .flatMap((boundary) =>
            getElementsByLocalName(boundary, "coordinates")
          )
          .map(parseKmlCoordinates)
          .find((coordinates) => coordinates.length >= 3);

        if (!outerRing) return null;

        const innerRings = getElementsByLocalName(polygon, "innerBoundaryIs")
          .flatMap((boundary) =>
            getElementsByLocalName(boundary, "coordinates")
          )
          .map(parseKmlCoordinates)
          .filter((coordinates) => coordinates.length >= 3);

        return {
          type: "Polygon",
          coordinates: [outerRing, ...innerRings],
        };
      })
      .filter(Boolean);

    getElementsByLocalName(placemark, "LineString").forEach((line) => {
      const coordinates = getElementsByLocalName(line, "coordinates")
        .flatMap(parseKmlCoordinates)
        .filter((coordinate) => coordinate.length >= 2);
      if (coordinates.length >= 2) {
        geometries.push({ type: "LineString", coordinates });
      }
    });

    getElementsByLocalName(placemark, "Point").forEach((point) => {
      const coordinates = getElementsByLocalName(point, "coordinates")
        .flatMap(parseKmlCoordinates)
        .filter((coordinate) => coordinate.length >= 2);
      coordinates.forEach((coordinate) => {
        geometries.push({ type: "Point", coordinates: coordinate });
      });
    });

    geometries.forEach((geometry) => {
      features.push({
        type: "Feature",
        properties,
        geometry,
      });
    });
  });

  if (features.length === 0) {
    throw new Error("The nursery KML file has no supported map features.");
  }

  return { type: "FeatureCollection", features };
};

const getKmlPositions = (geometry) => {
  if (!geometry) return [];
  if (geometry.type === "Point") return [geometry.coordinates];
  if (geometry.type === "GeometryCollection") {
    return geometry.geometries.flatMap(getKmlPositions);
  }
  const collectCoordinates = (coordinates) => {
    if (!Array.isArray(coordinates)) return [];
    if (
      coordinates.length >= 2 &&
      Number.isFinite(coordinates[0]) &&
      Number.isFinite(coordinates[1])
    ) {
      return [coordinates];
    }
    return coordinates.flatMap(collectCoordinates);
  };
  return collectCoordinates(geometry.coordinates);
};

function KmlFootprint3D({ data, demo, t }) {
  const positions = data.features.flatMap((feature) =>
    getKmlPositions(feature.geometry)
  );
  const longitudes = positions.map(([longitude]) => longitude);
  const latitudes = positions.map(([, latitude]) => latitude);
  const altitudes = positions.map(([, , altitude = 0]) => altitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minAltitude = Math.min(...altitudes);
  const maxAltitude = Math.max(...altitudes);
  const hasAltitude = maxAltitude > minAltitude;

  const project = ([longitude, latitude, altitude = 0]) => {
    const x =
      20 +
      ((longitude - minLongitude) / (maxLongitude - minLongitude || 0.0001)) *
        240;
    const y =
      20 +
      ((maxLatitude - latitude) / (maxLatitude - minLatitude || 0.0001)) *
        130;
    const elevation = hasAltitude
      ? ((altitude - minAltitude) / (maxAltitude - minAltitude)) * 30
      : 0;
    return [x, y - elevation];
  };

  return (
    <div className="nursery-kml-preview">
      <div className="nursery-kml-preview__heading">
        <strong>{t("map.kmlPreview3d")}</strong>
        {demo && (
          <span className="nursery-kml-preview__demo">
            {t("map.kmlDemoLabel")}
          </span>
        )}
        <span>
          {hasAltitude
            ? t("map.kmlElevationIncluded")
            : t("map.kmlElevationMissing")}
        </span>
      </div>
      <svg
        className="nursery-kml-preview__scene"
        viewBox="0 0 280 190"
        role="img"
        aria-label={t("map.kmlPreview3d")}
      >
        <path
          d="M18 162 L140 178 L264 148 L140 132 Z"
          fill="rgba(191, 210, 177, .35)"
        />
        {data.features.map((feature, index) => {
          const geometry = feature.geometry;
          if (geometry.type === "Polygon") {
            const points = geometry.coordinates[0].map(project);
            const path = `${points
              .map(([x, y], pointIndex) =>
                `${pointIndex === 0 ? "M" : "L"}${x},${y}`
              )
              .join(" ")} Z`;
            return (
              <g key={`${feature.properties.name}-${index}`}>
                <path
                  d={path}
                  transform="translate(0 13)"
                  fill="#254e37"
                  stroke="#193b28"
                  strokeWidth="2"
                />
                <path
                  d={path}
                  fill="rgba(117, 183, 109, .76)"
                  stroke="#e3f3d6"
                  strokeWidth="2"
                />
              </g>
            );
          }

          if (geometry.type === "LineString") {
            const points = geometry.coordinates.map(project);
            return (
              <polyline
                key={`${feature.properties.name}-${index}`}
                points={points.map(([x, y]) => `${x},${y}`).join(" ")}
                fill="none"
                stroke="#f2bb65"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          }

          if (geometry.type === "Point") {
            const [x, y] = project(geometry.coordinates);
            return (
              <circle
                key={`${feature.properties.name}-${index}`}
                cx={x}
                cy={y}
                r="6"
                fill="#e58342"
                stroke="#fff"
                strokeWidth="2"
              />
            );
          }

          return null;
        })}
      </svg>
      <ul className="nursery-kml-preview__features">
        {data.features.map((feature, index) => (
          <li key={`${feature.properties.name}-${index}`}>
            <strong>{feature.properties.name}</strong>
            {feature.properties.description && (
              <span>{feature.properties.description}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NurseryDetailsPopup({
  nursery,
  enabled,
  onKmlLoaded,
  t,
}) {
  const [kmlState, setKmlState] = useState({
    data: null,
    error: null,
    loading: false,
  });
  const kmlUrl = getNurseryKmlUrl(nursery);
  const demoKml =
    !nursery.kml_url &&
    !nursery.nursery_kmlurl &&
    String(nursery.id) === "878";
  const photoUrl = getNurseryPhotoUrl(nursery);

  useEffect(() => {
    if (!enabled || !kmlUrl) {
      setKmlState({ data: null, error: null, loading: false });
      return undefined;
    }

    const controller = new AbortController();
    setKmlState({ data: null, error: null, loading: true });

    fetch(kmlUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to load KML (${response.status}).`);
        }
        return response.text();
      })
      .then((source) => {
        const data = parseKml(source);
        onKmlLoaded(nursery.mapKey, data);
        setKmlState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          onKmlLoaded(nursery.mapKey, null);
          setKmlState({ data: null, error, loading: false });
        }
      });

    return () => {
      controller.abort();
      onKmlLoaded(nursery.mapKey, null);
    };
  }, [enabled, kmlUrl, nursery.mapKey, onKmlLoaded]);

  return (
    <article className="nursery-map__popup-card">
      {photoUrl && (
        <img
          src={photoUrl}
          alt={nursery.name || t("map.nurseryName")}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
      <strong>{nursery.name || t("map.notAvailable")}</strong>
      <span>
        {nursery.address || nursery.location || t("map.notAvailable")}
      </span>
      {nursery.contact_person && <span>{nursery.contact_person}</span>}
      {nursery.phone && (
        <a href={`tel:${nursery.phone}`}>{nursery.phone}</a>
      )}
      {kmlUrl && kmlState.loading && (
        <span className="nursery-kml-preview__status">
          {t("map.kmlLoading")}
        </span>
      )}
      {kmlState.error && (
        <span className="nursery-kml-preview__error" role="status">
          {t("map.kmlUnavailable")}
        </span>
      )}
      {kmlState.data && (
        <KmlFootprint3D data={kmlState.data} demo={demoKml} t={t} />
      )}
      {!kmlUrl && (
        <span className="nursery-kml-preview__status">
          {t("map.kmlUnavailable")}
        </span>
      )}
    </article>
  );
}

const createMarkerIcon = (selected) =>
  L.divIcon({
    className: "nursery-map-marker",
    html: `<span class="nursery-map-marker__pin${
      selected ? " is-selected" : ""
    }"></span>`,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
  });

function MapViewport({ nurseries, resetKey, onMapReady }) {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
    return () => onMapReady(null);
  }, [map, onMapReady]);

  useEffect(() => {
    const positions = nurseries
      .map(getCoordinates)
      .filter(Boolean);

    if (positions.length > 1) {
      const bounds = L.latLngBounds(positions).pad(0.16);
      if (bounds.getNorthEast().distanceTo(bounds.getSouthWest()) < 1000) {
        bounds.extend(L.latLng(bounds.getCenter()).toBounds(12000));
      }
      map.setMaxBounds(bounds.pad(0.3));
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 9 });
    } else if (positions.length === 1) {
      const bounds = L.latLng(positions[0]).toBounds(12000);
      map.setMaxBounds(bounds.pad(0.3));
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 8 });
    } else {
      const indiaBounds = L.latLngBounds(
        [INDIA_BOUNDS.south, INDIA_BOUNDS.west],
        [INDIA_BOUNDS.north, INDIA_BOUNDS.east]
      );
      map.setMaxBounds(indiaBounds);
      map.fitBounds(indiaBounds, { padding: [8, 8] });
    }
  }, [map, nurseries, resetKey]);

  return null;
}

function NurseryMapMarker({
  nursery,
  selected,
  onSelect,
  onClose,
  onKmlLoaded,
  t,
}) {
  const markerRef = useRef(null);
  const rawLatitude = nursery.latitude ?? nursery.nursery_latitude;
  const rawLongitude = nursery.longitude ?? nursery.nursery_longitude;
  const position = useMemo(
    () =>
      getCoordinates({
        latitude: rawLatitude,
        longitude: rawLongitude,
      }),
    [rawLatitude, rawLongitude]
  );

  useEffect(() => {
    if (selected && position) {
      markerRef.current?.openPopup();
    } else {
      markerRef.current?.closePopup();
    }
  }, [position, selected]);

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={createMarkerIcon(selected)}
      eventHandlers={{
        click: () => onSelect(nursery),
      }}
    >
      <Popup
        closeButton
        autoPan
        autoPanPadding={[24, 24]}
        eventHandlers={{
          remove: () => onClose(nursery.mapKey),
        }}
      >
        <NurseryDetailsPopup
          nursery={nursery}
          enabled={selected}
          onKmlLoaded={onKmlLoaded}
          t={t}
        />
      </Popup>
    </Marker>
  );
}

function NurseryDetailsModal({
  stateName,
  nurseries,
  loading,
  onClose,
  t,
}) {
  const [selectedNursery, setSelectedNursery] = useState(null);
  const [selectedKml, setSelectedKml] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  const mapRef = useRef(null);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const mappedNurseries = useMemo(
    () =>
      nurseries
        .map((nursery, index) => ({
          ...nursery,
          mapKey: String(nursery.id ?? `${nursery.name ?? "nursery"}-${index}`),
        }))
        .filter((nursery) => getCoordinates(nursery)),
    [nurseries]
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll(
          'button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (
          event.shiftKey &&
          (document.activeElement === firstElement ||
            !dialogRef.current.contains(document.activeElement))
        ) {
          event.preventDefault();
          lastElement?.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === lastElement
        ) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const setKmlOverlay = useCallback((mapKey, data) => {
    if (data) {
      setSelectedKml({ mapKey, data });
    } else {
      setSelectedKml((current) =>
        current?.mapKey === mapKey ? null : current
      );
    }
  }, []);

  const setMapRef = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const closeNurseryPopup = useCallback((mapKey) => {
    setSelectedNursery((current) =>
      current?.mapKey === mapKey ? null : current
    );
    setSelectedKml((current) =>
      current?.mapKey === mapKey ? null : current
    );
  }, []);

  const selectNursery = (nursery) => {
    setSelectedNursery(nursery);
    setSelectedKml(null);
    const position = getCoordinates(nursery);
    if (position) {
      mapRef.current?.stop();
      mapRef.current?.flyTo(position, 15, { duration: 0.8 });
    }
  };

  return (
    <div
      className="nursery-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="nursery-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nursery-modal-title"
        ref={dialogRef}
      >
        <header className="nursery-modal__header">
          <div>
            <span className="nursery-modal__eyebrow">
              <FiMapPin aria-hidden="true" />
              {t("dashboard.mapView")}
            </span>
            <h2 id="nursery-modal-title">
              {t("map.nurseriesIn")} {stateName}
            </h2>
            <p>
              {nurseries.length} {t("map.totalNurseries").toLowerCase()}
            </p>
          </div>
          <button
            className="nursery-modal__close"
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            ref={closeButtonRef}
          >
            <FiX aria-hidden="true" />
          </button>
        </header>

        {loading ? (
          <div className="nursery-modal__loading" role="status">
            <Loader />
            <span>{t("map.loadingDetails")}</span>
          </div>
        ) : (
          <>
            <div className="nursery-map__toolbar">
              <span>
                {mappedNurseries.length} / {nurseries.length}{" "}
                {t("map.totalNurseries").toLowerCase()}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedNursery(null);
                  setSelectedKml(null);
                  setResetKey((current) => current + 1);
                }}
                disabled={mappedNurseries.length === 0}
              >
                <FiCrosshair aria-hidden="true" />
                {t("dashboard.reset")}
              </button>
            </div>

            {nurseries.length === 0 ? (
              <p className="nursery-modal__empty">
                {t("map.noneFoundFor")} {stateName}.
              </p>
            ) : (
              <>
                <div
                  className="nursery-map"
                  aria-label={t("dashboard.mapView")}
                >
                  <MapContainer
                    center={INDIA_CENTER}
                    zoom={5}
                    scrollWheelZoom
                    maxBounds={L.latLngBounds(
                      [INDIA_BOUNDS.south, INDIA_BOUNDS.west],
                      [INDIA_BOUNDS.north, INDIA_BOUNDS.east]
                    )}
                    maxBoundsViscosity={1}
                    className="nursery-map__canvas"
                  >
                    <SatelliteTileLayer />
                    <MapViewport
                      nurseries={mappedNurseries}
                      resetKey={resetKey}
                      onMapReady={setMapRef}
                    />
                    {selectedKml && (
                      <GeoJSON
                        key={selectedKml.mapKey}
                        data={selectedKml.data}
                        style={{
                          color: "#f6c35d",
                          weight: 3,
                          fillColor: "#76b36d",
                          fillOpacity: 0.38,
                        }}
                        pointToLayer={(_feature, latlng) =>
                          L.circleMarker(latlng, {
                            radius: 7,
                            color: "#fff",
                            weight: 2,
                            fillColor: "#f27e43",
                            fillOpacity: 1,
                          })
                        }
                      />
                    )}
                    {mappedNurseries.map((nursery) => (
                      <NurseryMapMarker
                        key={nursery.mapKey}
                        nursery={nursery}
                        selected={
                          selectedNursery?.mapKey === nursery.mapKey
                        }
                        onSelect={selectNursery}
                        onClose={closeNurseryPopup}
                        onKmlLoaded={setKmlOverlay}
                        t={t}
                      />
                    ))}
                  </MapContainer>
                </div>

                {mappedNurseries.length === 0 && (
                  <p className="nursery-modal__notice">
                    {t("map.notAvailable")}
                  </p>
                )}

                <div className="nursery-table-wrap">
                  <table className="nursery-table">
                    <thead>
                      <tr>
                        <th>{t("map.photo")}</th>
                        <th>{t("map.nurseryName")}</th>
                        <th>{t("map.address")}</th>
                        <th>{t("map.contactPerson")}</th>
                        <th>{t("map.phone")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nurseries.map((nursery, index) => {
                        const photoUrl = getNurseryPhotoUrl(nursery);
                        const mappedNursery = mappedNurseries.find(
                          (item) =>
                            item.mapKey ===
                            String(
                              nursery.id ??
                                `${nursery.name ?? "nursery"}-${index}`
                            )
                        );
                        return (
                          <tr
                            key={nursery.id ?? `${nursery.name ?? "nursery"}-${index}`}
                            className={
                              mappedNursery ? "is-locatable" : undefined
                            }
                            tabIndex={mappedNursery ? 0 : undefined}
                            aria-label={
                              mappedNursery
                                ? `${nursery.name || t("map.nurseryName")}, ${t("dashboard.mapView")}`
                                : undefined
                            }
                            onClick={() => {
                              if (mappedNursery) selectNursery(mappedNursery);
                            }}
                            onKeyDown={(event) => {
                              if (
                                mappedNursery &&
                                (event.key === "Enter" || event.key === " ")
                              ) {
                                event.preventDefault();
                                selectNursery(mappedNursery);
                              }
                            }}
                          >
                            <td>
                              {photoUrl ? (
                                <img
                                  className="nursery-table__photo"
                                  src={photoUrl}
                                  alt={nursery.name || t("map.nurseryName")}
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <span>{t("map.comingSoon")}</span>
                              )}
                            </td>
                            <td>
                              <strong>{nursery.name || t("map.notAvailable")}</strong>
                            </td>
                            <td>
                              {nursery.address ||
                                nursery.location ||
                                t("map.notAvailable")}
                            </td>
                            <td>{nursery.contact_person || t("map.notAvailable")}</td>
                            <td>{nursery.phone || t("map.notAvailable")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default NurseryDetailsModal;
