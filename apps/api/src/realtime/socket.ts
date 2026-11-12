import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { corsOrigins } from "../config/env";
import { logger } from "../lib/logger";
import type { AppointmentUpdateEventDTO, QueueSnapshotDTO } from "../types/dto";
import {
  appointmentRoom,
  QUEUE_ROOM,
  SOCKET_EVENTS,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "./events";

type ChanlieVetSocketServer = Server<ClientToServerEvents, ServerToClientEvents>;

let io: ChanlieVetSocketServer | null = null;

/**
 * Inicializa Socket.io sobre el mismo servidor HTTP de Express.
 *
 * Salas:
 *  - `queue`: sala de espera virtual (pública). Todos los paneles y pantallas
 *    de sala se suscriben para recibir el snapshot completo en cada cambio.
 *  - `appointment:<CODE>`: seguimiento individual de una cita por su código.
 */
export function initSocketServer(httpServer: HttpServer): ChanlieVetSocketServer {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: corsOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    connectionStateRecovery: {
      // Permite recuperar la conexión si el cliente se cae por menos de 2 min.
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
  });

  io.on("connection", (socket) => {
    logger.info(`Socket conectado: ${socket.id}`);

    socket.on(SOCKET_EVENTS.QUEUE_WATCH, () => {
      void socket.join(QUEUE_ROOM);
    });

    socket.on(SOCKET_EVENTS.QUEUE_UNWATCH, () => {
      void socket.leave(QUEUE_ROOM);
    });

    socket.on(SOCKET_EVENTS.APPOINTMENT_WATCH, (code) => {
      if (typeof code !== "string" || code.trim().length === 0) return;
      void socket.join(appointmentRoom(code));
    });

    socket.on(SOCKET_EVENTS.APPOINTMENT_UNWATCH, (code) => {
      if (typeof code !== "string") return;
      void socket.leave(appointmentRoom(code));
    });

    socket.on("disconnect", (reason) => {
      logger.info(`Socket desconectado: ${socket.id} (${reason})`);
    });
  });

  logger.info("Socket.io inicializado y escuchando eventos en tiempo real");
  return io;
}

function getIO(): ChanlieVetSocketServer {
  if (!io) {
    throw new Error("Socket.io aún no ha sido inicializado");
  }
  return io;
}

/** Emite el snapshot de la cola a todas las pantallas suscritas. */
export function emitQueueUpdate(snapshot: QueueSnapshotDTO): void {
  getIO().to(QUEUE_ROOM).emit(SOCKET_EVENTS.QUEUE_UPDATED, snapshot);
}

/** Emite la actualización de una cita al canal privado de su código. */
export function emitAppointmentUpdate(payload: AppointmentUpdateEventDTO): void {
  getIO()
    .to(appointmentRoom(payload.code))
    .emit(SOCKET_EVENTS.APPOINTMENT_UPDATED, payload);
}

export function closeSocketServer(): void {
  if (!io) return;
  io.close();
  io = null;
}
