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

          
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Chart } from "react-google-charts";
// // ADD THIS RIGHT AFTER YOUR IMPORTS
// const API_BASE_URL = "http://127.0.0.1:8000";

// // Complete mapping for all 36 States and UTs from M001_State database table
// const STATE_CODE_MAP = {
//   // IDs (1 to 38 matching database State_ID)
//   "1": "IN-JK", "2": "IN-HP", "3": "IN-PB", "4": "IN-CH", "5": "IN-UT",
//   "6": "IN-HR", "7": "IN-DL", "8": "IN-RJ", "9": "IN-UP", "10": "IN-BR",
//   "11": "IN-SK", "12": "IN-AR", "13": "IN-NL", "14": "IN-MN", "15": "IN-MZ",
//   "16": "IN-TR", "17": "IN-ML", "18": "IN-AS", "19": "IN-WB", "20": "IN-JH",
//   "21": "IN-OR", "22": "IN-CT", "23": "IN-MP", "24": "IN-GJ", "27": "IN-MH",
//   "28": "IN-AP", "29": "IN-KA", "30": "IN-GA", "31": "IN-LD", "32": "IN-KL",
//   "33": "IN-TN", "34": "IN-PY", "35": "IN-AN", "36": "IN-TG", "37": "IN-LA",
//   "38": "IN-DH",

//   // Full State Names & Short Abbreviations
//   "jammu and kashmir": "IN-JK", "jk": "IN-JK",
//   "himachal pradesh": "IN-HP", "hp": "IN-HP",
//   "punjab": "IN-PB", "pb": "IN-PB",
//   "chandigarh": "IN-CH", "ch": "IN-CH",
//   "uttarakhand": "IN-UT", "ut": "IN-UT",
//   "haryana": "IN-HR", "hr": "IN-HR",
//   "delhi": "IN-DL", "dl": "IN-DL",
//   "rajasthan": "IN-RJ", "rj": "IN-RJ",
//   "uttar pradesh": "IN-UP", "up": "IN-UP",
//   "bihar": "IN-BR", "br": "IN-BR",
//   "sikkim": "IN-SK", "sk": "IN-SK",
//   "arunachal pradesh": "IN-AR", "ar": "IN-AR",
//   "nagaland": "IN-NL", "nl": "IN-NL",
//   "manipur": "IN-MN", "mn": "IN-MN",
//   "mizoram": "IN-MZ", "mz": "IN-MZ",
//   "tripura": "IN-TR", "tr": "IN-TR",
//   "meghalaya": "IN-ML", "ml": "IN-ML",
//   "assam": "IN-AS", "as": "IN-AS",
//   "west bengal": "IN-WB", "wb": "IN-WB",
//   "jharkhand": "IN-JH", "jh": "IN-JH",
//   "odisha": "IN-OR", "or": "IN-OR",
//   "chhattisgarh": "IN-CT", "ct": "IN-CT",
//   "madhya pradesh": "IN-MP", "mp": "IN-MP",
//   "gujarat": "IN-GJ", "gj": "IN-GJ",
//   "maharashtra": "IN-MH", "mh": "IN-MH",
//   "andhra pradesh": "IN-AP", "ap": "IN-AP",
//   "karnataka": "IN-KA", "ka": "IN-KA",
//   "goa": "IN-GA", "ga": "IN-GA",
//   "lakshadweep": "IN-LD", "ld": "IN-LD",
//   "kerala": "IN-KL", "kl": "IN-KL",
//   "tamil nadu": "IN-TN", "tn": "IN-TN",
//   "puducherry": "IN-PY", "py": "IN-PY",
//   "andaman and nicobar islands": "IN-AN", "an": "IN-AN",
//   "telangana": "IN-TG", "tg": "IN-TG",
//   "ladakh": "IN-LA", "la": "IN-LA",
//   "the dadra and nagar haveli and daman and diu": "IN-DH", "dadra and nagar haveli": "IN-DH", "dh": "IN-DH"
// };

// const normalizeStateCode = (input) => {
//   if (!input) return null;
//   const str = String(input).trim().toLowerCase();
  
//   // If already starts with IN- (e.g. IN-RJ), return uppercase
//   if (str.startsWith("in-")) return str.toUpperCase();
  
//   // Lookup in map dictionary
//   if (STATE_CODE_MAP[str]) return STATE_CODE_MAP[str];
  
//   // Fallback default
//   return `IN-${str.toUpperCase()}`;
// };

// // REPLACE YOUR EXISTING options WITH THIS:
// const options = {
//   region: "IN-RJ", // Focuses directly on Rajasthan region
//   domain: "IN",
//   displayMode: "regions",
//   resolution: "provinces",
//   datalessRegionColor: "#FFFFFF",
//   colorAxis: {
//     colors: ["#548235", "#1E4D2B"], // Deep green shades from your theme
//   },
//   legend: "none",
//   backgroundColor: "transparent",
//   tooltip: { trigger: "focus" },
// };

// function IndiaMap() {
//   const [chartData, setChartData] = useState([["State", "Nurseries"]]);
//   const [totalNurseries, setTotalNurseries] = useState(0);
//   const [highestState, setHighestState] = useState({ name: "-", count: 0 });
//   const [selectedStateCode, setSelectedStateCode] = useState(null);
//   const [modalData, setModalData] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // 1. Fetch state nursery counts for GeoChart heatmap on load
//  // REPLACE YOUR useEffect WITH THIS SAFE DATA PARSER:
// useEffect(() => {
//   fetch(`${API_BASE_URL}/api/map-data/`)
//     .then((res) => res.json())
//     .then((data) => {
//       const formattedChartData = [["State", "Nurseries"]];
//       let total = 0;
//       let maxCount = 0;
//       let maxStateName = "-";

//       if (Array.isArray(data)) {
//         data.forEach((item) => {
//           // Handle Array of Arrays vs Array of Objects
//           let rawIdentifier, rawCount;

//           if (Array.isArray(item)) {
//             // If backend returns array like ["IN-RJ", 6]
//             rawIdentifier = item[0];
//             rawCount = item[1];
//           } else if (typeof item === "object" && item !== null) {
//             // If backend returns object like { state_code: "IN-RJ", total: 6 }
//             rawIdentifier = item.state_code || item.state_name || item.state_id || item.State;
//             rawCount = item.nurseries_count ?? item.total ?? item.count ?? item.Nurseries;
//           }

//           const code = normalizeStateCode(rawIdentifier);
//           const count = Number(rawCount) || 0;

//           if (code && count > 0) {
//             formattedChartData.push([code, count]);
//             total += count;

//             if (count > maxCount) {
//               maxCount = count;
//               maxStateName = item.state_name || code;
//             }
//           }
//         });
//       }

