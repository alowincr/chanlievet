"use client";

import { useEffect } from "react";
import { getSocket, SOCKET_EVENTS } from "@/lib/socket";
import type { AppointmentUpdateEvent } from "@/lib/types";

/** Se suscribe al canal privado de una cita (por su código). */
export function useAppointmentWatch(
  code: string | null,
  onUpdate: (payload: AppointmentUpdateEvent) => void,
) {
  useEffect(() => {
    if (!code) return;

    const normalized = code.trim().toUpperCase();
    const socket = getSocket();

    const handler = (payload: AppointmentUpdateEvent) => {
      if (payload.code.trim().toUpperCase() === normalized) {
        onUpdate(payload);
      }
    };

    socket.emit(SOCKET_EVENTS.APPOINTMENT_WATCH, normalized);
    socket.on(SOCKET_EVENTS.APPOINTMENT_UPDATED, handler);

    return () => {
      socket.emit(SOCKET_EVENTS.APPOINTMENT_UNWATCH, normalized);
      socket.off(SOCKET_EVENTS.APPOINTMENT_UPDATED, handler);
    };
  }, [code, onUpdate]);
}
