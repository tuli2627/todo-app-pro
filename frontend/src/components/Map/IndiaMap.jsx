
// import React, { useState, useEffect, useRef } from "react";
// import { Chart } from "react-google-charts";
// import axios from "axios";

// const API_BASE_URL = "http://127.0.0.1:8000/api";
// const IMAGE_BASE_URL = "https://nationalcampa.nic.in/Harit-SANKALP/Uploads/NUR/";

// // ISO Code to State Name Mapping
// const STATE_CODE_TO_NAME = {
//   "IN-AN": "Andaman and Nicobar Islands",
//   "IN-AP": "Andhra Pradesh",
//   "IN-AR": "Arunachal Pradesh",
//   "IN-AS": "Assam",
//   "IN-BR": "Bihar",
//   "IN-CH": "Chandigarh",
//   "IN-CT": "Chhattisgarh",
//   "IN-DN": "Dadra and Nagar Haveli",
//   "IN-DD": "Daman and Diu",
//   "IN-DL": "Delhi",
//   "IN-GA": "Goa",
//   "IN-GJ": "Gujarat",
//   "IN-HR": "Haryana",
//   "IN-HP": "Himachal Pradesh",
//   "IN-JK": "Jammu and Kashmir",
//   "IN-JH": "Jharkhand",
//   "IN-KA": "Karnataka",
//   "IN-KL": "Kerala",
//   "IN-LA": "Ladakh",
//   "IN-LD": "Lakshadweep",
//   "IN-MP": "Madhya Pradesh",
//   "IN-MH": "Maharashtra",
//   "IN-MN": "Manipur",
//   "IN-ML": "Meghalaya",
//   "IN-MZ": "Mizoram",
//   "IN-NL": "Nagaland",
//   "IN-OR": "Odisha",
//   "IN-PY": "Puducherry",
//   "IN-PB": "Punjab",
//   "IN-RJ": "Rajasthan",
//   "IN-SK": "Sikkim",
//   "IN-TN": "Tamil Nadu",
//   "IN-TG": "Telangana",
//   "IN-TR": "Tripura",
//   "IN-UP": "Uttar Pradesh",
//   "IN-UT": "Uttarakhand",
//   "IN-WB": "West Bengal",
// };

// // Reverse Mapping: Full Name -> ISO Code
// const NAME_TO_STATE_CODE = Object.entries(STATE_CODE_TO_NAME).reduce((acc, [code, name]) => {
//   acc[name.toLowerCase()] = code;
//   return acc;
// }, {});

// const getIsoCode = (input) => {
//   if (!input) return "";
//   if (STATE_CODE_TO_NAME[input.toUpperCase()]) return input.toUpperCase();
//   return NAME_TO_STATE_CODE[input.toLowerCase()] || input;
// };

// const getCleanName = (input) => {
//   if (!input) return "";
//   const code = getIsoCode(input);
//   return STATE_CODE_TO_NAME[code] || input.replace(/^IN-/, "");
// };

// const IndiaMap = () => {
//   const [mapData, setMapData] = useState([]);
//   const [chartData, setChartData] = useState([["State", "Nurseries"]]);
//   const [totalNurseries, setTotalNurseries] = useState(0);
//   const [highestState, setHighestState] = useState({ name: "-", count: 0 });

//   // Modal State
//   const [selectedState, setSelectedState] = useState(null);
//   const [nurseryDetails, setNurseryDetails] = useState([]);
//   const [loadingModal, setLoadingModal] = useState(false);
//   const [showModal, setShowModal] = useState(false);

//   // Hover Tooltip Table State
//   const [hoverState, setHoverState] = useState(null);
//   const [hoverNurseries, setHoverNurseries] = useState([]);
//   const [loadingHover, setLoadingHover] = useState(false);
//   const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

//   const containerRef = useRef(null);

//   useEffect(() => {
//     fetchMapData();
//   }, []);

//   const fetchMapData = async () => {
//     try {
//       const response = await axios.get(`${API_BASE_URL}/map-data/`);
//       const data = response.data || [];
//       setMapData(data);

//       const formattedChartData = [["State", "Nurseries"]];
//       let total = 0;
//       let maxState = { name: "-", count: 0 };