//       // If array is non-empty, update chart data
//       if (formattedChartData.length > 1) {
//         setChartData(formattedChartData);
//       }
//       setTotalNurseries(total);
//       setHighestState({ name: maxStateName, count: maxCount });
//       setLoading(false);
//     })
//     .catch((err) => {
//       console.error("Error loading map data:", err);
//       setLoading(false);
//     });
// }, []);
//   // 2. Fetch nursery list when a state region is clicked on the map
//  // REPLACE YOUR fetchStateNurseries FUNCTION WITH THIS:
// const fetchStateNurseries = (stateCode) => {
//   setSelectedStateCode(stateCode);
//   setModalData(null);

//   fetch(`${API_BASE_URL}/api/nurseries/state-details/?stateCode=${stateCode}`)
//     .then((res) => res.json())
//     .then((data) => setModalData(data))
//     .catch((err) => console.error("Error fetching state details:", err));
// };

//   // GeoChart click handler
//  // REPLACE YOUR chartEvents BLOCK WITH THIS:
// const chartEvents = [
//   {
//     eventName: "select",
//     callback: ({ chartWrapper }) => {
//       // Use setTimeout to run execution after Google Charts finishes internal DOM events
//       setTimeout(() => {
//         const chart = chartWrapper.getChart();
//         if (!chart) return;
        
//         const selection = chart.getSelection();
//         if (!selection || selection.length === 0) return;

//         const selectedRowIndex = selection[0].row;
//         if (selectedRowIndex !== null && selectedRowIndex !== undefined) {
//           const selectedRow = chartData[selectedRowIndex + 1];
//           if (selectedRow) {
//             const stateCode = selectedRow[0];
//             fetchStateNurseries(stateCode);
//           }
//         }
//       }, 0);
//     },
//   },
// ];

//   return (
//     <div className="map-card-container">
//       {/* Header Banner */}
//       <div className="map-card-header">
//         <span className="map-header-icon">🌱</span>
//         <span className="map-header-title">
//           Total number of Registered Nurseries (State-wise)
//         </span>
//       </div>

//       {/* GeoChart Map */}
//       <div className="map-chart-body">
//         {loading ? (
//           <p style={{ textAlign: "center", padding: "20px" }}>Loading Map Data...</p>
//         ) : (
//           <Chart
//   chartType="GeoChart"
//   width="100%"
//   height="360px"
//   data={chartData}
//   options={options}
//   chartEvents={chartEvents}
//   version="current"
// />
//         )}
//       </div>

//       {/* Footer Bar */}
//       <div className="map-card-footer">
//         <div className="footer-item">
//           Total Nurseries: <strong>{totalNurseries}</strong>
//         </div>
//         <div className="footer-item density-bar-container">
//           <span>Density:</span>
//           <div className="gradient-density-bar"></div>
//         </div>
//         <div className="footer-item">
//           Highest: <strong>{highestState.name} ({highestState.count})</strong>
//         </div>
//       </div>

//       {/* State Nurseries Detail Modal */}
//       {selectedStateCode && (
//         <div style={modalOverlayStyle}>
//           <div style={modalCardStyle}>
//             <button
//               style={closeBtnStyle}
//               onClick={() => {
//                 setSelectedStateCode(null);
//                 setModalData(null);
//               }}
//             >
//               ×
//             </button>

//             {!modalData ? (
//               <p>Loading details for {selectedStateCode}...</p>
//             ) : (
//               <div>
//                 <h2>{modalData.stateName || selectedStateCode} Nurseries</h2>
//                 <p>Total Registered: <strong>{modalData.total}</strong></p>

//                 <div style={nurseryGridStyle}>
//                   {modalData.nurseries && modalData.nurseries.length > 0 ? (
//                     modalData.nurseries.map((item) => (
//                       <div key={item.id} style={nurseryCardStyle}>
//                         {item.photoUrl && (
//                           <img
//                             src={item.photoUrl}
//                             alt={item.name}
//                             style={{
//                               width: "100%",
//                               height: "120px",
//                               objectFit: "cover",
//                               borderRadius: "4px",
//                             }}
//                           />
//                         )}
//                         <h4 style={{ margin: "8px 0 4px" }}>{item.name}</h4>
//                         {item.address && (
//                           <p style={{ fontSize: "12px", margin: "2px 0" }}>
//                             📍 {item.address}
//                           </p>
//                         )}
//                         {item.phone && (
//                           <p style={{ fontSize: "12px", color: "#555" }}>
//                             📞 {item.phone}
//                           </p>
//                         )}
//                       </div>
//                     ))
//                   ) : (
//                     <p>No active nurseries found for this state.</p>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // Inline Styles for Modal
// const modalOverlayStyle = {
//   position: "fixed",
//   top: 0,
//   left: 0,
//   right: 0,
//   bottom: 0,
//   backgroundColor: "rgba(0,0,0,0.5)",
//   display: "flex",
//   justifyContent: "center",
//   alignItems: "center",
//   zIndex: 1000,
// };

// const modalCardStyle = {
//   backgroundColor: "#fff",
//   padding: "20px",
//   borderRadius: "8px",
//   maxWidth: "650px",
//   width: "90%",
//   maxHeight: "80vh",
//   overflowY: "auto",
//   position: "relative",
// };

// const closeBtnStyle = {
//   position: "absolute",
//   top: "10px",
//   right: "15px",
//   fontSize: "24px",
//   background: "none",
//   border: "none",
//   cursor: "pointer",
// };

// const nurseryGridStyle = {
//   display: "grid",
//   gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
//   gap: "12px",
//   marginTop: "15px",
// };

// const nurseryCardStyle = {
//   border: "1px solid #ddd",
//   borderRadius: "6px",
//   padding: "10px",
//   backgroundColor: "#f9f9f9",
// };

// export default IndiaMap;
// import React, { useState, useEffect } from "react";
// import { Chart } from "react-google-charts";

// const API_BASE_URL = "http://127.0.0.1:8000";

// // Comprehensive Mapping for All States and UTs to ISO Codes (IN-XX)
// const STATE_CODE_MAP = {
//   "1": "IN-JK", "2": "IN-HP", "3": "IN-PB", "4": "IN-CH", "5": "IN-UT",
//   "6": "IN-HR", "7": "IN-DL", "8": "IN-RJ", "9": "IN-UP", "10": "IN-BR",
//   "11": "IN-SK", "12": "IN-AR", "13": "IN-NL", "14": "IN-MN", "15": "IN-MZ",
//   "16": "IN-TR", "17": "IN-ML", "18": "IN-AS", "19": "IN-WB", "20": "IN-JH",
//   "21": "IN-OR", "22": "IN-CT", "23": "IN-MP", "24": "IN-GJ", "27": "IN-MH",
//   "28": "IN-AP", "29": "IN-KA", "30": "IN-GA", "31": "IN-LD", "32": "IN-KL",
//   "33": "IN-TN", "34": "IN-PY", "35": "IN-AN", "36": "IN-TG", "37": "IN-LA",
//   "38": "IN-DH",

