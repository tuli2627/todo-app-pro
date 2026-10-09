// import React, { useState } from "react";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";

// import ChartDataLabels from "chartjs-plugin-datalabels";
// import { Line, Bar } from "react-chartjs-2";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   ChartDataLabels
// );

// const labels = [
//   "Andaman",
//   "Arunachal",
//   "Gujarat",
//   "Himachal",
//   "J&K",
//   "Karnataka",
//   "M.P.",
//   "Manipur",
//   "Mizoram",
//   "Punjab",
//   "Rajasthan",
//   "Sikkim",
//   "Telangana",
//   "Tripura",
//   "West Bengal"
// ];

// const values = [
//   13,
//   3,
//   299,
//   27,
//   49,
//   206,
//   40,
//   50,
//   46,
//   33,
//   6,
//   7,
//   77,
//   8,
//   3
// ];

// const lineData = {
//   labels,
//   datasets: [
//     {
//       label: "Total Nursery",
//       data: values,
//       borderColor: "#c0392b",
//       backgroundColor: "#c0392b",
//       pointRadius: 4,
//       borderWidth: 2,
//       tension: 0.2,
//     },
//   ],
// };

// const barData = {
//   labels,
//   datasets: [
//     {
//       label: "Total Nursery",
//       data: values,
//       backgroundColor: [
//         "#6495ED",
//         "#000080",
//         "#800000",
//         "#006400",
//         "#8B4513",
//         "#2E8B57",
//         "#4682B4",
//         "#D2691E",
//         "#9ACD32",
//         "#CD5C5C",
//         "#FF8C00",
//         "#483D8B",
//         "#008080",
//         "#BDB76B",
//         "#8FBC8F",
//       ],
//     },
//   ],
// };

// const lineOptions = {
//   responsive: true,
//   plugins: {
//     legend: {
//       display: false,
//     },
//     datalabels: {
//       anchor: "end",
//       align: "top",
//       font: {
//         size: 10,
//       },
//     },
//   },
// };

// const barOptions = {
//   responsive: true,
//   plugins: {
//     legend: {
//       display: false,
//     },
//     datalabels: {
//       display: false,
//     },
//   },
// };

// function DashboardCharts() {
//   const [activeStateData, setActiveStateData] = useState(null);

//   // const handleChartClick = (event, elements) => {
//   //   if (!elements.length) return;

//   //   const index = elements[0].index;
//   //   const state = labels[index];   // <-- FIXED HERE

//   //   alert("Opening details for " + state);

//   //   // Example:
//   //   // window.location.href = "/state/" + state;
//   // };
//   const handleChartClick = (event, elements) => {
//     if (!elements.length) return;

//     const index = elements[0].index;
//     const stateName = labels[index];
//     const stateValue = values[index]; // We also grab the number value now

//     // Update our state variable instead of alerting
//     setActiveStateData({ name: stateName, value: stateValue });
//   };

//   return (
//     <div className="charts-row">

//       <div className="chart-card">
//         <Line
//   data={lineData}
//   options={{
//     ...lineOptions,
//     onClick: handleChartClick,
//   }}
// />
//       </div>

//       <div className="chart-card">
//        <Bar
//   data={barData}
//   options={{
//     ...barOptions,
//     onClick: handleChartClick,
//   }}
// />
//       </div>

//       <div className="chart-card">
//         <Line
//   data={lineData}
//   options={{
//     ...lineOptions,
//     onClick: handleChartClick,
//   }}
// />
//       </div>

//     </div>
//     {activeStateData && (
//         <div style={{ marginTop: "20px", padding: "20px", backgroundColor: "#f4fdf4", borderLeft: "6px solid #2E8B57", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
//           <h3 style={{ margin: "0 0 10px 0", color: "#2E8B57" }}>{activeStateData.name} Overview</h3>
//           <p style={{ margin: 0 }}>
//             Total Nurseries: <strong>{activeStateData.value}</strong>
//           </p>
//         </div>
//       )}
//   );
// }

// export default DashboardCharts;
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { FiActivity, FiBarChart2, FiFilter, FiPieChart, FiRotateCcw } from "react-icons/fi";
import api from "../../services/api";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
);

const palette = [
  "#1f7a50", "#60a878", "#b58b4c", "#6286b5", "#8c6caf",
  "#4c9da0", "#a5ad55", "#d17d57", "#63846d", "#7d9bb4",
  "#b27482", "#6e91bc", "#86a96b", "#bd9a57", "#719b8e"
];

const fetchOptions = async (url, signal) => {
  const { data } = await api.get(url, { signal });
  if (!Array.isArray(data)) {
    throw new Error("Filter options response was not a list");
  }

  return data;
};

const fetchChartItems = async (filters, signal) => {
  const { data } = await api.get("/dashboard-chart-data/", {
    params: {
      state_id: filters.state || undefined,
      district_id: filters.district || undefined,
      species_id: filters.species || undefined,
    },
    signal,
  });

  if (!data || !Array.isArray(data.items) || data.items.some(
    (item) => typeof item.name !== "string" || !Number.isFinite(item.value)
  )) {
    throw new Error("Dashboard chart response had an invalid shape");
  }

  return data.items;
};

