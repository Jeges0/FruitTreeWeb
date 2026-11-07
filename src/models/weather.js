import { describeWeather } from "../utils/weatherCode";
import { WEATHER_PAST_DAYS } from "../config";

const sum = (days) => days.reduce((total, d) => total + d.rain, 0);
const round1 = (n) => Math.round(n * 10) / 10;

export function toWeather(raw) {
  const { current, daily } = raw;

  const days = daily.time.map((date, i) => ({
    date,
    rain: daily.precipitation_sum[i] ?? 0,
    et0: daily.et0_fao_evapotranspiration[i] ?? 0,
    tmax: daily.temperature_2m_max[i],
    tmin: daily.temperature_2m_min[i],
  }));

  const found = days.findIndex((d) => d.date === current.time.slice(0, 10));
  const todayIndex = found === -1 ? WEATHER_PAST_DAYS : found;

  return {
    current: {
      temp: Math.round(current.temperature_2m),
      wind: Math.round(current.wind_speed_10m),
      ...describeWeather(current.weather_code),
    },
    days,
    todayIndex,
    rainPast7: round1(sum(days.slice(Math.max(0, todayIndex - 7), todayIndex))),
    rainNext3: round1(sum(days.slice(todayIndex + 1, todayIndex + 4))),
  };
}