//       data.forEach((item) => {
//         const count = Number(item.nurseries_count) || 0;
//         total += count;

//         const cleanName = getCleanName(item.state_name || item.state_code);
//         const isoCode = getIsoCode(item.state_code || item.state_name);

//         if (count > maxState.count) {
//           maxState = { name: cleanName, count: count };
//         }

//         if (isoCode) {
//           // Google GeoChart REQUIRES valid ISO codes (e.g. "IN-WB") to prevent library scripts from breaking
//           formattedChartData.push([isoCode, count]);
//         }
//       });

//       setChartData(formattedChartData);
//       setTotalNurseries(total);
//       setHighestState(maxState);
//     } catch (error) {
//       console.error("Error fetching map data:", error);
//     }
//   };

//   const handleMouseMove = (e) => {
//     if (containerRef.current) {
//       const rect = containerRef.current.getBoundingClientRect();
//       setTooltipPos({
//         x: e.clientX - rect.left + 15,
//         y: e.clientY - rect.top + 15,
//       });
//     }
//   };

//   const fetchStateDetailsForHover = async (stateRecord) => {
//     setLoadingHover(true);
//     try {
//       const cleanName = getCleanName(stateRecord.state_name || stateRecord.state_code);
//       const response = await axios.get(
//         `${API_BASE_URL}/nurseries/state-details/`,
//         {
//           params: {
//             state_id: stateRecord.state_id,
//             stateCode: stateRecord.state_code,
//             state_name: cleanName,
//           },
//         }
//       );

//       if (response?.data?.nurseries) {
//         setHoverNurseries(response.data.nurseries);
//       } else {
//         setHoverNurseries([]);
//       }
//     } catch (error) {
//       console.error("Error fetching hover nursery details:", error);
//       setHoverNurseries([]);
//     } finally {
//       setLoadingHover(false);
//     }
//   };

//   const chartEvents = [
//     {
//       eventName: "select",
//       callback: ({ chartWrapper }) => {
//         try {
//           if (!chartWrapper) return;
//           const chart = chartWrapper.getChart();
//           if (!chart) return;
//           const selection = chart.getSelection();

//           if (selection && selection.length > 0) {
//             const selectedItem = selection[0];
//             const dataRow = selectedItem.row;

//             if (dataRow !== null && dataRow !== undefined && mapData[dataRow]) {
//               const stateRecord = mapData[dataRow];
//               const cleanName = getCleanName(stateRecord.state_name || stateRecord.state_code);
//               handleStateClick(
//                 stateRecord.state_code,
//                 cleanName,
//                 stateRecord.state_id
//               );
//             }
//           }
//         } catch (err) {
//           // Prevent standard script error crash
//         }
//       },
//     },
//     {
//       eventName: "onregionover",
//       callback: ({ region }) => {
//         try {
//           if (!region || !mapData.length) return;

//           const cleanRegionName = getCleanName(region);
//           const isoRegion = getIsoCode(region);

//           const stateRecord = mapData.find((item) => {
//             const itemIso = getIsoCode(item.state_code || item.state_name);
//             return itemIso === isoRegion || getCleanName(item.state_name) === cleanRegionName;
//           });

//           setHoverState(cleanRegionName); // Displays clean state name in tooltip

//           if (stateRecord) {
//             fetchStateDetailsForHover(stateRecord);
//           } else {
//             setHoverNurseries([]);
//           }
//         } catch (err) {
//           // Safe catch block
//         }
//       },
//     },
//     {
//       eventName: "onregionout",
//       callback: () => {
//         setHoverState(null);
//         setHoverNurseries([]);
//       },
//     },
//   ];

//   const handleStateClick = async (stateCode, stateName, stateId) => {
//     const cleanName = getCleanName(stateName || stateCode);
//     setSelectedState(cleanName);
//     setLoadingModal(true);
//     setShowModal(true);

//     try {
//       const response = await axios.get(
//         `${API_BASE_URL}/nurseries/state-details/`,
//         {
//           params: {
//             state_id: stateId,
//             stateCode: stateCode,
//             state_name: cleanName,
//           },
//         }
//       );

