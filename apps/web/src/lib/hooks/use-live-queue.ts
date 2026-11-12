"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getSocket, SOCKET_EVENTS } from "@/lib/socket";
import type { QueueSnapshot } from "@/lib/types";

/**
 * Sala de espera en vivo: carga el snapshot inicial por REST y luego
 * se mantiene sincronizada mediante Socket.io.
 */
export function useLiveQueue() {
  const [snapshot, setSnapshot] = useState<QueueSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const socket = getSocket();

    const handleUpdate = (next: QueueSnapshot) => {
      if (active) setSnapshot(next);
    };

    const handleConnect = () => {
      if (active) setConnected(true);
    };

    const handleDisconnect = () => {
      if (active) setConnected(false);
    };

    apiFetch<{ queue: QueueSnapshot }>("/api/queue")
      .then(({ queue }) => {
        if (active) setSnapshot(queue);
      })
      .catch(() => {
        if (active) setError("No se pudo cargar la sala de espera");
      });

    socket.on(SOCKET_EVENTS.QUEUE_UPDATED, handleUpdate);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    setConnected(socket.connected);

    return () => {
      active = false;
      socket.off(SOCKET_EVENTS.QUEUE_UPDATED, handleUpdate);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  return { snapshot, connected, error };
}
