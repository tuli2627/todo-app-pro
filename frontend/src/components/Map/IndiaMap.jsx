// import { Chart } from "react-google-charts";

// const data = [
//   ["State", "Nurseries"],

//   ["IN-AN", 13],
//   ["IN-AR", 3],
//   ["IN-GJ", 299],
//   ["IN-HP", 27],
//   ["IN-JK", 49],
//   ["IN-KA", 206],
//   ["IN-MP", 40],
//   ["IN-MN", 50],
//   ["IN-MZ", 46],
//   ["IN-PB", 33],
//   ["IN-RJ", 6],
//   ["IN-SK", 7],
//   ["IN-TG", 77],
//   ["IN-TR", 8],
//   ["IN-WB", 3],
// ];

// const options = {
//   region: "IN",
//   domain: "IN",
//   displayMode: "regions",
//   resolution: "provinces",

//   datalessRegionColor: "#ECEFF1",

//   colorAxis: {
//   colors: [
//     "#E53935", // Red
//     "#FB8C00", // Orange
//     "#FDD835", // Yellow
//     "#43A047", // Green
//     "#00897B", // Teal
//     "#1E88E5", // Blue
//     "#3949AB", // Indigo
//     "#8E24AA", // Purple
//     "#D81B60", // Pink
//     "#6D4C41", // Brown
//     "#7CB342", // Lime
//     "#00ACC1", // Cyan
//     "#5E35B1", // Deep Purple
//     "#EF5350", // Light Red
//     "#26A69A", // Aqua Green
//     "#FF7043", // Deep Orange
//     "#C0CA33", // Olive
//     "#AB47BC", // Violet
//     "#29B6F6", // Sky Blue
//     "#FFA726"  // Amber
//   ]
// },

//   legend: "none",

//   backgroundColor: "transparent",

//   tooltip: {
//     trigger: "focus",
//   },
// };

// function IndiaMap() {
//   return (
//     <Chart
//       chartType="GeoChart"
//       width="100%"
//       height="450px"
//       data={data}
//       options={options}
//     />
//   );
// }

// export default IndiaMap;

          
import React, { useState, useEffect } from "react";
import { Chart } from "react-google-charts";

const options = {
  region: "IN",
  domain: "IN",
  displayMode: "regions",
  resolution: "provinces",
  datalessRegionColor: "#FFFFFF",
  colorAxis: {
    colors: [
      "#E2F0D9", // Soft light green
      "#C5E0B4",
      "#A8D08D",
      "#548235",
      "#1E4D2B", // Deep forest green
    ],
  },
  legend: "none",
  backgroundColor: "transparent",
  tooltip: { trigger: "focus" },
};

