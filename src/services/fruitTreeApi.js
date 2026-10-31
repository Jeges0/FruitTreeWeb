import { API_URL, MAX_TREES } from "../config";

async function get(path, params, signal) {
  const query = new URLSearchParams(params);
  const res = await fetch(`${API_URL}${path}?${query}`, { signal });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

export function fetchTrees({ south, west, north, east }, signal) {
  return get("/trees", { south, west, north, east, limit: MAX_TREES }, signal);
}

export function fetchClusters({ south, west, north, east }, zoom, signal) {
  return get("/clusters", { south, west, north, east, zoom: Math.round(zoom) }, signal);
}

export function fetchTree(id, signal) {
  return get(`/trees/${id}`, {}, signal);
}