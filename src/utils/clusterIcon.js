import L from "leaflet";

const cache = new Map();

function formatCount(n) {
  if (n >= 1_000_000) return `${Number((n / 1_000_000).toFixed(1))}M`;
  if (n >= 1_000) return `${Number((n / 1_000).toFixed(n >= 10_000 ? 0 : 1))}k`;
  return String(n);
}

export function clusterIcon(count) {
  const label = formatCount(count);
  const size = Math.round(26 + Math.min(34, Math.log10(count) * 9)); // bigger count, bigger circle
  const key = `${label}-${size}`;

  if (!cache.has(key)) {
    cache.set(
      key,
      L.divIcon({
        html: `<div class="cluster" style="width:${size}px;height:${size}px">${label}</div>`,
        className: "",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      })
    );
  }
  return cache.get(key);
}