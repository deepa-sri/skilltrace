"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";

/** Small data hook: const { data, loading, error, reload } = useApi("/me/"); */
export function useApi(path, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState(null);
  const key = JSON.stringify(params || {});
  const alive = useRef(true);

  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      const d = await api(path, { params: JSON.parse(key) });
      if (alive.current) {
        setData(d);
        setError(null);
      }
    } catch (e) {
      if (alive.current) setError(e);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [path, key]);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  return { data, loading, error, reload: load, setData };
}
