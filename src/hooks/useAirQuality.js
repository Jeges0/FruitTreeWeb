import { useEffect, useState } from "react";
import { fetchAirQuality } from "../services/airQualityApi";
import { toAirQuality } from "../models/airQuality";

const cache = new Map();
const MAX_AGE = 30 * 60 * 1000; // 30 minutes

function fromCache(key) {
  const hit = cache.get(key);
  return hit && Date.now() - hit.time < MAX_AGE ? hit : null;
}

export function useAirQuality(lat, lng) {
  const key = `${lat.toFixed(1)},${lng.toFixed(1)}`;
  const [air, setAir] = useState(() => fromCache(key)?.data ?? null);
  const [loading, setLoading] = useState(() => !fromCache(key));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (fromCache(key)) return;
    const controller = new AbortController();

    fetchAirQuality(lat, lng, controller.signal)
      .then((raw) => {
        const data = toAirQuality(raw);
        cache.set(key, { data, time: Date.now() });
        setAir(data);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [key, lat, lng]);

  return { air, loading, error };
}