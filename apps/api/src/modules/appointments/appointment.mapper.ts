import type { Prisma } from "../../generated/prisma/client";
import {
  CHECK_IN_LEAD_MINUTES,
  isSameLimaDay,
  limaDayRange,
} from "../../lib/time";
import type { AppointmentDTO } from "../../types/dto";

/** Relaciones que siempre acompañan a una cita en las respuestas de la API. */
export const appointmentInclude = {
  owner: true,
  pet: true,
  service: true,
  assignedVet: {
    select: { id: true, fullName: true, avatarUrl: true },
  },
} satisfies Prisma.AppointmentInclude;

export type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude;
}>;

export function toAppointmentDTO(
  appointment: AppointmentWithRelations,
  queuePosition: number | null = null,
  now: Date = new Date(),
): AppointmentDTO {
  const openStatus =
    appointment.status === "PENDING" || appointment.status === "CONFIRMED";
  const checkInOpensAt = new Date(
    appointment.scheduledAt.getTime() - CHECK_IN_LEAD_MINUTES * 60_000,
  );
  const today = limaDayRange(now);
  const canCheckIn =
    openStatus &&
    isSameLimaDay(appointment.scheduledAt, now) &&
    now >= checkInOpensAt &&
    now < today.end;

  return {
    id: appointment.id,
    code: appointment.code,
    status: appointment.status,
    priority: appointment.priority,
    triageSeverity: appointment.triageSeverity,
    triageSymptoms: appointment.triageSymptoms,
    scheduledAt: appointment.scheduledAt.toISOString(),
    reason: appointment.reason,
    notes: appointment.notes,
    checkedInAt: appointment.checkedInAt?.toISOString() ?? null,
    startedAt: appointment.startedAt?.toISOString() ?? null,
    finishedAt: appointment.finishedAt?.toISOString() ?? null,
    cancelledAt: appointment.cancelledAt?.toISOString() ?? null,
    createdAt: appointment.createdAt.toISOString(),
    queuePosition,
    canCheckIn,
    checkInOpensAt: openStatus ? checkInOpensAt.toISOString() : null,
    owner: {
      id: appointment.owner.id,
      fullName: appointment.owner.fullName,
      phone: appointment.owner.phone,
      email: appointment.owner.email,
    },
    pet: {
      id: appointment.pet.id,
      name: appointment.pet.name,
      species: appointment.pet.species,
      breed: appointment.pet.breed,
      photoUrl: appointment.pet.photoUrl,
    },
    service: {
      id: appointment.service.id,
      name: appointment.service.name,
      slug: appointment.service.slug,
      description: appointment.service.description,
      price: appointment.service.price.toNumber(),
      durationMin: appointment.service.durationMin,
    },
    assignedVet: appointment.assignedVet
      ? {
          id: appointment.assignedVet.id,
          fullName: appointment.assignedVet.fullName,
          avatarUrl: appointment.assignedVet.avatarUrl,
        }
      : null,
  };
}
