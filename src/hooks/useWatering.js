import { useEffect, useState } from "react";
import { fetchWatering } from "../services/wateringApi";

const cache = new Map();

export function useWatering(lat, lng) {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const [result, setResult] = useState(cache.get(key) ?? null);
  const [loading, setLoading] = useState(!cache.has(key));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cache.has(key)) return;
    const controller = new AbortController();

    fetchWatering(lat, lng, controller.signal)
      .then((data) => {
        cache.set(key, data);
        setResult(data);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [key, lat, lng]);

  return { result, loading, error };
}