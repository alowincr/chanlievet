import { prisma } from "../../lib/prisma";
import { limaDayRange } from "../../lib/time";
import { emitQueueUpdate } from "../../realtime/socket";
import type {
  AppointmentStatusValue,
  QueuePatientDTO,
  QueueSnapshotDTO,
} from "../../types/dto";
import {
  appointmentInclude,
  toAppointmentDTO,
  type AppointmentWithRelations,
} from "../appointments/appointment.mapper";

function partialName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName.trim();
  return `${parts[0]} ${parts[1]?.charAt(0) ?? ""}.`;
}

function toQueuePatient(
  appointment: AppointmentWithRelations,
  position: number | null,
  viewer: "public" | "staff",
): QueuePatientDTO {
  const dto = toAppointmentDTO(appointment, position);

  return {
    appointmentId: dto.id,
    status: appointment.status === "IN_PROGRESS" ? "IN_PROGRESS" : "WAITING",
    priority: appointment.priority,
    triageSeverity: appointment.triageSeverity,
    triageSymptoms: viewer === "staff" ? appointment.triageSymptoms : null,
    position,
    scheduledAt: dto.scheduledAt,
    checkedInAt: dto.checkedInAt,
    startedAt: dto.startedAt,
    pet: {
      name: dto.pet.name,
      species: dto.pet.species,
      photoUrl: dto.pet.photoUrl,
    },
    owner: {
      fullName:
        viewer === "staff" ? dto.owner.fullName : partialName(dto.owner.fullName),
    },
    service: { name: dto.service.name },
    vet: dto.assignedVet
      ? { fullName: dto.assignedVet.fullName, avatarUrl: dto.assignedVet.avatarUrl }
      : null,
  };
}

/**
 * Estado actual de la sala de espera virtual.
 *
 * Solo entran las citas de HOY (calendario de Lima). Las reservas de días
 * futuros quedan fuera de la cola hasta que llegue su fecha, que era el
 * origen de que una cita del viernes apareciera como "llegó hace 21 horas".
 *
 * `viewer` controla el nivel de detalle: la sala pública recibe nombres
 * parciales y el personal recibe nombres completos, pero nunca datos de
 * contacto ni códigos de seguimiento.
 */
export async function getQueueSnapshot(
  now: Date = new Date(),
  viewer: "public" | "staff" = "public",
): Promise<QueueSnapshotDTO> {
  const { start, end, key } = limaDayRange(now);
  const today = { gte: start, lt: end };

  const [waiting, inProgress] = await Promise.all([
    prisma.appointment.findMany({
      where: { status: "WAITING", scheduledAt: today },
      include: appointmentInclude,
      // Las emergencias van primero; dentro de cada prioridad, por llegada.
      orderBy: [
        { priority: "desc" },
        { checkedInAt: "asc" },
        { scheduledAt: "asc" },
      ],
    }),
    prisma.appointment.findMany({
      where: { status: "IN_PROGRESS", scheduledAt: today },
      include: appointmentInclude,
      orderBy: [{ startedAt: "asc" }],
    }),
  ]);

  return {
    date: key,
    waiting: waiting.map((appointment, index) =>
      toQueuePatient(appointment, index + 1, viewer),
    ),
    inProgress: inProgress.map((appointment) =>
      toQueuePatient(appointment, null, viewer),
    ),
    waitingCount: waiting.length,
    inProgressCount: inProgress.length,
    updatedAt: now.toISOString(),
  };
}

type QueuePositionInput = Pick<
  AppointmentWithRelations,
  "id" | "status" | "checkedInAt" | "scheduledAt"
>;

/** Posición 1-based del paciente dentro de la cola de hoy (solo si espera). */
export async function getQueuePositionFor(
  appointment: QueuePositionInput,
): Promise<number | null> {
  if (appointment.status !== "WAITING" || !appointment.checkedInAt) {
    return null;
  }

  const { start, end } = limaDayRange(new Date());
  const appointmentDay = limaDayRange(appointment.scheduledAt);

  // Una cita de otro día nunca forma parte de la cola de hoy.
  if (appointmentDay.key !== limaDayRange(new Date()).key) {
    return null;
  }

  // Se ordena igual que el snapshot: emergencia primero y luego por llegada.
  // Así la posición que ve el cliente coincide con la fila real.
  const waiting = await prisma.appointment.findMany({
    where: { status: "WAITING", scheduledAt: { gte: start, lt: end } },
    orderBy: [
      { priority: "desc" },
      { checkedInAt: "asc" },
      { id: "asc" },
    ],
    select: { id: true },
  });

  const index = waiting.findIndex((item) => item.id === appointment.id);
  return index === -1 ? null : index + 1;
}

/** Recalcula la cola y la emite a todas las pantallas públicas conectadas. */
export async function broadcastQueue(): Promise<void> {
  const snapshot = await getQueueSnapshot(new Date(), "public");
  emitQueueUpdate(snapshot);
}

export function isQueueStatus(status: AppointmentStatusValue): boolean {
  return status === "WAITING" || status === "IN_PROGRESS";
}