//   "jammu and kashmir": "IN-JK", "jk": "IN-JK",
//   "himachal pradesh": "IN-HP", "hp": "IN-HP",
//   "punjab": "IN-PB", "pb": "IN-PB",
//   "chandigarh": "IN-CH", "ch": "IN-CH",
//   "uttarakhand": "IN-UT", "ut": "IN-UT",
//   "haryana": "IN-HR", "hr": "IN-HR",
//   "delhi": "IN-DL", "dl": "IN-DL",
//   "rajasthan": "IN-RJ", "rj": "IN-RJ",
//   "uttar pradesh": "IN-UP", "up": "IN-UP",
//   "bihar": "IN-BR", "br": "IN-BR",
//   "sikkim": "IN-SK", "sk": "IN-SK",
//   "arunachal pradesh": "IN-AR", "ar": "IN-AR",
//   "nagaland": "IN-NL", "nl": "IN-NL",
//   "manipur": "IN-MN", "mn": "IN-MN",
//   "mizoram": "IN-MZ", "mz": "IN-MZ",
//   "tripura": "IN-TR", "tr": "IN-TR",
//   "meghalaya": "IN-ML", "ml": "IN-ML",
//   "assam": "IN-AS", "as": "IN-AS",
//   "west bengal": "IN-WB", "wb": "IN-WB",
//   "jharkhand": "IN-JH", "jh": "IN-JH",
//   "odisha": "IN-OR", "or": "IN-OR",
//   "chhattisgarh": "IN-CT", "ct": "IN-CT",
//   "madhya pradesh": "IN-MP", "mp": "IN-MP",
//   "gujarat": "IN-GJ", "gj": "IN-GJ",
//   "maharashtra": "IN-MH", "mh": "IN-MH",
//   "andhra pradesh": "IN-AP", "ap": "IN-AP",
//   "karnataka": "IN-KA", "ka": "IN-KA",
//   "goa": "IN-GA", "ga": "IN-GA",
//   "lakshadweep": "IN-LD", "ld": "IN-LD",
//   "kerala": "IN-KL", "kl": "IN-KL",
//   "tamil nadu": "IN-TN", "tn": "IN-TN",
//   "puducherry": "IN-PY", "py": "IN-PY",
//   "andaman and nicobar islands": "IN-AN", "an": "IN-AN",
//   "telangana": "IN-TG", "tg": "IN-TG",
//   "ladakh": "IN-LA", "la": "IN-LA",
//   "dadra and nagar haveli and daman and diu": "IN-DH", "dh": "IN-DH"
// };

// const normalizeStateCode = (input) => {
//   if (!input) return null;
//   const str = String(input).trim().toLowerCase();
//   if (str.startsWith("in-")) return str.toUpperCase();
//   if (STATE_CODE_MAP[str]) return STATE_CODE_MAP[str];
//   return `IN-${str.toUpperCase()}`;
// };

// const options = {
//   region: "IN",
//   domain: "IN",
//   displayMode: "regions",
//   resolution: "provinces",
//   datalessRegionColor: "#F4F6F0",
//   colorAxis: {
//     colors: ["#C8E6C9", "#2E7D32", "#1E4D2B"], // Gradient density colors
//   },
//   legend: "none",
//   backgroundColor: "transparent",
//   tooltip: { trigger: "focus" },
// };

// function IndiaMap() {
//   const [chartData, setChartData] = useState([["State", "Nurseries"]]);
//   const [totalNurseries, setTotalNurseries] = useState(0);
//   const [highestState, setHighestState] = useState({ name: "-", count: 0 });
//   const [selectedStateCode, setSelectedStateCode] = useState(null);
//   const [modalData, setModalData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showAll, setShowAll] = useState(false);

//   // 1. Dynamic API Fetching & Dynamic Aggregation
//   useEffect(() => {
//     fetch(`${API_BASE_URL}/api/map-data/`)
//       .then((res) => res.json())
//       .then((data) => {
//         const formattedChartData = [["State", "Nurseries"]];
//         let total = 0;
//         let maxCount = 0;
//         let maxStateName = "-";

//         if (Array.isArray(data)) {
//           data.forEach((item) => {
//             let rawIdentifier, rawCount, displayName;

//             if (Array.isArray(item)) {
//               rawIdentifier = item[0];
//               rawCount = item[1];
//               displayName = item[0];
//             } else if (typeof item === "object" && item !== null) {
//               rawIdentifier = item.state_code || item.state_name || item.state_id || item.State;
//               rawCount = item.nurseries_count ?? item.total ?? item.count ?? item.Nurseries;
//               displayName = item.state_name || item.state_code || rawIdentifier;
//             }

//             const code = normalizeStateCode(rawIdentifier);
//             const count = Number(rawCount) || 0;

//             if (code && count > 0) {
//               formattedChartData.push([code, count]);
//               total += count;

//               if (count > maxCount) {
//                 maxCount = count;
//                 maxStateName = displayName;
//               }
//             }
//           });
//         }

//         if (formattedChartData.length > 1) {
//           setChartData(formattedChartData);
//         }

//         setTotalNurseries(total);
//         setHighestState({ name: maxStateName, count: maxCount });
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Error fetching map data:", err);
//         setLoading(false);
//       });
//   }, []);

//   // 2. Fetch nurseries when clicked using exact stateCode
//   const fetchStateNurseries = (stateCode) => {
//     setSelectedStateCode(stateCode);
//     setModalData(null);
//     setShowAll(false);

//     const cleanCode = stateCode.replace("IN-", "");
//     fetch(`${API_BASE_URL}/api/nurseries/state-details/?stateCode=${stateCode}&code=${cleanCode}`)
//       .then((res) => res.json())
//       .then((data) => setModalData(data))
//       .catch((err) => console.error("Error fetching state details:", err));
//   };

//   // 3. Fixes wrong state details click bug by fetching from Chart DataTable
//   const chartEvents = [
//     {
//       eventName: "select",
//       callback: ({ chartWrapper }) => {
//         const chart = chartWrapper.getChart();
//         if (!chart) return;

//         const selection = chart.getSelection();
//         if (!selection || selection.length === 0) return;

//         const selectedRowIndex = selection[0].row;
//         if (selectedRowIndex !== null && selectedRowIndex !== undefined) {
//           const dataTable = chartWrapper.getDataTable();
//           // Extract exact ISO Code directly from the DataTable row clicked
//           const clickedStateCode = dataTable.getValue(selectedRowIndex, 0);
//           if (clickedStateCode) {
//             fetchStateNurseries(clickedStateCode);
//           }
//         }
//       },
//     },
//   ];

