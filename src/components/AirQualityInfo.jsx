import { useAirQuality } from "../hooks/useAirQuality";

function AirQualityInfo({ position }) {
  const [lat, lng] = position;
  const { air, loading, error } = useAirQuality(lat, lng);

  if (loading) return <p>Loading air quality...</p>;
  if (error) return <p>Couldn't load air quality.</p>;
  if (!air) return <p>Air quality isn't available here.</p>;

  return (
    <div className="air">
      <p>
        <span className={`aqi-badge ${air.level}`}>{air.label}</span>{" "}
        <b>Air quality</b> (EAQI {air.aqi})
      </p>
      <p>
        PM2.5: {air.pm25 ?? "n/a"} µg/m³ · PM10: {air.pm10 ?? "n/a"} µg/m³
      </p>
      <small>Air quality: Open-Meteo, CAMS</small>
    </div>
  );
}

export default AirQualityInfo;