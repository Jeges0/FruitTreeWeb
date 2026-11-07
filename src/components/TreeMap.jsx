import { useCallback, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { FRUITS } from "../data/fruits";
import { treeIcon } from "../utils/treeIcon";
import FruitTreeInfoPopup from "./FruitTreeInfoPopup";
import ClusterMarkers from "./ClusterMarkers";
import WeatherInfo from "./WeatherInfo";
import AirQualityInfo from "./AirQualityInfo";

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// Tells the parent which area and zoom level is visible
function ViewWatcher({ onViewChange }) {
  const map = useMap();

  const report = useCallback(() => {
    const b = map.getBounds();
    onViewChange({
      bounds: {
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
      },
      zoom: map.getZoom(),
    });
  }, [map, onViewChange]);

  useMapEvents({ moveend: report });
  useEffect(() => {
    report();
  }, [report]);

  return null;
}

function TreeMap({ center, trees, publicTrees, clusters, onMapClick, onViewChange }) {
  return (
    <MapContainer center={center} zoom={14} className="map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />
      <ViewWatcher onViewChange={onViewChange} />

      <ClusterMarkers clusters={clusters} />

      {publicTrees.map((tree) => (
        <Marker
          key={tree.id}
          position={tree.position}
          icon={treeIcon(tree.emoji, "public")}
        >
          <Popup>
            <FruitTreeInfoPopup tree={tree} />
          </Popup>
        </Marker>
      ))}

      {trees.map((tree) => (
  <Marker key={tree.id} position={tree.position} icon={treeIcon(FRUITS[tree.fruit])}>
    <Popup>
      <div className="tree-popup">
        <h3>
          {FRUITS[tree.fruit]} {tree.fruit} (yours)
        </h3>
        <WeatherInfo position={tree.position} />
        <hr />
        <AirQualityInfo position={tree.position} />
      </div>
    </Popup>
  </Marker>
))}
    </MapContainer>
  );
}

export default TreeMap;