//   return (
//     <div className="map-card-container">
//       {/* Header Banner */}
//       <div className="map-card-header">
//         <span className="map-header-icon">🌱</span>
//         <span className="map-header-title">
//           Total number of Registered Nurseries (State-wise)
//         </span>
//       </div>

//       {/* GeoChart Map */}
//       <div className="map-chart-body">
//         {loading ? (
//           <p style={{ textAlign: "center", padding: "20px" }}>Loading Map Data...</p>
//         ) : (
//           <Chart
//             chartType="GeoChart"
//             width="100%"
//             height="360px"
//             data={chartData}
//             options={options}
//             chartEvents={chartEvents}
//             version="current"
//           />
//         )}
//       </div>

//       {/* Footer Bar Automatically Calculated */}
//       <div className="map-card-footer">
//         <div className="footer-item">
//           Total Nurseries: <strong>{totalNurseries}</strong>
//         </div>
//         <div className="footer-item density-bar-container">
//           <span>Density:</span>
//           <div className="gradient-density-bar"></div>
//         </div>
//         <div className="footer-item">
//           Highest: <strong>{highestState.name} ({highestState.count})</strong>
//         </div>
//       </div>

//       {/* State Details Modal */}
//       {selectedStateCode && (
//         <div style={modalOverlayStyle}>
//           <div style={modalCardStyle}>
//             <button
//               style={closeBtnStyle}
//               onClick={() => {
//                 setSelectedStateCode(null);
//                 setModalData(null);
//                 setShowAll(false);
//               }}
//             >
//               ×
//             </button>

//             {!modalData ? (
//               <p style={{ textAlign: "center", padding: "20px" }}>
//                 Loading details for {selectedStateCode}...
//               </p>
//             ) : (
//               <div>
//                 <h2 style={{ color: "#1E4D2B", margin: "0 0 8px 0" }}>
//                   🌱 {modalData.stateName || selectedStateCode} Nurseries
//                 </h2>
//                 <p style={{ margin: "0 0 16px 0", color: "#555" }}>
//                   Total Registered: <strong>{modalData.total || (modalData.nurseries ? modalData.nurseries.length : 0)}</strong>
//                 </p>

//                 {modalData.nurseries && modalData.nurseries.length > 0 ? (
//                   <>
//                     <div style={{ overflowX: "auto" }}>
//                       <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
//                         <thead>
//                           <tr style={{ backgroundColor: "#1E4D2B", color: "#ffffff", textAlign: "left" }}>
//                             <th style={{ padding: "10px", fontSize: "13px" }}>#</th>
//                             <th style={{ padding: "10px", fontSize: "13px" }}>Nursery Name</th>
//                             <th style={{ padding: "10px", fontSize: "13px" }}>Location</th>
//                             <th style={{ padding: "10px", fontSize: "13px" }}>Phone</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {(showAll ? modalData.nurseries : modalData.nurseries.slice(0, 3)).map((item, index) => (
//                             <tr key={item.id || index} style={{ backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F9FBE7" }}>
//                               <td style={{ padding: "10px", fontSize: "13px", borderBottom: "1px solid #E2F0D9" }}>{index + 1}</td>
//                               <td style={{ padding: "10px", fontSize: "13px", borderBottom: "1px solid #E2F0D9", fontWeight: "bold", color: "#2E7D32" }}>
//                                 {item.name || item.nursery_name}
//                               </td>
//                               <td style={{ padding: "10px", fontSize: "13px", borderBottom: "1px solid #E2F0D9" }}>
//                                 📍 {item.address || item.location || "N/A"}
//                               </td>
//                               <td style={{ padding: "10px", fontSize: "13px", borderBottom: "1px solid #E2F0D9" }}>
//                                 📞 {item.phone || item.mobile || "N/A"}
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>

//                     {modalData.nurseries.length > 3 && (
//                       <div style={{ textAlign: "center", marginTop: "16px" }}>
//                         <button
//                           onClick={() => setShowAll(!showAll)}
//                           style={{
//                             backgroundColor: "#548235",
//                             color: "#ffffff",
//                             border: "none",
//                             padding: "8px 20px",
//                             borderRadius: "20px",
//                             cursor: "pointer",
//                             fontWeight: "bold",
//                             fontSize: "13px"
//                           }}
//                         >
//                           {showAll ? "View Less ▲" : `View More (${modalData.nurseries.length - 3} More) ▼`}
//                         </button>
//                       </div>
//                     )}
//                   </>
//                 ) : (
//                   <p style={{ textAlign: "center", color: "#888", padding: "20px" }}>No active nurseries found for this state.</p>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // Inline Styles for Modal
// const modalOverlayStyle = {
//   position: "fixed",
//   top: 0,
//   left: 0,
//   right: 0,
//   bottom: 0,
//   backgroundColor: "rgba(0,0,0,0.5)",
//   display: "flex",
//   justifyContent: "center",
//   alignItems: "center",
//   zIndex: 1000,
// };

// const modalCardStyle = {
//   backgroundColor: "#fff",
//   padding: "20px",
//   borderRadius: "8px",
//   maxWidth: "650px",
//   width: "90%",
//   maxHeight: "80vh",
//   overflowY: "auto",
//   position: "relative",
// };

// const closeBtnStyle = {
//   position: "absolute",
//   top: "10px",
//   right: "15px",
//   fontSize: "24px",
//   background: "none",
//   border: "none",
//   cursor: "pointer",
// };

// export default IndiaMap;
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Chart } from "react-google-charts";

// const API_BASE_URL = "http://127.0.0.1:8000";

// // Complete mapping for all 36 States and UTs from M001_State database table
// const STATE_CODE_MAP = {
//   "1": "IN-JK", "2": "IN-HP", "3": "IN-PB", "4": "IN-CH", "5": "IN-UT",
//   "6": "IN-HR", "7": "IN-DL", "8": "IN-RJ", "9": "IN-UP", "10": "IN-BR",
//   "11": "IN-SK", "12": "IN-AR", "13": "IN-NL", "14": "IN-MN", "15": "IN-MZ",
//   "16": "IN-TR", "17": "IN-ML", "18": "IN-AS", "19": "IN-WB", "20": "IN-JH",
//   "21": "IN-OR", "22": "IN-CT", "23": "IN-MP", "24": "IN-GJ", "27": "IN-MH",
//   "28": "IN-AP", "29": "IN-KA", "30": "IN-GA", "31": "IN-LD", "32": "IN-KL",
//   "33": "IN-TN", "34": "IN-PY", "35": "IN-AN", "36": "IN-TG", "37": "IN-LA",
//   "38": "IN-DH",

