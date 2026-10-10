import React from "react";
import { TileLayer } from "react-leaflet";

function SatelliteTileLayer() {
  return (
    <TileLayer
      attribution='Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    />
  );
}

export default SatelliteTileLayer;
