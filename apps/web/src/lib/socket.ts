"use client";

import { io, type Socket } from "socket.io-client";
import { API_URL } from "./api";
import type { AppointmentUpdateEvent, QueueSnapshot } from "./types";

export const SOCKET_EVENTS = {
  QUEUE_WATCH: "queue:watch",
  QUEUE_UNWATCH: "queue:unwatch",
  APPOINTMENT_WATCH: "appointment:watch",
  APPOINTMENT_UNWATCH: "appointment:unwatch",
  QUEUE_UPDATED: "queue:updated",
  APPOINTMENT_UPDATED: "appointment:updated",
} as const;

interface ServerToClientEvents {
  [SOCKET_EVENTS.QUEUE_UPDATED]: (snapshot: QueueSnapshot) => void;
  [SOCKET_EVENTS.APPOINTMENT_UPDATED]: (payload: AppointmentUpdateEvent) => void;
}

interface ClientToServerEvents {
  [SOCKET_EVENTS.QUEUE_WATCH]: () => void;
  [SOCKET_EVENTS.QUEUE_UNWATCH]: () => void;
  [SOCKET_EVENTS.APPOINTMENT_WATCH]: (code: string) => void;
  [SOCKET_EVENTS.APPOINTMENT_UNWATCH]: (code: string) => void;
}

type ChanlieVetSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: ChanlieVetSocket | null = null;

/**
 * Socket singleton del navegador. Se conecta al mismo API y se suscribe
 * automáticamente a la sala pública de espera.
 */
export function getSocket(): ChanlieVetSocket {
  if (!socket) {
    socket = io(API_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
    });

    socket.on("connect", () => {
      socket?.emit(SOCKET_EVENTS.QUEUE_WATCH);
    });
  }

  return socket;
}