//       if (response?.data?.nurseries) {
//         setNurseryDetails(response.data.nurseries);
//       } else {
//         setNurseryDetails([]);
//       }
//     } catch (error) {
//       console.error("Error fetching state nursery details:", error);
//       setNurseryDetails([]);
//     } finally {
//       setLoadingModal(false);
//     }
//   };

//   const closeModal = () => {
//     setShowModal(false);
//     setSelectedState(null);
//     setNurseryDetails([]);
//   };

//   const chartOptions = {
//     region: "IN",
//     domain: "IN",
//     displayMode: "regions",
//     resolution: "provinces",
//     colorAxis: {
//       minValue: 0,
//       maxValue: Math.max(highestState.count, 10),
//       colors: ["#EBF5ED", "#A3D9B1", "#2E7D32", "#1B5E20"],
//     },
//     backgroundColor: "transparent",
//     datalessRegionColor: "transparent",
//     defaultColor: "#EBF5ED",
//     keepAspectRatio: true,
//     tooltip: { trigger: "none" }, // Disable Google's internal native tooltip box
//   };

//   return (
//     <div
//       ref={containerRef}
//       onMouseMove={handleMouseMove}
//       style={{
//         maxWidth: "700px",
//         margin: "0 auto",
//         padding: "10px",
//         fontFamily: "Arial, sans-serif",
//         position: "relative",
//       }}
//     >
//       <div
//         style={{
//           display: "flex",
//           alignItems: "center",
//           gap: "8px",
//           marginBottom: "10px",
//         }}
//       >
//         <span style={{ fontSize: "16px" }}>🌱</span>
//         <h3 style={{ margin: 0, fontSize: "15px", color: "#333333", fontWeight: "600" }}>
//           Total number of Registered Nurseries (State-wise)
//         </h3>
//       </div>

//       <div style={{ width: "100%", height: "360px", position: "relative" }}>
//         {chartData.length > 1 ? (
//           <Chart
//             chartType="GeoChart"
//             width="100%"
//             height="100%"
//             data={chartData}
//             options={chartOptions}
//             chartEvents={chartEvents}
//           />
//         ) : (
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//               height: "100%",
//               color: "#888",
//               fontSize: "13px",
//             }}
//           >
//             Loading map data...
//           </div>
//         )}

//         {/* Hover Floating Card Table */}
//         {hoverState && (
//           <div
//             style={{
//               position: "absolute",
//               top: `${tooltipPos.y}px`,
//               left: `${tooltipPos.x}px`,
//               backgroundColor: "#ffffff",
//               border: "1px solid #ddd",
//               borderRadius: "8px",
//               padding: "12px",
//               boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
//               pointerEvents: "none",
//               zIndex: 999,
//               width: "480px",
//               maxHeight: "300px",
//               overflowY: "auto",
//             }}
//           >
//             <h4
//               style={{
//                 margin: "0 0 8px 0",
//                 color: "#2e7d32",
//                 fontSize: "14px",
//                 borderBottom: "2px solid #2e7d32",
//                 paddingBottom: "4px",
//               }}
//             >
//               Nurseries in {hoverState} ({hoverNurseries.length})
//             </h4>

//             {loadingHover ? (
//               <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
//                 Loading nursery details...
//               </p>
//             ) : hoverNurseries.length === 0 ? (
//               <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>
//                 No active nurseries registered.
//               </p>
//             ) : (
//               <table
//                 style={{
//                   width: "100%",
//                   borderCollapse: "collapse",
//                   fontSize: "11px",
//                 }}
//               >
//                 <thead>
//                   <tr style={{ backgroundColor: "#2e7d32", color: "#fff" }}>
//                     <th style={{ padding: "6px", textAlign: "left" }}>Photo</th>
//                     <th style={{ padding: "6px", textAlign: "left" }}>Nursery Name</th>
//                     <th style={{ padding: "6px", textAlign: "left" }}>Address</th>
//                     <th style={{ padding: "6px", textAlign: "left" }}>Contact</th>
//                     <th style={{ padding: "6px", textAlign: "left" }}>Phone</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {hoverNurseries.map((nursery, idx) => {
//                     const rawPhoto =
//                       nursery.photo_url ||
//                       nursery.photoUrl ||
//                       nursery.Nursery_PHOTO ||
//                       nursery.photo;

