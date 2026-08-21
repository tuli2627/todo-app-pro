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
import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const labels = [
  "Andaman", "Arunachal", "Gujarat", "Himachal", "J&K",
  "Karnataka", "M.P.", "Manipur", "Mizoram", "Punjab",
  "Rajasthan", "Sikkim", "Telangana", "Tripura", "West Bengal"
];

const values = [
  13, 3, 299, 27, 49, 206, 40, 50, 46, 33, 6, 7, 77, 8, 3
];

const lineData = {
  labels,
  datasets: [
    {
      label: "Total Nurseries",
      data: values,
      borderColor: "#c0392b",
      backgroundColor: "#c0392b",
      pointRadius: 4,
      borderWidth: 2,
      tension: 0.2,
    },
  ],
};

const barData = {
  labels,
  datasets: [
    {
      label: "Total Nurseries",
      data: values,
      backgroundColor: [
        "#6495ED", "#000080", "#800000", "#006400", "#8B4513",
        "#2E8B57", "#4682B4", "#D2691E", "#9ACD32", "#CD5C5C",
        "#FF8C00", "#483D8B", "#008080", "#BDB76B", "#8FBC8F",
      ],
    },
  ],
};

// 1. We create common options for BOTH charts to fix axes and clickability
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false, // Allows us to control the height of the chart box
  interaction: {
    mode: "index", // Hovering/clicking anywhere in the column selects that state
    intersect: false, // You no longer have to click the exact dot/bar
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: true, // Shows details when you hover over a point/bar
      backgroundColor: "rgba(0,0,0,0.8)",
      padding: 10,
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: "States (Click column for details)", // Bottom Label
        color: "#2E8B57",
        font: { weight: "bold", size: 12 },
      },
      ticks: {
        maxRotation: 45, // Forces names to tilt evenly
        minRotation: 45,
        font: { size: 10 },
      },
      grid: {
        display: false, // Removes background vertical lines for a cleaner look
      },
    },
    y: {
      title: {
        display: true,
        text: "Number of Nurseries", // Side Label
        color: "#2E8B57",
        font: { weight: "bold", size: 12 },
      },
      beginAtZero: true,
      suggestedMax: 320, // Gives a little headroom at the top of the chart
    },
  },
};

// 2. Apply specific data labels to Line chart
const lineOptions = {
  ...commonOptions,
  plugins: {
    ...commonOptions.plugins,
    datalabels: {
      anchor: "end",
      align: "top",
      font: { size: 10 },
    },
  },
};

// 3. Remove specific data labels from Bar chart so it's not cluttered
const barOptions = {
  ...commonOptions,
  plugins: {
    ...commonOptions.plugins,
    datalabels: {
      display: false,
    },
  },
};

function DashboardCharts() {
  const [activeStateData, setActiveStateData] = useState(null);

  const handleChartClick = (event, elements) => {
    if (!elements.length) return;

    // Because interaction mode is 'index', elements[0] represents the whole column
    const index = elements[0].index;
    const stateName = labels[index];
    const stateValue = values[index];

    setActiveStateData({ name: stateName, value: stateValue });
  };

  return (
    <div className="charts-wrapper">
      <div className="charts-row" style={{ display: "flex", gap: "20px", justifyContent: "space-between" }}>
        
        {/* We added fixed heights (350px) and padding to the containers so they don't squish */}
        <div className="chart-card" style={{ flex: 1, minWidth: 0, height: "350px", backgroundColor: "#fff", padding: "15px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <Line data={lineData} options={{ ...lineOptions, onClick: handleChartClick }} />
        </div>

        <div className="chart-card" style={{ flex: 1, minWidth: 0, height: "350px", backgroundColor: "#fff", padding: "15px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <Bar data={barData} options={{ ...barOptions, onClick: handleChartClick }} />
        </div>

        <div className="chart-card" style={{ flex: 1, minWidth: 0, height: "350px", backgroundColor: "#fff", padding: "15px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <Line data={lineData} options={{ ...lineOptions, onClick: handleChartClick }} />
        </div>

      </div>

      {activeStateData && (
        <div style={{ marginTop: "20px", padding: "20px", backgroundColor: "#f4fdf4", borderLeft: "6px solid #2E8B57", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#2E8B57" }}>{activeStateData.name} Overview</h3>
          <p style={{ margin: 0 }}>
            Total Nurseries: <strong>{activeStateData.value}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

export default DashboardCharts;