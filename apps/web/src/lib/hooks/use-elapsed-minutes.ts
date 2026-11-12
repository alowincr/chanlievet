"use client";

import { useEffect, useState } from "react";
import { elapsedMinutes } from "@/lib/format";

/** Minutos transcurridos desde una fecha, actualizado cada 30 segundos. */
export function useElapsedMinutes(since: string | null): number {
  const [minutes, setMinutes] = useState(() =>
    since ? elapsedMinutes(since) : 0,
  );

  useEffect(() => {
    if (!since) {
      setMinutes(0);
      return;
    }

    setMinutes(elapsedMinutes(since));
    const interval = window.setInterval(() => {
      setMinutes(elapsedMinutes(since));
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [since]);

  return minutes;
}