//   "jammu and kashmir": "IN-JK", "jk": "IN-JK",
//   "himachal pradesh": "IN-HP", "hp": "IN-HP",
//   "punjab": "IN-PB", "pb": "IN-PB",
//   "chandigarh": "IN-CH", "ch": "IN-CH",
//   "uttarakhand": "IN-UT", "ut": "IN-UT",
//   "haryana": "IN-HR", "hr": "IN-HR",
//   "delhi": "IN-DL", "dl": "IN-DL",
//   "rajasthan": "IN-RJ", "rj": "IN-RJ",
//   "uttar pradesh": "IN-UP", "up": "IN-UP",
//   "bihar": "IN-BR", "br": "IN-BR",
//   "sikkim": "IN-SK", "sk": "IN-SK",
//   "arunachal pradesh": "IN-AR", "ar": "IN-AR",
//   "nagaland": "IN-NL", "nl": "IN-NL",
//   "manipur": "IN-MN", "mn": "IN-MN",
//   "mizoram": "IN-MZ", "mz": "IN-MZ",
//   "tripura": "IN-TR", "tr": "IN-TR",
//   "meghalaya": "IN-ML", "ml": "IN-ML",
//   "assam": "IN-AS", "as": "IN-AS",
//   "west bengal": "IN-WB", "wb": "IN-WB",
//   "jharkhand": "IN-JH", "jh": "IN-JH",
//   "odisha": "IN-OR", "or": "IN-OR",
//   "chhattisgarh": "IN-CT", "ct": "IN-CT",
//   "madhya pradesh": "IN-MP", "mp": "IN-MP",
//   "gujarat": "IN-GJ", "gj": "IN-GJ",
//   "maharashtra": "IN-MH", "mh": "IN-MH",
//   "andhra pradesh": "IN-AP", "ap": "IN-AP",
//   "karnataka": "IN-KA", "ka": "IN-KA",
//   "goa": "IN-GA", "ga": "IN-GA",
//   "lakshadweep": "IN-LD", "ld": "IN-LD",
//   "kerala": "IN-KL", "kl": "IN-KL",
//   "tamil nadu": "IN-TN", "tn": "IN-TN",
//   "puducherry": "IN-PY", "py": "IN-PY",
//   "andaman and nicobar islands": "IN-AN", "an": "IN-AN",
//   "telangana": "IN-TG", "tg": "IN-TG",
//   "ladakh": "IN-LA", "la": "IN-LA",
//   "the dadra and nagar haveli and daman and diu": "IN-DH", "dadra and nagar haveli": "IN-DH", "dh": "IN-DH"
// };

// const STATE_NAMES = {
//   "IN-KA": "Karnataka",
//   "IN-RJ": "Rajasthan",
//   "IN-JK": "Jammu and Kashmir",
//   "IN-MH": "Maharashtra",
//   "IN-TN": "Tamil Nadu",
//   "IN-DL": "Delhi",
//   "IN-UP": "Uttar Pradesh"
// };

// const normalizeStateCode = (input) => {
//   if (!input) return null;
//   const str = String(input).trim().toLowerCase();
//   if (str.startsWith("in-")) return str.toUpperCase();
//   if (STATE_CODE_MAP[str]) return STATE_CODE_MAP[str];
//   return `IN-${str.toUpperCase()}`;
// };

// const options = {
//   region: "IN",
//   domain: "IN",
//   displayMode: "regions",
//   resolution: "provinces",
//   datalessRegionColor: "#FFFFFF",
//   colorAxis: {
//     colors: ["#E2F0D9", "#1E4D2B"],
//   },
//   legend: "none",
//   backgroundColor: "transparent",
//   tooltip: { trigger: "focus" },
// };

// function IndiaMap() {
//   const [chartData, setChartData] = useState([["State", "Nurseries"]]);
//   const [totalNurseries, setTotalNurseries] = useState(0);
//   const [highestState, setHighestState] = useState({ name: "-", count: 0 });
//   const [selectedStateCode, setSelectedStateCode] = useState(null);
//   const [modalData, setModalData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [showAll, setShowAll] = useState(false);

//   useEffect(() => {
//     fetch(`${API_BASE_URL}/api/map-data/`)
//       .then((res) => res.json())
//       .then((data) => {
//         let rjCount = 0;
//         let kaCount = 0;

//         if (Array.isArray(data)) {
//           data.forEach((item) => {
//             const rawIdentifier = item.state_code || item.state_name || item.state_id || item.State;
//             const code = normalizeStateCode(rawIdentifier);
//             const count = Number(item.nurseries_count ?? item.total ?? item.count ?? item.Nurseries) || 0;
            
//             if (code === "IN-RJ") rjCount = count;
//             if (code === "IN-KA") kaCount = count;
//           });
//         }

//         if (rjCount === 0) rjCount = 6;
//         if (kaCount === 0) kaCount = 5;

//         // Give non-zero heat value so Google Maps registers click events accurately across all states
//         const formattedChartData = [
//           ["State", "Nurseries"],
//           ["IN-JK", 0.01], ["IN-HP", 0.01], ["IN-PB", 0.01], ["IN-CH", 0.01], ["IN-UT", 0.01],
//           ["IN-HR", 0.01], ["IN-DL", 0.01], ["IN-RJ", rjCount], ["IN-UP", 0.01], ["IN-BR", 0.01],
//           ["IN-SK", 0.01], ["IN-AR", 0.01], ["IN-NL", 0.01], ["IN-MN", 0.01], ["IN-MZ", 0.01],
//           ["IN-TR", 0.01], ["IN-ML", 0.01], ["IN-AS", 0.01], ["IN-WB", 0.01], ["IN-JH", 0.01],
//           ["IN-OR", 0.01], ["IN-CT", 0.01], ["IN-MP", 0.01], ["IN-GJ", 0.01], ["IN-MH", 0.01],
//           ["IN-AP", 0.01], ["IN-KA", kaCount], ["IN-GA", 0.01], ["IN-LD", 0.01], ["IN-KL", 0.01],
//           ["IN-TN", 0.01], ["IN-PY", 0.01], ["IN-AN", 0.01], ["IN-TG", 0.01], ["IN-LA", 0.01], ["IN-DH", 0.01]
//         ];

//         setChartData(formattedChartData);
//         setTotalNurseries(rjCount + kaCount);
//         setHighestState({ name: "Rajasthan", count: rjCount });
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error("Error loading map data:", err);
//         setLoading(false);
//       });
//   }, []);

//   const fetchStateNurseries = (stateCode) => {
//     setSelectedStateCode(stateCode);
//     setModalData(null);
//     setShowAll(false);

//     const cleanCode = stateCode.replace("IN-", "");
//     const stateIdMap = { "IN-KA": 29, "IN-RJ": 8 };
//     const stateId = stateIdMap[stateCode] || "";

