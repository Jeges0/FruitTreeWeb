import { AIR_QUALITY_URL } from "../config";

export async function fetchAirQuality(lat, lng, signal) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    current: "european_aqi,pm2_5,pm10,ozone,nitrogen_dioxide",
    timezone: "auto",
  });

  const res = await fetch(`${AIR_QUALITY_URL}?${params}`, { signal });
  if (!res.ok) throw new Error(`Air quality request failed (${res.status})`);
  return res.json();
}