import type { AppointmentUpdateEventDTO, QueueSnapshotDTO } from "../types/dto";

/**
 * Contrato de eventos Socket.io (servidor <-> cliente).
 * Mantener en sincronía con `apps/web/src/lib/socket.ts`.
 */
export const SOCKET_EVENTS = {
  // Cliente -> servidor
  QUEUE_WATCH: "queue:watch",
  QUEUE_UNWATCH: "queue:unwatch",
  APPOINTMENT_WATCH: "appointment:watch",
  APPOINTMENT_UNWATCH: "appointment:unwatch",

  // Servidor -> cliente
  QUEUE_UPDATED: "queue:updated",
  APPOINTMENT_UPDATED: "appointment:updated",
} as const;

/** Payloads de los eventos emitidos por el servidor. */
export interface ServerToClientEvents {
  [SOCKET_EVENTS.QUEUE_UPDATED]: (snapshot: QueueSnapshotDTO) => void;
  [SOCKET_EVENTS.APPOINTMENT_UPDATED]: (payload: AppointmentUpdateEventDTO) => void;
}

/** Payloads de los eventos emitidos por el cliente. */
export interface ClientToServerEvents {
  [SOCKET_EVENTS.QUEUE_WATCH]: () => void;
  [SOCKET_EVENTS.QUEUE_UNWATCH]: () => void;
  [SOCKET_EVENTS.APPOINTMENT_WATCH]: (code: string) => void;
  [SOCKET_EVENTS.APPOINTMENT_UNWATCH]: (code: string) => void;
}

export const QUEUE_ROOM = "queue";

export function appointmentRoom(code: string): string {
  return `appointment:${code.trim().toUpperCase()}`;
}
