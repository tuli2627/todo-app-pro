import { Chart } from "react-google-charts";

const data = [
  ["State", "Nurseries"],

  ["IN-AN", 13],
  ["IN-AR", 3],
  ["IN-GJ", 299],
  ["IN-HP", 27],
  ["IN-JK", 49],
  ["IN-KA", 206],
  ["IN-MP", 40],
  ["IN-MN", 50],
  ["IN-MZ", 46],
  ["IN-PB", 33],
  ["IN-RJ", 6],
  ["IN-SK", 7],
  ["IN-TG", 77],
  ["IN-TR", 8],
  ["IN-WB", 3],
];

const options = {
  region: "IN",
  domain: "IN",
  displayMode: "regions",
  resolution: "provinces",

  datalessRegionColor: "#ECEFF1",

  colorAxis: {
  colors: [
    "#E53935", // Red
    "#FB8C00", // Orange
    "#FDD835", // Yellow
    "#43A047", // Green
    "#00897B", // Teal
    "#1E88E5", // Blue
    "#3949AB", // Indigo
    "#8E24AA", // Purple
    "#D81B60", // Pink
    "#6D4C41", // Brown
    "#7CB342", // Lime
    "#00ACC1", // Cyan
    "#5E35B1", // Deep Purple
    "#EF5350", // Light Red
    "#26A69A", // Aqua Green
    "#FF7043", // Deep Orange
    "#C0CA33", // Olive
    "#AB47BC", // Violet
    "#29B6F6", // Sky Blue
    "#FFA726"  // Amber
  ]
},

  legend: "none",

  backgroundColor: "transparent",

  tooltip: {
    trigger: "focus",
  },
};

function IndiaMap() {
  return (
    <Chart
      chartType="GeoChart"
      width="100%"
      height="450px"
      data={data}
      options={options}
    />
  );
}

export default IndiaMap;