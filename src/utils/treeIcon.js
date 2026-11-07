import L from "leaflet";

const cache = new Map();

export function treeIcon(emoji, extraClass = "") {
  const key = `${emoji}|${extraClass}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      L.divIcon({
        html: `<div class="tree-icon ${extraClass}">${emoji}</div>`,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
    );
  }
  return cache.get(key);
}