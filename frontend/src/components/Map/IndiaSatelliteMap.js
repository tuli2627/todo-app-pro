import React, { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Popup, useMap } from "react-leaflet";
import { useTranslation } from "react-i18next";
import api from "../../services/api";
import SatelliteTileLayer from "./SatelliteTileLayer";
import "leaflet/dist/leaflet.css";
import "./IndiaSatelliteMap.css";

const INDIA_BOUNDS = [[5.5, 67], [38.8, 98.5]];
const INDIA_CENTER = [22.9734, 78.6569];

function MapViewport({ positions, stateScoped }) {
  const map = useMap();

  useEffect(() => {
    if (!positions.length) return;
    map.fitBounds(positions, {
      padding: [20, 20],
      maxZoom: stateScoped ? 7 : 5,
    });
  }, [map, positions, stateScoped]);

  return null;
}

function validPosition(nursery) {
  const latitude = Number(nursery.latitude);
  const longitude = Number(nursery.longitude);
  if (
    !Number.isFinite(latitude)
    || !Number.isFinite(longitude)
    || latitude < INDIA_BOUNDS[0][0]
    || latitude > INDIA_BOUNDS[1][0]
    || longitude < INDIA_BOUNDS[0][1]
    || longitude > INDIA_BOUNDS[1][1]
  ) {
    return null;
  }
  return [latitude, longitude];
}

function IndiaSatelliteMap({ onStateSelect, scopeStateId }) {
  const { t } = useTranslation();
  const [nurseries, setNurseries] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [highestState, setHighestState] = useState(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const loadMap = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const records = [];
        let offset = 0;
        let nextOffset = 0;
        while (nextOffset !== null) {
          const { data } = await api.get("public-dashboard/nurseries/", {
            params: {
              limit: 100,
              offset,
              state_id: scopeStateId || undefined,
            },
            signal: controller.signal,
          });
          records.push(...(data.results || []));
          nextOffset = data.next_offset;
          if (nextOffset === null) break;
          if (nextOffset <= offset) {
            throw new Error("Nursery map pagination did not advance.");
          }
          offset = nextOffset;
        }
        const { data: stateData } = await api.get("/map-data/", {
          signal: controller.signal,
        });
        if (!active) return;
        setNurseries(records);
        setStates(stateData || []);
        setHighestState(
          (stateData || []).reduce(
            (highest, state) => (
              !highest || state.nurseries_count > highest.nurseries_count
                ? state
                : highest
            ),
            null
          )
        );
      } catch (error) {
        if (active && !controller.signal.aborted) {
          console.error("Unable to load satellite nursery map:", error);
          setLoadError(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMap();
    return () => {
      active = false;
      controller.abort();
    };
  }, [scopeStateId]);

  const mappedNurseries = nurseries.flatMap((nursery) => {
    const position = validPosition(nursery);
    if (!position) return [];
    const normalizedState = String(nursery.state || "").trim().toLocaleLowerCase();
    const state = states.find(
      (item) => String(item.state_name || "").trim().toLocaleLowerCase() === normalizedState
    );
    return [{ ...nursery, position, stateRecord: state }];
  });
  const positions = mappedNurseries.map((nursery) => nursery.position);

  return (
    <div className="india-satellite-map">
      <div className="india-satellite-map__canvas">
        <MapContainer
          center={INDIA_CENTER}
          zoom={5}
          maxBounds={INDIA_BOUNDS}
          maxBoundsViscosity={0.8}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <SatelliteTileLayer />
          <MapViewport positions={positions} stateScoped={scopeStateId != null} />
          {mappedNurseries.map((nursery) => (
            <CircleMarker
              key={nursery.id}
              center={nursery.position}
              radius={6}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: "#2f9b52",
                fillOpacity: 0.95,
              }}
            >
              <Popup>
                <strong>{nursery.name || t("nursery.nursery")}</strong>
                <br />
                {[nursery.state, nursery.district, nursery.location || nursery.address]
                  .filter(Boolean)
                  .join(" · ")}
                {nursery.stateRecord && onStateSelect && (
                  <>
                    <br />
                    <button
                      className="india-satellite-map__popup-action"
                      type="button"
                      onClick={() => onStateSelect(nursery.stateRecord)}
                    >
                      {t("dashboardDetails.viewStateReports")}
                    </button>
                  </>
                )}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
        {loading && <p className="india-satellite-map__loading" role="status">{t("dashboardDetails.loading")}</p>}
        {!loading && loadError && (
          <p className="india-satellite-map__loading" role="alert">{t("dashboardDetails.loadError")}</p>
        )}
        {!loading && !loadError && mappedNurseries.length === 0 && (
          <p className="india-satellite-map__loading" role="status">{t("dashboardDetails.noMappedNurseries")}</p>
        )}
      </div>
      <div className="india-satellite-map__summary">
        <span>{t("map.totalNurseries")}: <strong>{nurseries.length}</strong></span>
        {highestState && scopeStateId == null && (
          <span>{t("map.highest")}: <strong>{highestState.state_name} ({highestState.nurseries_count})</strong></span>
        )}
        {scopeStateId != null && states[0] && (
          <span>{states[0].state_name}: <strong>{states[0].nurseries_count}</strong></span>
        )}
      </div>
    </div>
  );
}

export default IndiaSatelliteMap;