function IndiaMap() {
  const [chartData, setChartData] = useState([["State", "Nurseries"]]);
  const [totalNurseries, setTotalNurseries] = useState(0);
  const [highestState, setHighestState] = useState({ name: "-", count: 0 });
  const [selectedStateCode, setSelectedStateCode] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch state nursery counts for GeoChart heatmap on load
  useEffect(() => {
    fetch("/api/map-data/")
      .then((res) => res.json())
      .then((data) => {
        const formattedChartData = [["State", "Nurseries"]];
        let total = 0;
        let maxCount = 0;
        let maxStateName = "-";

        data.forEach((item) => {
          let code = item.state_code;
          if (code && !code.startsWith("IN-")) {
            code = `IN-${code}`;
          }

          const count = Number(item.nurseries_count) || 0;

          if (code && count > 0) {
            formattedChartData.push([code, count]);
            total += count;

            if (count > maxCount) {
              maxCount = count;
              maxStateName = item.state_name || code;
            }
          }
        });

        setChartData(formattedChartData);
        setTotalNurseries(total);
        setHighestState({ name: maxStateName, count: maxCount });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading map data:", err);
        setLoading(false);
      });
  }, []);

  // 2. Fetch nursery list when a state region is clicked on the map
  const fetchStateNurseries = (stateCode) => {
    setSelectedStateCode(stateCode);
    setModalData(null);

    fetch(`/api/nurseries/state-details/?stateCode=${stateCode}`)
      .then((res) => res.json())
      .then((data) => setModalData(data))
      .catch((err) => console.error("Error fetching state details:", err));
  };

  // GeoChart click handler
  const chartEvents = [
    {
      eventName: "select",
      callback: ({ chartWrapper }) => {
        const chart = chartWrapper.getChart();
        const selection = chart.getSelection();

        if (!selection || selection.length === 0) return;

        const selectedRowIndex = selection[0].row;
        if (selectedRowIndex !== null && selectedRowIndex !== undefined) {
          const stateCode = chartData[selectedRowIndex + 1][0];
          fetchStateNurseries(stateCode);
        }
      },
    },
  ];

  return (
    <div className="map-card-container">
      {/* Header Banner */}
      <div className="map-card-header">
        <span className="map-header-icon">🌱</span>
        <span className="map-header-title">
          Total number of Registered Nurseries (State-wise)
        </span>
      </div>

      {/* GeoChart Map */}
      <div className="map-chart-body">
        {loading ? (
          <p style={{ textAlign: "center", padding: "20px" }}>Loading Map Data...</p>
        ) : (
          <Chart
            chartType="GeoChart"
            width="100%"
            height="360px"
            data={chartData}
            options={options}
            chartEvents={chartEvents}
          />
        )}
      </div>

      {/* Footer Bar */}
      <div className="map-card-footer">
        <div className="footer-item">
          Total Nurseries: <strong>{totalNurseries}</strong>
        </div>
        <div className="footer-item density-bar-container">
          <span>Density:</span>
          <div className="gradient-density-bar"></div>
        </div>
        <div className="footer-item">
          Highest: <strong>{highestState.name} ({highestState.count})</strong>
        </div>
      </div>

      {/* State Nurseries Detail Modal */}
      {selectedStateCode && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <button
              style={closeBtnStyle}
              onClick={() => {
                setSelectedStateCode(null);
                setModalData(null);
              }}
            >
              ×
            </button>

            {!modalData ? (
              <p>Loading details for {selectedStateCode}...</p>
            ) : (
              <div>
                <h2>{modalData.stateName || selectedStateCode} Nurseries</h2>
                <p>Total Registered: <strong>{modalData.total}</strong></p>

                <div style={nurseryGridStyle}>
                  {modalData.nurseries && modalData.nurseries.length > 0 ? (
                    modalData.nurseries.map((item) => (
                      <div key={item.id} style={nurseryCardStyle}>
                        {item.photoUrl && (
                          <img
                            src={item.photoUrl}
                            alt={item.name}
                            style={{
                              width: "100%",
                              height: "120px",
                              objectFit: "cover",
                              borderRadius: "4px",
                            }}
                          />
                        )}
                        <h4 style={{ margin: "8px 0 4px" }}>{item.name}</h4>
                        {item.address && (
                          <p style={{ fontSize: "12px", margin: "2px 0" }}>
                            📍 {item.address}
                          </p>
                        )}
                        {item.phone && (
                          <p style={{ fontSize: "12px", color: "#555" }}>
                            📞 {item.phone}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p>No active nurseries found for this state.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Styles for Modal
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalCardStyle = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "8px",
  maxWidth: "650px",
  width: "90%",
  maxHeight: "80vh",
  overflowY: "auto",
  position: "relative",
};

const closeBtnStyle = {
  position: "absolute",
  top: "10px",
  right: "15px",
  fontSize: "24px",
  background: "none",
  border: "none",
  cursor: "pointer",
};

const nurseryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "12px",
  marginTop: "15px",
};

const nurseryCardStyle = {
  border: "1px solid #ddd",
  borderRadius: "6px",
  padding: "10px",
  backgroundColor: "#f9f9f9",
};

export default IndiaMap;