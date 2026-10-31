import { describeAqi } from "../utils/airQualityLevel";

const round = (v) => (v == null ? null : Math.round(v * 10) / 10);

// Returns null when the service has no data for this place
export function toAirQuality(raw) {
  const c = raw.current;
  if (!c || c.european_aqi == null) return null;

  return {
    aqi: Math.round(c.european_aqi),
    pm25: round(c.pm2_5),
    pm10: round(c.pm10),
    ozone: round(c.ozone),
    no2: round(c.nitrogen_dioxide),
    ...describeAqi(c.european_aqi),
  };
}