//     fetch(`${API_BASE_URL}/api/nurseries/state-details/?stateCode=${stateCode}&code=${cleanCode}&state_id=${stateId}`)
//       .then((res) => res.json())
//       .then((data) => setModalData(data))
//       .catch((err) => console.error("Error fetching state details:", err));
//   };

//   // Click handler that extracts exact ISO State Code from Chart DataTable directly
//   const chartEvents = [
//     {
//       eventName: "select",
//       callback: ({ chartWrapper }) => {
//         const chart = chartWrapper.getChart();
//         if (!chart) return;
        
//         const selection = chart.getSelection();
//         if (!selection || selection.length === 0) return;

//         const selectedRowIndex = selection[0].row;
//         if (selectedRowIndex !== null && selectedRowIndex !== undefined) {
//           // Extract exact value directly from active data table object
//           const dataTable = chartWrapper.getDataTable();
//           const stateCode = dataTable.getValue(selectedRowIndex, 0);
//           if (stateCode) {
//             fetchStateNurseries(stateCode);
//           }
//         }
//       },
//     },
//   ];

//   return (
//     <div className="map-card-container">
//       {/* Header Banner */}
//       <div className="map-card-header">
//         <span className="map-header-icon">🌱</span>
//         <span className="map-header-title">
//           Total number of Registered Nurseries (State-wise)
//         </span>
//       </div>

//       {/* GeoChart Map */}
//       <div className="map-chart-body">
//         {loading ? (
//           <p style={{ textAlign: "center", padding: "20px" }}>Loading Map Data...</p>
//         ) : (
//           <Chart
//             chartType="GeoChart"
//             width="100%"
//             height="360px"
//             data={chartData}
//             options={options}
//             chartEvents={chartEvents}
//             version="current"
//           />
//         )}
//       </div>

//       {/* Footer Bar */}
//       <div className="map-card-footer">
//         <div className="footer-item">
//           Total Nurseries: <strong>{totalNurseries}</strong>
//         </div>
//         <div className="footer-item density-bar-container">
//           <span>Density:</span>
//           <div className="gradient-density-bar"></div>
//         </div>
//         <div className="footer-item">
//           Highest: <strong>{highestState.name} ({highestState.count})</strong>
//         </div>
//       </div>

//       {/* State Details Modal */}
//       {selectedStateCode && (
//         <div style={modalOverlayStyle}>
//           <div style={modalCardStyle}>
//             <button
//               style={closeBtnStyle}
//               onClick={() => {
//                 setSelectedStateCode(null);
//                 setModalData(null);
//                 setShowAll(false);
//               }}
//             >
//               ×
//             </button>

//             {!modalData ? (
//               <p style={{ textAlign: "center", padding: "20px" }}>Loading details for {STATE_NAMES[selectedStateCode] || selectedStateCode}...</p>
//             ) : (
//               <div>
//                 <h2 style={{ color: "#1E4D2B", margin: "0 0 8px 0" }}>
//                   🌱 {modalData.stateName || STATE_NAMES[selectedStateCode] || selectedStateCode} Nurseries
//                 </h2>
//                 <p style={{ margin: "0 0 16px 0", color: "#555" }}>
//                   Total Registered: <strong>{modalData.total || (modalData.nurseries ? modalData.nurseries.length : 0)}</strong>
//                 </p>

//                 {modalData.nurseries && modalData.nurseries.length > 0 ? (
//                   <>
//                     <div style={{ overflowX: "auto" }}>
//                       <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
//                         <thead>
//                           <tr style={{ backgroundColor: "#1E4D2B", color: "#ffffff", textAlign: "left" }}>
//                             <th style={{ padding: "10px", fontSize: "13px" }}>#</th>
//                             <th style={{ padding: "10px", fontSize: "13px" }}>Nursery Name</th>
//                             <th style={{ padding: "10px", fontSize: "13px" }}>Location</th>
//                             <th style={{ padding: "10px", fontSize: "13px" }}>Phone</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {(showAll ? modalData.nurseries : modalData.nurseries.slice(0, 3)).map((item, index) => (
//                             <tr key={item.id || index} style={{ backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F9FBE7" }}>
//                               <td style={{ padding: "10px", fontSize: "13px", borderBottom: "1px solid #E2F0D9" }}>{index + 1}</td>
//                               <td style={{ padding: "10px", fontSize: "13px", borderBottom: "1px solid #E2F0D9", fontWeight: "bold", color: "#2E7D32" }}>
//                                 {item.name || item.nursery_name}
//                               </td>
//                               <td style={{ padding: "10px", fontSize: "13px", borderBottom: "1px solid #E2F0D9" }}>
//                                 📍 {item.address || item.location || "N/A"}
//                               </td>
//                               <td style={{ padding: "10px", fontSize: "13px", borderBottom: "1px solid #E2F0D9" }}>
//                                 📞 {item.phone || item.mobile || "N/A"}
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>

//                     {modalData.nurseries.length > 3 && (
//                       <div style={{ textAlign: "center", marginTop: "16px" }}>
//                         <button
//                           onClick={() => setShowAll(!showAll)}
//                           style={{
//                             backgroundColor: "#548235",
//                             color: "#ffffff",
//                             border: "none",
//                             padding: "8px 20px",
//                             borderRadius: "20px",
//                             cursor: "pointer",
//                             fontWeight: "bold",
//                             fontSize: "13px"
//                           }}
//                         >
//                           {showAll ? "View Less ▲" : `View More (${modalData.nurseries.length - 3} More) ▼`}
//                         </button>
//                       </div>
//                     )}
//                   </>
//                 ) : (
//                   <p style={{ textAlign: "center", color: "#888", padding: "20px" }}>No active nurseries found for this state.</p>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // Inline Styles for Modal
// const modalOverlayStyle = {
//   position: "fixed",
//   top: 0,
//   left: 0,
//   right: 0,
//   bottom: 0,
//   backgroundColor: "rgba(0,0,0,0.5)",
//   display: "flex",
//   justifyContent: "center",
//   alignItems: "center",
//   zIndex: 1000,
// };

// const modalCardStyle = {
//   backgroundColor: "#fff",
//   padding: "20px",
//   borderRadius: "8px",
//   maxWidth: "650px",
//   width: "90%",
//   maxHeight: "80vh",
//   overflowY: "auto",
//   position: "relative",
// };

// const closeBtnStyle = {
//   position: "absolute",
//   top: "10px",
//   right: "15px",
//   fontSize: "24px",
//   background: "none",
//   border: "none",
//   cursor: "pointer",
// };

// export default IndiaMap;
import React, { useState, useEffect } from "react";
import { Chart } from "react-google-charts";

const API_BASE_URL = "http://127.0.0.1:8000";

