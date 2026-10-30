import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FRUITS } from "../data/fruits";

function treeIcon(fruit) {
  return L.divIcon({
    html: `<div class="tree-icon">${FRUITS[fruit]}</div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function TreeMap({ center, trees, onMapClick }) {
  return (
    <MapContainer center={center} zoom={14} className="map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={onMapClick} />

      {trees.map((tree) => (
        <Marker key={tree.id} position={tree.position} icon={treeIcon(tree.fruit)}>
          <Popup>{tree.fruit} tree</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default TreeMap;