//                     const filename = rawPhoto ? rawPhoto.split("/").pop() : null;
//                     const fullPhotoUrl = filename ? `${IMAGE_BASE_URL}${filename}` : null;

//                     return (
//                       <tr
//                         key={nursery.id || idx}
//                         style={{
//                           borderBottom: "1px solid #eee",
//                           backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa",
//                         }}
//                       >
//                         <td style={{ padding: "4px", width: "45px" }}>
//                           {fullPhotoUrl ? (
//                             <img
//                               src={fullPhotoUrl}
//                               alt="Nursery"
//                               style={{
//                                 width: "35px",
//                                 height: "35px",
//                                 objectFit: "cover",
//                                 borderRadius: "4px",
//                               }}
//                               onError={(e) => {
//                                 e.currentTarget.style.display = "none";
//                               }}
//                             />
//                           ) : (
//                             <span style={{ fontSize: "9px", color: "#999" }}>N/A</span>
//                           )}
//                         </td>
//                         <td style={{ padding: "4px", fontWeight: "bold" }}>
//                           {nursery.name || "N/A"}
//                         </td>
//                         <td style={{ padding: "4px" }}>
//                           {nursery.address || nursery.location || "N/A"}
//                         </td>
//                         <td style={{ padding: "4px" }}>
//                           {nursery.contact_person || "N/A"}
//                         </td>
//                         <td style={{ padding: "4px" }}>
//                           {nursery.phone || "N/A"}
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         )}
//       </div>

//       <div
//         style={{
//           marginTop: "10px",
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           fontSize: "13px",
//           color: "#444444",
//         }}
//       >
//         <div>
//           Total Nurseries: <strong>{totalNurseries}</strong>
//         </div>

//         <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
//           <span>Density:</span>
//           <div
//             style={{
//               width: "90px",
//               height: "6px",
//               borderRadius: "3px",
//               background: "linear-gradient(90deg, #EBF5ED 0%, #1B5E20 100%)",
//             }}
//           />
//         </div>

//         <div>
//           Highest:{" "}
//           <strong>
//             {highestState.name} ({highestState.count})
//           </strong>
//         </div>
//       </div>

//       {/* Modal */}
//       {showModal && (
//         <div
//           style={{
//             position: "fixed",
//             top: 0,
//             left: 0,
//             width: "100vw",
//             height: "100vh",
//             backgroundColor: "rgba(0,0,0,0.4)",
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             zIndex: 1000,
//           }}
//         >
//           <div
//             style={{
//               backgroundColor: "#fff",
//               width: "85%",
//               maxWidth: "900px",
//               maxHeight: "85vh",
//               borderRadius: "10px",
//               padding: "20px",
//               overflowY: "auto",
//               boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
//               position: "relative",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//                 borderBottom: "2px solid #2e7d32",
//                 paddingBottom: "10px",
//                 marginBottom: "16px",
//               }}
//             >
//               <h3
//                 style={{
//                   margin: 0,
//                   color: "#2e7d32",
//                   fontSize: "18px",
//                   fontWeight: "bold",
//                 }}
//               >
//                 Nurseries in {selectedState} ({nurseryDetails.length})
//               </h3>
//               <button
//                 onClick={closeModal}
//                 style={{
//                   background: "none",
//                   border: "none",
//                   fontSize: "22px",
//                   fontWeight: "bold",
//                   cursor: "pointer",
//                   color: "#666",
//                 }}
//               >
//                 &times;
//               </button>
//             </div>

