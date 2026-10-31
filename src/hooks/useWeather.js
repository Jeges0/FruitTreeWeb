import { useEffect, useState } from "react";
import { fetchWeather } from "../services/weatherApi";
import { toWeather } from "../models/weather";

const cache = new Map();
const MAX_AGE = 30 * 60 * 1000; // 30 minutes

function fromCache(key) {
  const hit = cache.get(key);
  return hit && Date.now() - hit.time < MAX_AGE ? hit.data : null;
}

export function useWeather(lat, lng) {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const [weather, setWeather] = useState(() => fromCache(key));
  const [loading, setLoading] = useState(() => !fromCache(key));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (fromCache(key)) return;
    const controller = new AbortController();

    fetchWeather(lat, lng, controller.signal)
      .then((raw) => {
        const data = toWeather(raw);
        cache.set(key, { data, time: Date.now() });
        setWeather(data);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [key, lat, lng]);

  return { weather, loading, error };
}