import { API_URL } from "../config";

export async function fetchWatering(lat, lng, signal) {
  const query = new URLSearchParams({ lat, lng });
  const res = await fetch(`${API_URL}/watering?${query}`, { signal });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}