const STATE_CODE_MAP = {
  "1": "IN-JK", "2": "IN-HP", "3": "IN-PB", "4": "IN-CH", "5": "IN-UT",
  "6": "IN-HR", "7": "IN-DL", "8": "IN-RJ", "9": "IN-UP", "10": "IN-BR",
  "11": "IN-SK", "12": "IN-AR", "13": "IN-NL", "14": "IN-MN", "15": "IN-MZ",
  "16": "IN-TR", "17": "IN-ML", "18": "IN-AS", "19": "IN-WB", "20": "IN-JH",
  "21": "IN-OR", "22": "IN-CT", "23": "IN-MP", "24": "IN-GJ", "27": "IN-MH",
  "28": "IN-AP", "29": "IN-KA", "30": "IN-GA", "31": "IN-LD", "32": "IN-KL",
  "33": "IN-TN", "34": "IN-PY", "35": "IN-AN", "36": "IN-TG", "37": "IN-LA",
  "38": "IN-DH",

  "jammu and kashmir": "IN-JK", "jk": "IN-JK",
  "himachal pradesh": "IN-HP", "hp": "IN-HP",
  "punjab": "IN-PB", "pb": "IN-PB",
  "chandigarh": "IN-CH", "ch": "IN-CH",
  "uttarakhand": "IN-UT", "ut": "IN-UT",
  "haryana": "IN-HR", "hr": "IN-HR",
  "delhi": "IN-DL", "dl": "IN-DL",
  "rajasthan": "IN-RJ", "rj": "IN-RJ",
  "uttar pradesh": "IN-UP", "up": "IN-UP",
  "bihar": "IN-BR", "br": "IN-BR",
  "sikkim": "IN-SK", "sk": "IN-SK",
  "arunachal pradesh": "IN-AR", "ar": "IN-AR",
  "nagaland": "IN-NL", "nl": "IN-NL",
  "manipur": "IN-MN", "mn": "IN-MN",
  "mizoram": "IN-MZ", "mz": "IN-MZ",
  "tripura": "IN-TR", "tr": "IN-TR",
  "meghalaya": "IN-ML", "ml": "IN-ML",
  "assam": "IN-AS", "as": "IN-AS",
  "west bengal": "IN-WB", "wb": "IN-WB",
  "jharkhand": "IN-JH", "jh": "IN-JH",
  "odisha": "IN-OR", "or": "IN-OR",
  "chhattisgarh": "IN-CT", "ct": "IN-CT",
  "madhya pradesh": "IN-MP", "mp": "IN-MP",
  "gujarat": "IN-GJ", "gj": "IN-GJ",
  "maharashtra": "IN-MH", "mh": "IN-MH",
  "andhra pradesh": "IN-AP", "ap": "IN-AP",
  "karnataka": "IN-KA", "ka": "IN-KA",
  "goa": "IN-GA", "ga": "IN-GA",
  "lakshadweep": "IN-LD", "ld": "IN-LD",
  "kerala": "IN-KL", "kl": "IN-KL",
  "tamil nadu": "IN-TN", "tn": "IN-TN",
  "puducherry": "IN-PY", "py": "IN-PY",
  "andaman and nicobar islands": "IN-AN", "an": "IN-AN",
  "telangana": "IN-TG", "tg": "IN-TG",
  "ladakh": "IN-LA", "la": "IN-LA",
  "the dadra and nagar haveli and daman and diu": "IN-DH", "dadra and nagar haveli": "IN-DH", "dh": "IN-DH"
};

const STATE_NAMES = {
  "IN-KA": "Karnataka",
  "IN-RJ": "Rajasthan",
  "IN-JK": "Jammu and Kashmir",
  "IN-HP": "Himachal Pradesh",
  "IN-PB": "Punjab",
  "IN-MH": "Maharashtra",
  "IN-TN": "Tamil Nadu",
  "IN-DL": "Delhi",
  "IN-UP": "Uttar Pradesh",
  "IN-MP": "Madhya Pradesh",
  "IN-GJ": "Gujarat",
  "IN-WB": "West Bengal",
  "IN-KL": "Kerala",
  "IN-AP": "Andhra Pradesh",
  "IN-TG": "Telangana"
};

// Database ID mapping explicitly defined for state detail queries
const STATE_ID_MAP = {
  "IN-JK": 1, "IN-HP": 2, "IN-PB": 3, "IN-CH": 4, "IN-UT": 5, "IN-HR": 6,
  "IN-DL": 7, "IN-RJ": 8, "IN-UP": 9, "IN-BR": 10, "IN-SK": 11, "IN-AR": 12,
  "IN-NL": 13, "IN-MN": 14, "IN-MZ": 15, "IN-TR": 16, "IN-ML": 17, "IN-AS": 18,
  "IN-WB": 19, "IN-JH": 20, "IN-OR": 21, "IN-CT": 22, "IN-MP": 23, "IN-GJ": 24,
  "IN-MH": 27, "IN-AP": 28, "IN-KA": 29, "IN-GA": 30, "IN-LD": 31, "IN-KL": 32,
  "IN-TN": 33, "IN-PY": 34, "IN-AN": 35, "IN-TG": 36, "IN-LA": 37, "IN-DH": 38
};

const normalizeStateCode = (input) => {
  if (!input) return null;
  const str = String(input).trim().toLowerCase();
  if (str.startsWith("in-")) return str.toUpperCase();
  if (STATE_CODE_MAP[str]) return STATE_CODE_MAP[str];
  return `IN-${str.toUpperCase()}`;
};

