import { useEffect, useState } from "react";
import { fetchTree } from "../services/fruitTreeApi";
import { toDetails } from "../models/fruitTree";

const cache = new Map(); // so reopening a popup doesn't refetch

export function useLocationDetails(id) {
  const [details, setDetails] = useState(cache.get(id) ?? null);
  const [loading, setLoading] = useState(!cache.has(id));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cache.has(id)) return;
    const controller = new AbortController();
    fetchTree(id, controller.signal)
      .then((raw) => {
        const d = toDetails(raw);
        cache.set(id, d);
        setDetails(d);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  return { details, loading, error };
}