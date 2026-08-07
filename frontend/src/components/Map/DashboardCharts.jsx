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
  "Andaman",
  "Arunachal",
  "Gujarat",
  "Himachal",
  "J&K",
  "Karnataka",
  "M.P.",
  "Manipur",
  "Mizoram",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Telangana",
  "Tripura",
  "West Bengal"
];

const values = [
  13,
  3,
  299,
  27,
  49,
  206,
  40,
  50,
  46,
  33,
  6,
  7,
  77,
  8,
  3
];

const lineData = {
  labels,
  datasets: [
    {
      label: "Total Nursery",
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
      label: "Total Nursery",
      data: values,
      backgroundColor: [
        "#6495ED",
        "#000080",
        "#800000",
        "#006400",
        "#8B4513",
        "#2E8B57",
        "#4682B4",
        "#D2691E",
        "#9ACD32",
        "#CD5C5C",
        "#FF8C00",
        "#483D8B",
        "#008080",
        "#BDB76B",
        "#8FBC8F",
      ],
    },
  ],
};

const lineOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    datalabels: {
      anchor: "end",
      align: "top",
      font: {
        size: 10,
      },
    },
  },
};

const barOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    datalabels: {
      display: false,
    },
  },
};

function DashboardCharts() {

  const handleChartClick = (event, elements) => {
    if (!elements.length) return;

    const index = elements[0].index;
    const state = labels[index];   // <-- FIXED HERE

    alert("Opening details for " + state);

    // Example:
    // window.location.href = "/state/" + state;
  };

  return (
    <div className="charts-row">

      <div className="chart-card">
        <Line
  data={lineData}
  options={{
    ...lineOptions,
    onClick: handleChartClick,
  }}
/>
      </div>

      <div className="chart-card">
       <Bar
  data={barData}
  options={{
    ...barOptions,
    onClick: handleChartClick,
  }}
/>
      </div>

      <div className="chart-card">
        <Line
  data={lineData}
  options={{
    ...lineOptions,
    onClick: handleChartClick,
  }}
/>
      </div>

    </div>
  );
}

export default DashboardCharts;