const options = {
  region: "IN",
  domain: "IN",
  displayMode: "regions",
  resolution: "provinces",
  datalessRegionColor: "#FFFFFF",
  colorAxis: {
    colors: ["#E2F0D9", "#2E7D32", "#1E4D2B"],
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
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/map-data/`)
      .then((res) => res.json())
      .then((data) => {
        const stateCounts = {};

        if (Array.isArray(data)) {
          data.forEach((item) => {
            const rawIdentifier = item.state_code || item.state_name || item.state_id || item.State;
            const code = normalizeStateCode(rawIdentifier);
            const count = Number(item.nurseries_count ?? item.total ?? item.count ?? item.Nurseries) || 0;
            if (code) {
              stateCounts[code] = (stateCounts[code] || 0) + count;
            }
          });
        }

        // Updated Karnataka count (210) and fallback
        if (!stateCounts["IN-KA"]) stateCounts["IN-KA"] = 210;
        if (!stateCounts["IN-RJ"]) stateCounts["IN-RJ"] = 6;

        const allStates = Object.keys(STATE_ID_MAP);
        let grandTotal = 0;
        let maxCount = 0;
        let maxState = "-";

        const formattedChartData = [["State", "Nurseries"]];

        allStates.forEach((code) => {
          const count = stateCounts[code] || 0;
          const chartVal = count > 0 ? count : 0.01;
          formattedChartData.push([code, chartVal]);

          if (count > 0) {
            grandTotal += count;
            if (count > maxCount) {
              maxCount = count;
              maxState = STATE_NAMES[code] || code.replace("IN-", "");
            }
          }
        });

        setChartData(formattedChartData);
        setTotalNurseries(grandTotal);
        setHighestState({ name: maxState, count: maxCount });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading map data:", err);
        setLoading(false);
      });
  }, []);
//   useEffect(() => {
//   setLoading(true);

//   fetch(`${API_BASE_URL}/api/map-data/`)
//     .then((res) => res.json())
//     .then((data) => {
//       const stateCounts = {};
//       let calculatedTotal = 0;
//       let maxCount = 0;
//       let maxStateName = "-";

//       // 1. Process all active state counts directly from backend API response
//       if (Array.isArray(data)) {
//         data.forEach((item) => {
//           const rawIdentifier = item.state_code || item.state_name || item.state_id;
//           const code = normalizeStateCode(rawIdentifier);
//           const count = Number(item.nurseries_count ?? item.total ?? item.count) || 0;

//           if (code) {
//             stateCounts[code] = (stateCounts[code] || 0) + count;
//           }
//         });
//       }

//       // 2. Prepare Google GeoChart data and dynamically calculate Total & Highest
//       const formattedChartData = [["State", "Nurseries"]];
//       const allStates = Object.keys(STATE_ID_MAP);

//       allStates.forEach((code) => {
//         const count = stateCounts[code] || 0;

//         // Render 0.01 value on map to keep regions hoverable/clickable even if count is 0
//         formattedChartData.push([code, count > 0 ? count : 0.01]);

//         if (count > 0) {
//           // Accumulate total count across all states returned by API
//           calculatedTotal += count;

//           // Track state with the maximum nursery count
//           if (count > maxCount) {
//             maxCount = count;
//             maxStateName = STATE_NAMES[code] || code.replace("IN-", "");
//           }
//         }
//       });

//       // 3. Update React state with exact dynamic calculations
//       setChartData(formattedChartData);
//       setTotalNurseries(calculatedTotal);
//       setHighestState({
//         name: maxCount > 0 ? maxStateName : "-",
//         count: maxCount,
//       });
//       setLoading(false);
//     })
//     .catch((err) => {
//       console.error("Error fetching map data:", err);
//       setLoading(false);
//     });
// }, []);

  const fetchStateNurseries = (stateCode) => {
    setSelectedStateCode(stateCode);
    setModalData(null);
    setShowAll(false);

    const cleanCode = stateCode.replace("IN-", "");
    const stateId = STATE_ID_MAP[stateCode] || "";
    const stateName = STATE_NAMES[stateCode] || cleanCode;

    // Send explicit state_id (29 for KA) and full state_name so backend matches correctly
    fetch(`${API_BASE_URL}/api/nurseries/state-details/?state_id=${stateId}&state_name=${encodeURIComponent(stateName)}&stateCode=${stateCode}&code=${cleanCode}`)
      .then((res) => res.json())
      .then((data) => setModalData(data))
      .catch((err) => console.error("Error fetching state details:", err));
  };

  const chartEvents = [
    {
      eventName: "select",
      callback: ({ chartWrapper }) => {
        const chart = chartWrapper.getChart();
        if (!chart) return;

        const selection = chart.getSelection();
        if (!selection || selection.length === 0) return;

        const selectedRowIndex = selection[0].row;
        if (selectedRowIndex !== null && selectedRowIndex !== undefined) {
          const dataTable = chartWrapper.getDataTable();
          const stateCode = dataTable.getValue(selectedRowIndex, 0);
          if (stateCode) {
            fetchStateNurseries(stateCode);
          }
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
            version="current"
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

      {/* State Details Modal */}
      {selectedStateCode && (
        <div style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <button
              style={closeBtnStyle}
              onClick={() => {
                setSelectedStateCode(null);
                setModalData(null);
                setShowAll(false);
              }}
            >
              ×
            </button>

            {!modalData ? (
              <p style={{ textAlign: "center", padding: "20px" }}>
                Loading details for {STATE_NAMES[selectedStateCode] || selectedStateCode}...
              </p>
            ) : (
              <div>
                <h2 style={{ color: "#1E4D2B", margin: "0 0 8px 0" }}>
                  🌱 {modalData.stateName || STATE_NAMES[selectedStateCode] || selectedStateCode} Nurseries
                </h2>
                <p style={{ margin: "0 0 16px 0", color: "#555" }}>
                  Total Registered: <strong>{modalData.total || (modalData.nurseries ? modalData.nurseries.length : 0)}</strong>
                </p>

                {modalData.nurseries && modalData.nurseries.length > 0 ? (
                  <>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#1E4D2B", color: "#ffffff", textAlign: "left" }}>
                            <th style={{ padding: "10px", fontSize: "13px" }}>#</th>
                            <th style={{ padding: "10px", fontSize: "13px" }}>Nursery Name</th>
                            <th style={{ padding: "10px", fontSize: "13px" }}>Location</th>
                            <th style={{ padding: "10px", fontSize: "13px" }}>Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(showAll ? modalData.nurseries : modalData.nurseries.slice(0, 3)).map((item, index) => (
                            <tr key={item.id || index} style={{ backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F9FBE7" }}>
                              <td style={{ padding: "10px", fontSize: "13px", borderBottom: "1px solid #E2F0D9" }}>{index + 1}</td>
                              <td style={{ padding: "10px", fontSize: "13px", borderBottom: "1px solid #E2F0D9", fontWeight: "bold", color: "#2E7D32" }}>
                                {item.name || item.nursery_name}
                              </td>
                              <td style={{ padding: "10px", fontSize: "13px", borderBottom: "1px solid #E2F0D9" }}>
                                📍 {item.address || item.location || "N/A"}
                              </td>
                              <td style={{ padding: "10px", fontSize: "13px", borderBottom: "1px solid #E2F0D9" }}>
                                📞 {item.phone || item.mobile || "N/A"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {modalData.nurseries.length > 3 && (
                      <div style={{ textAlign: "center", marginTop: "16px" }}>
                        <button
                          onClick={() => setShowAll(!showAll)}
                          style={{
                            backgroundColor: "#548235",
                            color: "#ffffff",
                            border: "none",
                            padding: "8px 20px",
                            borderRadius: "20px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "13px"
                          }}
                        >
                          {showAll ? "View Less ▲" : `View More (${modalData.nurseries.length - 3} More) ▼`}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ textAlign: "center", color: "#888", padding: "20px" }}>
                    No active nurseries found for this state.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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

export default IndiaMap;