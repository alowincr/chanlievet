"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";

/**
 * Fetch GET simple con estados de carga/error y refetch manual.
 * Ideal para datos que además se actualizan por WebSocket.
 */
export function useApiQuery<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(path));
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    apiFetch<T>(path)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(
          caught instanceof ApiError
            ? caught.message
            : "No se pudo cargar la información",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [path, version]);

  return { data, loading, error, refetch, setData };
}
