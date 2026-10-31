import { useEffect, useMemo, useState } from "react";
import { fetchTrees, fetchClusters } from "../services/fruitTreeApi";
import { toTree, toCluster } from "../models/fruitTree";
import { MIN_ZOOM } from "../config";

export function useFruitTree(view) {
  const [result, setResult] = useState({ mode: "clusters", data: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!view) return;

    const mode = view.zoom >= MIN_ZOOM ? "trees" : "clusters";
    const controller = new AbortController();
    const request =
      mode === "trees"
        ? fetchTrees(view.bounds, controller.signal)
        : fetchClusters(view.bounds, view.zoom, controller.signal);

    setLoading(true);
    request
      .then((data) => {
        setResult({ mode, data });
        setError(null);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort(); // cancels outdated requests
  }, [view]);

  const trees = useMemo(
    () => (result.mode === "trees" ? result.data.map(toTree) : []),
    [result]
  );
  const clusters = useMemo(
    () => (result.mode === "clusters" ? result.data.map(toCluster) : []),
    [result]
  );

  return { trees, clusters, loading, error };
}