//             {loadingModal ? (
//               <p style={{ textAlign: "center", padding: "30px", color: "#666" }}>
//                 Loading nursery details...
//               </p>
//             ) : nurseryDetails.length === 0 ? (
//               <p style={{ textAlign: "center", padding: "30px", color: "#888" }}>
//                 No active nurseries found for {selectedState}.
//               </p>
//             ) : (
//               <table
//                 style={{
//                   width: "100%",
//                   borderCollapse: "collapse",
//                   fontSize: "13px",
//                 }}
//               >
//                 <thead>
//                   <tr style={{ backgroundColor: "#2e7d32", color: "#fff" }}>
//                     <th style={{ padding: "10px", textAlign: "left" }}>Photo</th>
//                     <th style={{ padding: "10px", textAlign: "left" }}>Nursery Name</th>
//                     <th style={{ padding: "10px", textAlign: "left" }}>Address</th>
//                     <th style={{ padding: "10px", textAlign: "left" }}>Contact Person</th>
//                     <th style={{ padding: "10px", textAlign: "left" }}>Phone</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {nurseryDetails.map((nursery, index) => {
//                     const rawPhoto =
//                       nursery.photo_url ||
//                       nursery.photoUrl ||
//                       nursery.Nursery_PHOTO ||
//                       nursery.photo;

//                     const filename = rawPhoto ? rawPhoto.split("/").pop() : null;
//                     const fullPhotoUrl = filename ? `${IMAGE_BASE_URL}${filename}` : null;

//                     return (
//                       <tr
//                         key={nursery.id || index}
//                         style={{
//                           borderBottom: "1px solid #e0e0e0",
//                           backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa",
//                         }}
//                       >
//                         <td style={{ padding: "10px", verticalAlign: "middle", width: "70px" }}>
//                           {fullPhotoUrl ? (
//                             <img
//                               src={fullPhotoUrl}
//                               alt={nursery.name || "Nursery"}
//                               style={{
//                                 width: "50px",
//                                 height: "50px",
//                                 objectFit: "cover",
//                                 borderRadius: "6px",
//                                 border: "1px solid #ddd",
//                                 display: "block",
//                               }}
//                               onError={(e) => {
//                                 e.currentTarget.style.display = "none";
//                               }}
//                             />
//                           ) : (
//                             <span style={{ fontSize: "11px", color: "#888", fontStyle: "italic" }}>
//                               Coming Soon
//                             </span>
//                           )}
//                         </td>
//                         <td style={{ padding: "10px", fontWeight: "bold", color: "#222" }}>
//                           {nursery.name || "N/A"}
//                         </td>
//                         <td style={{ padding: "10px", color: "#444" }}>
//                           {nursery.address || nursery.location || "N/A"}
//                         </td>
//                         <td style={{ padding: "10px", color: "#444" }}>
//                           {nursery.contact_person || "N/A"}
//                         </td>
//                         <td style={{ padding: "10px", color: "#444" }}>
//                           {nursery.phone || "N/A"}
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default IndiaMap;
import React, { useState, useEffect, useRef } from "react";
import { Chart } from "react-google-charts";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";
const IMAGE_BASE_URL = "https://nationalcampa.nic.in/Harit-SANKALP/Uploads/NUR/";

// ISO Code to State Name Mapping
const STATE_CODE_TO_NAME = {
  "IN-AN": "Andaman and Nicobar Islands",
  "IN-AP": "Andhra Pradesh",
  "IN-AR": "Arunachal Pradesh",
  "IN-AS": "Assam",
  "IN-BR": "Bihar",
  "IN-CH": "Chandigarh",
  "IN-CT": "Chhattisgarh",
  "IN-DN": "Dadra and Nagar Haveli",
  "IN-DD": "Daman and Diu",
  "IN-DL": "Delhi",
  "IN-GA": "Goa",
  "IN-GJ": "Gujarat",
  "IN-HR": "Haryana",
  "IN-HP": "Himachal Pradesh",
  "IN-JK": "Jammu and Kashmir",
  "IN-JH": "Jharkhand",
  "IN-KA": "Karnataka",
  "IN-KL": "Kerala",
  "IN-LA": "Ladakh",
  "IN-LD": "Lakshadweep",
  "IN-MP": "Madhya Pradesh",
  "IN-MH": "Maharashtra",
  "IN-MN": "Manipur",
  "IN-ML": "Meghalaya",
  "IN-MZ": "Mizoram",
  "IN-NL": "Nagaland",
  "IN-OR": "Odisha",
  "IN-PY": "Puducherry",
  "IN-PB": "Punjab",
  "IN-RJ": "Rajasthan",
  "IN-SK": "Sikkim",
  "IN-TN": "Tamil Nadu",
  "IN-TG": "Telangana",
  "IN-TR": "Tripura",
  "IN-UP": "Uttar Pradesh",
  "IN-UT": "Uttarakhand",
  "IN-WB": "West Bengal",
};