const getAxisOptions = (t, onClick, isDark) => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  onClick,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#123324",
      titleFont: { weight: "600" },
      bodyFont: { weight: "500" },
      padding: 12,
      cornerRadius: 10,
      displayColors: false,
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: t("charts.statesClickDetails"),
        color: isDark ? "#c1d2c6" : "#557162",
        font: { weight: "600", size: 10 },
      },
      ticks: { maxRotation: 45, minRotation: 30, color: isDark ? "#c1d2c6" : "#63796c", font: { size: 9 } },
      grid: { display: false },
      border: { display: false },
    },
    y: {
      title: {
        display: true,
        text: t("charts.numberOfNurseries"),
        color: isDark ? "#c1d2c6" : "#557162",
        font: { weight: "600", size: 10 },
      },
      beginAtZero: true,
      ticks: { color: isDark ? "#c1d2c6" : "#63796c", font: { size: 9 }, padding: 8 },
      grid: { color: isDark ? "rgba(193, 210, 198, 0.12)" : "rgba(42, 82, 57, 0.08)" },
      border: { display: false },
    },
  },
});

function DashboardCharts() {
  const { t } = useTranslation();
  const [activeStateData, setActiveStateData] = useState(null);
  const [chartItems, setChartItems] = useState([]);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [chartError, setChartError] = useState("");
  const [isDark, setIsDark] = useState(() => document.documentElement.dataset.theme === "dark");
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [species, setSpecies] = useState([]);
  const [filters, setFilters] = useState({
    state: "",
    district: "",
    species: "",
    height: "",
  });
  const [filterError, setFilterError] = useState("");

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.dataset.theme === "dark");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetchOptions("/states/", controller.signal),
      fetchOptions("/species/", controller.signal),
    ])
      .then(([stateOptions, speciesOptions]) => {
        setStates(stateOptions);
        setSpecies(speciesOptions);
        setFilterError("");
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("Unable to load dashboard filter options:", error);
        setFilterError(t("booking.connectionError"));
      });

    return () => controller.abort();
  }, [t]);

  useEffect(() => {
    if (!filters.state) {
      setDistricts([]);
      return undefined;
    }

    const controller = new AbortController();
    fetchOptions(
      `/districts/?state_id=${encodeURIComponent(filters.state)}`,
      controller.signal
    )
      .then((districtOptions) => {
        setDistricts(districtOptions);
        setFilterError("");
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("Unable to load dashboard district options:", error);
        setDistricts([]);
        setFilterError(t("booking.connectionError"));
      });

    return () => controller.abort();
  }, [filters.state, t]);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrentRequest = true;

    if (filters.height) {
      setChartItems([]);
      setChartError("height");
      setIsChartLoading(false);
      return () => {
        isCurrentRequest = false;
        controller.abort();
      };
    }

    setIsChartLoading(true);
    setChartError("");
    setChartItems([]);
    fetchChartItems(filters, controller.signal)
      .then((items) => {
        if (isCurrentRequest) setChartItems(items);
      })
      .catch((error) => {
        if (!isCurrentRequest || controller.signal.aborted) return;
        console.error("Unable to load dashboard chart data:", error);
        setChartError("load");
      })
      .finally(() => {
        if (isCurrentRequest) setIsChartLoading(false);
      });

    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, [filters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === "state" ? { district: "" } : {}),
    }));
    setActiveStateData(null);
  };

  const resetFilters = () => {
    setFilters({ state: "", district: "", species: "", height: "" });
    setActiveStateData(null);
    setFilterError("");
    setChartError("");
  };

  const handleChartClick = (event, elements) => {
    if (!elements.length) return;
    const index = elements[0].index;
    const item = chartItems[index];
    if (item) setActiveStateData(item);
  };
  const axisOptions = getAxisOptions(t, handleChartClick, isDark);
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    onClick: handleChartClick,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 7,
          boxHeight: 7,
          padding: 10,
          color: isDark ? "#d3e1d7" : "#52695b",
          font: { size: 9, weight: "500" },
        },
      },
      tooltip: {
        backgroundColor: "#123324",
        padding: 12,
        cornerRadius: 10,
      },
    },
  };
  const chartLabels = chartItems.map((item) => item.name);
  const chartValues = chartItems.map((item) => item.value);
  const chartData = {
    labels: chartLabels,
    datasets: [{
      label: t("charts.totalNurseries"),
      data: chartValues,
    }],
  };
  const lineData = {
    ...chartData,
    datasets: chartData.datasets.map((dataset) => ({
      ...dataset,
      borderColor: "#1e8053",
      backgroundColor: "rgba(45, 145, 92, 0.13)",
      pointBackgroundColor: "#fff",
      pointBorderColor: "#1e8053",
      pointBorderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 6,
      borderWidth: 3,
      tension: 0.38,
      fill: true,
    })),
  };
  const barData = {
    ...chartData,
    datasets: chartData.datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: chartValues.map((_, index) => `${palette[index % palette.length]}cc`),
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 18,
    })),
  };
  const doughnutData = {
    ...chartData,
    datasets: chartData.datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: chartValues.map((_, index) => palette[index % palette.length]),
      borderColor: "#fff",
      borderWidth: 3,
      hoverOffset: 7,
    })),
  };

  return (
    <div className="charts-wrapper">
      <div className="charts-heading">
        <div className="charts-heading__copy">
          <span className="section-title__eyebrow">{t("dashboard.analytics")}</span>
          <h2>{t("dashboard.reportsCharts")}</h2>
          <p>{t("dashboard.reportsDescription")}</p>
        </div>
        <div className="chart-filters" role="group" aria-label={t("dashboard.filter")}>
          <div className="chart-filters__title">
            <FiFilter aria-hidden="true" />
            <span>{t("dashboard.filter")}</span>
          </div>
          <label className="chart-filter">
            <span>{t("booking.state")}</span>
            <select name="state" value={filters.state} onChange={handleFilterChange}>
              <option value="">{t("booking.selectState")}</option>
              {states.map((state) => (
                <option key={state.state_id} value={state.state_id}>{state.state_name}</option>
              ))}
            </select>
          </label>
          <label className="chart-filter">
            <span>{t("booking.district")}</span>
            <select name="district" value={filters.district} onChange={handleFilterChange} disabled={!filters.state}>
              <option value="">{t("booking.selectDistrict")}</option>
              {districts.map((district) => (
                <option key={district.district_id} value={district.district_id}>{district.district_name}</option>
              ))}
            </select>
          </label>
          <label className="chart-filter">
            <span>{t("booking.species")}</span>
            <select name="species" value={filters.species} onChange={handleFilterChange}>
              <option value="">{t("booking.select")}</option>
              {species.map((item) => (
                <option key={item.Species_ID} value={item.Species_ID}>{item.Species_Name}</option>
              ))}
            </select>
          </label>
          <label className="chart-filter">
            <span>{t("dashboard.height")}</span>
            <select name="height" value={filters.height} onChange={handleFilterChange}>
              <option value="">{t("dashboard.height")}</option>
              <option value="0-30">0 - 30 cm</option>
              <option value="31-60">31 - 60 cm</option>
              <option value="61+">61 cm+</option>
            </select>
          </label>
          <button type="button" className="chart-filter-reset" onClick={resetFilters}>
            <FiRotateCcw aria-hidden="true" />
            {t("dashboard.reset")}
          </button>
        </div>
      </div>
      {filterError && (
        <p className="chart-filter-error" role="alert">{filterError}</p>
      )}
      {filters.species && (
        <p className="chart-filter-note">{t("charts.speciesCountNote")}</p>
      )}
      {chartError && (
        <p className="chart-filter-error" role="alert">
          {chartError === "height" ? t("charts.heightFilterUnavailable") : t("booking.connectionError")}
        </p>
      )}
      {isChartLoading && <p role="status">{t("charts.loading")}</p>}
      {!isChartLoading && !chartError && chartItems.length === 0 && (
        <p role="status">{t("charts.noData")}</p>
      )}
      {!isChartLoading && !chartError && chartItems.length > 0 && <div className="charts-row">
        <article className="chart-card">
          <header className="chart-card__header">
            <span className="chart-card__icon chart-card__icon--trend"><FiActivity aria-hidden="true" /></span>
            <div>
              <h3>{t("charts.stateTrend")}</h3>
              <p>{t("charts.totalNurseries")}</p>
            </div>
          </header>
          <div className="chart-card__plot">
            <Line data={lineData} options={axisOptions} />
          </div>
        </article>
        <article className="chart-card">
          <header className="chart-card__header">
            <span className="chart-card__icon chart-card__icon--bars"><FiBarChart2 aria-hidden="true" /></span>
            <div>
              <h3>{t("charts.locationComparison")}</h3>
              <p>{t("charts.numberOfNurseries")}</p>
            </div>
          </header>
          <div className="chart-card__plot">
            <Bar data={barData} options={axisOptions} />
          </div>
        </article>
        <article className="chart-card chart-card--donut">
          <header className="chart-card__header">
            <span className="chart-card__icon chart-card__icon--share"><FiPieChart aria-hidden="true" /></span>
            <div>
              <h3>{t("charts.nurseryShare")}</h3>
              <p>{t("charts.totalNurseries")}</p>
            </div>
          </header>
          <div className="chart-card__plot">
            <Doughnut data={doughnutData} options={donutOptions} />
          </div>
        </article>
      </div>}
      {activeStateData && (
        <div className="chart-selection">
          <h3>{t("charts.stateOverview", { state: activeStateData.name })}</h3>
          <p>{t("charts.totalNurseries")}: <strong>{activeStateData.value}</strong></p>
        </div>
      )}
    </div>
  );
}

export default DashboardCharts;