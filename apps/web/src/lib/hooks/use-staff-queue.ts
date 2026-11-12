"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getSocket, SOCKET_EVENTS } from "@/lib/socket";
import type { QueueSnapshot } from "@/lib/types";

/**
 * Sala de espera para el personal autenticado.
 *
 * A diferencia de `useLiveQueue`, pide el snapshot completo (nombres
 * completos) al endpoint privado y lo vuelve a consultar cada vez que la cola
 * cambia. El evento de Socket.io no transporta datos personales.
 */
export function useStaffQueue() {
  const [snapshot, setSnapshot] = useState<QueueSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const { queue } = await apiFetch<{ queue: QueueSnapshot }>(
        "/api/queue/staff",
      );
      if (activeRef.current) {
        setSnapshot(queue);
        setError(null);
      }
    } catch {
      if (activeRef.current) {
        setError("No se pudo cargar la sala de espera del equipo.");
      }
    }
  }, []);

  useEffect(() => {
    activeRef.current = true;
    const socket = getSocket();

    const handleUpdate = () => void load();
    const handleConnect = () => {
      if (!activeRef.current) return;
      setConnected(true);
      void load();
    };
    const handleDisconnect = () => {
      if (activeRef.current) setConnected(false);
    };

    void load();
    socket.on(SOCKET_EVENTS.QUEUE_UPDATED, handleUpdate);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    setConnected(socket.connected);

    return () => {
      activeRef.current = false;
      socket.off(SOCKET_EVENTS.QUEUE_UPDATED, handleUpdate);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [load]);

  return { snapshot, connected, error, refetch: load };
}
