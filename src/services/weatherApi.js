import { WEATHER_URL, WEATHER_PAST_DAYS, WEATHER_FORECAST_DAYS } from "../config";

export async function fetchWeather(lat, lng, signal) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    current: "temperature_2m,weather_code,wind_speed_10m",
    daily: "precipitation_sum,et0_fao_evapotranspiration,temperature_2m_max,temperature_2m_min",
    past_days: WEATHER_PAST_DAYS,
    forecast_days: WEATHER_FORECAST_DAYS,
    timezone: "auto",
  });

  const res = await fetch(`${WEATHER_URL}?${params}`, { signal });
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  return res.json();
}