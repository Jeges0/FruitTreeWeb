import { useWeather } from "../hooks/useWeather";
import { wateringAdvice } from "../utils/waterCalc";

function adviceText(advice) {
  if (advice.isToday) return "💧 Water today";
  if (advice.waterOn) return `💧 Water on ${advice.waterOn}`;
  return "✅ No watering needed this week";
}

function WeatherInfo({ position }) {
  const [lat, lng] = position;
  const { weather, loading, error } = useWeather(lat, lng);

  if (loading) return <p>Loading weather...</p>;
  if (error || !weather) return <p>Couldn't load weather.</p>;

  const advice = wateringAdvice(weather.days, weather.todayIndex);

  return (
    <div className="weather">
      <p className="weather-now">
        {weather.current.icon} <b>{weather.current.temp}°C</b>, {weather.current.label}
      </p>
      <p>Wind: {weather.current.wind} km/h</p>
      <p>Rain, last 7 days: {weather.rainPast7} mm</p>
      <p>Rain, next 3 days: {weather.rainNext3} mm</p>
      <p className="advice">{adviceText(advice)}</p>
      <small>Weather: Open-Meteo.com</small>
    </div>
  );
}

export default WeatherInfo;