// Reverse Mapping: Full Name -> ISO Code
const NAME_TO_STATE_CODE = Object.entries(STATE_CODE_TO_NAME).reduce((acc, [code, name]) => {
  acc[name.toLowerCase()] = code;
  return acc;
}, {});

const getIsoCode = (input) => {
  if (!input) return "";
  if (STATE_CODE_TO_NAME[input.toUpperCase()]) return input.toUpperCase();
  return NAME_TO_STATE_CODE[input.toLowerCase()] || input;
};

const getCleanName = (input) => {
  if (!input) return "";
  const code = getIsoCode(input);
  return STATE_CODE_TO_NAME[code] || input.replace(/^IN-/, "");
};

const IndiaMap = () => {
  const [mapData, setMapData] = useState([]);
  const [chartData, setChartData] = useState([["State", "Nurseries"]]);
  const [totalNurseries, setTotalNurseries] = useState(0);
  const [highestState, setHighestState] = useState({ name: "-", count: 0 });

  // Modal State
  const [selectedState, setSelectedState] = useState(null);
  const [nurseryDetails, setNurseryDetails] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Hover Tooltip Table State
  const [hoverState, setHoverState] = useState(null);
  const [hoverNurseries, setHoverNurseries] = useState([]);
  const [loadingHover, setLoadingHover] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/map-data/`);
      const data = response.data || [];
      setMapData(data);

      const formattedChartData = [["State", "Nurseries"]];
      let total = 0;
      let maxState = { name: "-", count: 0 };

      data.forEach((item) => {
        const count = Number(item.nurseries_count) || 0;
        total += count;

        const cleanName = getCleanName(item.state_name || item.state_code);
        const isoCode = getIsoCode(item.state_code || item.state_name);

        if (count > maxState.count) {
          maxState = { name: cleanName, count: count };
        }

        if (isoCode) {
          formattedChartData.push([isoCode, count]);
        }
      });

      setChartData(formattedChartData);
      setTotalNurseries(total);
      setHighestState(maxState);
    } catch (error) {
      console.error("Error fetching map data:", error);
    }
  };

  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top + 15,
      });
    }
  };

  const fetchStateDetailsForHover = async (stateRecord) => {
    setLoadingHover(true);
    try {
      const cleanName = getCleanName(stateRecord.state_name || stateRecord.state_code);
      const response = await axios.get(`${API_BASE_URL}/nurseries/state-details/`, {
        params: {
          state_id: stateRecord.state_id,
          stateCode: stateRecord.state_code,
          state_name: cleanName,
        },
      });

      if (response?.data?.nurseries) {
        setHoverNurseries(response.data.nurseries);
      } else {
        setHoverNurseries([]);
      }
    } catch (error) {
      console.error("Error fetching hover nursery details:", error);
      setHoverNurseries([]);
    } finally {
      setLoadingHover(false);
    }
  };

  const chartEvents = [
    {
      eventName: "select",
      callback: ({ chartWrapper }) => {
        try {
          if (!chartWrapper) return;
          const chart = chartWrapper.getChart();
          if (!chart) return;
          const selection = chart.getSelection();

          if (selection && selection.length > 0) {
            const selectedItem = selection[0];
            const dataRow = selectedItem.row;

            if (dataRow !== null && dataRow !== undefined && mapData[dataRow]) {
              const stateRecord = mapData[dataRow];
              const cleanName = getCleanName(stateRecord.state_name || stateRecord.state_code);
              handleStateClick(stateRecord.state_code, cleanName, stateRecord.state_id);
            }
          }
        } catch (err) {
          // Prevent standard script error crash
        }
      },
    },
    {
      eventName: "onregionover",
      callback: ({ region }) => {
        try {
          if (!region || !mapData.length) return;

          const cleanRegionName = getCleanName(region);
          const isoRegion = getIsoCode(region);

          const stateRecord = mapData.find((item) => {
            const itemIso = getIsoCode(item.state_code || item.state_name);
            return itemIso === isoRegion || getCleanName(item.state_name) === cleanRegionName;
          });

          setHoverState(cleanRegionName);

          if (stateRecord) {
            fetchStateDetailsForHover(stateRecord);
          } else {
            setHoverNurseries([]);
          }
        } catch (err) {
          // Safe catch block
        }
      },
    },
    {
      eventName: "onregionout",
      callback: () => {
        setHoverState(null);
        setHoverNurseries([]);
      },
    },
  ];

  const handleStateClick = async (stateCode, stateName, stateId) => {
    const cleanName = getCleanName(stateName || stateCode);
    setSelectedState(cleanName);
    setLoadingModal(true);
    setShowModal(true);

    try {
      const response = await axios.get(`${API_BASE_URL}/nurseries/state-details/`, {
        params: {
          state_id: stateId,
          stateCode: stateCode,
          state_name: cleanName,
        },
      });

      if (response?.data?.nurseries) {
        setNurseryDetails(response.data.nurseries);
      } else {
        setNurseryDetails([]);
      }
    } catch (error) {
      console.error("Error fetching state nursery details:", error);
      setNurseryDetails([]);
    } finally {
      setLoadingModal(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedState(null);
    setNurseryDetails([]);
  };

  const chartOptions = {
    region: "IN",
    domain: "IN",
    displayMode: "regions",
    resolution: "provinces",
    colorAxis: {
      minValue: 0,
      maxValue: Math.max(highestState.count, 10),
      colors: ["#EBF5ED", "#A3D9B1", "#2E7D32", "#1B5E20"],
    },
    backgroundColor: "transparent",
    datalessRegionColor: "transparent",
    defaultColor: "#EBF5ED",
    keepAspectRatio: true,
    tooltip: { trigger: "none" },
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        maxWidth: "700px",
        margin: "0 auto",
        padding: "10px",
        fontFamily: "Arial, sans-serif",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span style={{ fontSize: "16px" }}>🌱</span>
        <h3 style={{ margin: 0, fontSize: "15px", color: "#333333", fontWeight: "600" }}>
          Total number of Registered Nurseries (State-wise)
        </h3>
      </div>

      <div style={{ width: "100%", height: "360px", position: "relative" }}>
        {chartData.length > 1 ? (
          <Chart
            chartType="GeoChart"
            width="100%"
            height="100%"
            data={chartData}
            options={chartOptions}
            chartEvents={chartEvents}
          />
        ) : (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#888", fontSize: "13px" }}>
            Loading map data...
          </div>
        )}

        {/* Hover Floating Card Table */}
        {hoverState && (
          <div
            style={{
              position: "absolute",
              top: `${tooltipPos.y}px`,
              left: `${tooltipPos.x}px`,
              backgroundColor: "#ffffff",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              pointerEvents: "none",
              zIndex: 999,
              width: "480px",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            <h4 style={{ margin: "0 0 8px 0", color: "#2e7d32", fontSize: "14px", borderBottom: "2px solid #2e7d32", paddingBottom: "4px" }}>
              Nurseries in {hoverState} ({hoverNurseries.length})
            </h4>

            {loadingHover ? (
              <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Loading nursery details...</p>
            ) : hoverNurseries.length === 0 ? (
              <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>No active nurseries registered.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#2e7d32", color: "#fff" }}>
                    <th style={{ padding: "6px", textAlign: "left" }}>Photo</th>
                    <th style={{ padding: "6px", textAlign: "left" }}>Nursery Name</th>
                    <th style={{ padding: "6px", textAlign: "left" }}>Address</th>
                    <th style={{ padding: "6px", textAlign: "left" }}>Contact</th>
                    <th style={{ padding: "6px", textAlign: "left" }}>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {hoverNurseries.map((nursery, idx) => {
                    const rawPhoto = nursery.photo_url || nursery.photoUrl || nursery.Nursery_PHOTO || nursery.photo;
                    const filename = rawPhoto ? rawPhoto.split("/").pop() : null;
                    const fullPhotoUrl = filename ? `${IMAGE_BASE_URL}${filename}` : null;

                    return (
                      <tr key={nursery.id || idx} style={{ borderBottom: "1px solid #eee", backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "4px", width: "70px", textAlign: "center" }}>
                          {fullPhotoUrl ? (
                            <img
                              src={fullPhotoUrl}
                              alt="Nursery"
                              style={{ width: "35px", height: "35px", objectFit: "cover", borderRadius: "4px" }}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.style.display = "none";
                                e.currentTarget.insertAdjacentHTML(
                                  "afterend",
                                  '<span style="font-size: 9px; color: #888; font-style: italic;">Coming Soon</span>'
                                );
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: "9px", color: "#888", fontStyle: "italic" }}>
                              Coming Soon
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "4px", fontWeight: "bold" }}>{nursery.name || "N/A"}</td>
                        <td style={{ padding: "4px" }}>{nursery.address || nursery.location || "N/A"}</td>
                        <td style={{ padding: "4px" }}>{nursery.contact_person || "N/A"}</td>
                        <td style={{ padding: "4px" }}>{nursery.phone || "N/A"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "#444444" }}>
        <div>Total Nurseries: <strong>{totalNurseries}</strong></div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>Density:</span>
          <div style={{ width: "90px", height: "6px", borderRadius: "3px", background: "linear-gradient(90deg, #EBF5ED 0%, #1B5E20 100%)" }} />
        </div>
        <div>Highest: <strong>{highestState.name} ({highestState.count})</strong></div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#fff", width: "85%", maxWidth: "900px", maxHeight: "85vh", borderRadius: "10px", padding: "20px", overflowY: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #2e7d32", paddingBottom: "10px", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#2e7d32", fontSize: "18px", fontWeight: "bold" }}>
                Nurseries in {selectedState} ({nurseryDetails.length})
              </h3>
              <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: "22px", fontWeight: "bold", cursor: "pointer", color: "#666" }}>
                &times;
              </button>
            </div>

            {loadingModal ? (
              <p style={{ textAlign: "center", padding: "30px", color: "#666" }}>Loading nursery details...</p>
            ) : nurseryDetails.length === 0 ? (
              <p style={{ textAlign: "center", padding: "30px", color: "#888" }}>No active nurseries found for {selectedState}.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#2e7d32", color: "#fff" }}>
                    <th style={{ padding: "10px", textAlign: "left" }}>Photo</th>
                    <th style={{ padding: "10px", textAlign: "left" }}>Nursery Name</th>
                    <th style={{ padding: "10px", textAlign: "left" }}>Address</th>
                    <th style={{ padding: "10px", textAlign: "left" }}>Contact Person</th>
                    <th style={{ padding: "10px", textAlign: "left" }}>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {nurseryDetails.map((nursery, index) => {
                    const rawPhoto = nursery.photo_url || nursery.photoUrl || nursery.Nursery_PHOTO || nursery.photo;
                    const filename = rawPhoto ? rawPhoto.split("/").pop() : null;
                    const fullPhotoUrl = filename ? `${IMAGE_BASE_URL}${filename}` : null;

                    return (
                      <tr key={nursery.id || index} style={{ borderBottom: "1px solid #e0e0e0", backgroundColor: index % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "10px", verticalAlign: "middle", width: "80px", textAlign: "center" }}>
                          {fullPhotoUrl ? (
                            <img
                              src={fullPhotoUrl}
                              alt={nursery.name || "Nursery"}
                              style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "6px", border: "1px solid #ddd", display: "block" }}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.style.display = "none";
                                e.currentTarget.insertAdjacentHTML(
                                  "afterend",
                                  '<span style="font-size: 11px; color: #888; font-style: italic;">Coming Soon</span>'
                                );
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: "11px", color: "#888", fontStyle: "italic" }}>
                              Coming Soon
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "10px", fontWeight: "bold", color: "#222" }}>{nursery.name || "N/A"}</td>
                        <td style={{ padding: "10px", color: "#444" }}>{nursery.address || nursery.location || "N/A"}</td>
                        <td style={{ padding: "10px", color: "#444" }}>{nursery.contact_person || "N/A"}</td>
                        <td style={{ padding: "10px", color: "#444" }}>{nursery.phone || "N/A"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IndiaMap;
