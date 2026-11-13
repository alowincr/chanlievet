import { randomInt } from "node:crypto";
import { env } from "../../config/env";
import type { Prisma } from "../../generated/prisma/client";
import type { AuthUser } from "../../lib/jwt";
import { prisma } from "../../lib/prisma";
import {
  buildScheduleSlots,
  formatMinuteOfDay,
  isBookableStart,
  isClinicOpenAt,
  minuteOfDay,
} from "../../lib/schedule";
import {
  CHECK_IN_LEAD_MINUTES,
  isSameLimaDay,
  limaDateKey,
  limaDateLabel,
  limaDayRange,
  limaDayRangeFromKey,
  limaTimeLabel,
} from "../../lib/time";
import { HttpError } from "../../middleware/errors";
import { emitAppointmentUpdate } from "../../realtime/socket";
import type {
  AppointmentDTO,
  AppointmentStatusValue,
  AvailabilityDTO,
} from "../../types/dto";
import {
  appointmentInclude,
  toAppointmentDTO,
  type AppointmentWithRelations,
} from "./appointment.mapper";
import {
  buildCapacitySlots,
  countOverlapping,
  slotFullMessage,
  type CapacityBooking,
} from "./appointment.capacity";
import type {
  AppointmentActionAuthInput,
  CreateAppointmentInput,
  CreateEmergencyInput,
  ListAppointmentsQuery,
  RescheduleAppointmentInput,
  UpdateAppointmentStatusInput,
} from "./appointment.schema";
import { broadcastQueue, getQueuePositionFor } from "../queue/queue.service";

// Sin caracteres ambiguos (0/O, 1/I/L) para dictar el código por teléfono.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

/**
 * Flujo de estados permitido:
 * PENDING -> CONFIRMED -> WAITING -> IN_PROGRESS -> COMPLETED
 * (con cancelaciones / no-show en los estados previos a la atención).
 */
const ALLOWED_TRANSITIONS: Record<AppointmentStatusValue, AppointmentStatusValue[]> = {
  PENDING: ["CONFIRMED", "WAITING", "CANCELLED"],
  CONFIRMED: ["WAITING", "CANCELLED", "NO_SHOW"],
  WAITING: ["IN_PROGRESS", "CANCELLED", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  // El administrador puede recuperar una cita cancelada o marcada como
  // inasistencia por error, sin perder el historial.
  CANCELLED: ["CONFIRMED"],
  NO_SHOW: ["CONFIRMED"],
};

const STATUS_LABELS: Record<AppointmentStatusValue, string> = {
  PENDING: "Registrada",
  CONFIRMED: "Confirmada",
  WAITING: "En espera",
  IN_PROGRESS: "En atención",
  COMPLETED: "Finalizada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

/** Estados que ocupan agenda y bloquean la misma franja. */
const ACTIVE_STATUSES: AppointmentStatusValue[] = [
  "PENDING",
  "CONFIRMED",
  "WAITING",
  "IN_PROGRESS",
];

type AppointmentReader = Pick<Prisma.TransactionClient, "appointment">;

/** Citas activas del día con la duración real de su servicio. */
async function bookingsForDay(
  db: AppointmentReader,
  dateKey: string,
  excludeId?: number,
): Promise<CapacityBooking[]> {
  const { start, end } = limaDayRangeFromKey(dateKey);

  const rows = await db.appointment.findMany({
    where: {
      scheduledAt: { gte: start, lt: end },
      status: { in: ACTIVE_STATUSES },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: {
      scheduledAt: true,
      service: { select: { durationMin: true } },
    },
  });

  return rows.map((row) => ({
    scheduledAt: row.scheduledAt,
    durationMin: row.service.durationMin,
  }));
}

/**
 * Valida que la cita empiece en una franja válida y que quede cupo.
 * Debe ejecutarse dentro de la transacción que tomó el advisory lock del día.
 */
async function assertSlotAvailable(
  db: AppointmentReader,
  dateKey: string,
  scheduledAt: Date,
  durationMin: number,
  excludeId?: number,
): Promise<void> {
  if (!isBookableStart(scheduledAt, durationMin)) {
    throw new HttpError(
      400,
      "Elige una hora dentro del horario de atención y que alcance a terminar antes del cierre.",
    );
  }

  const bookings = await bookingsForDay(db, dateKey, excludeId);
  const used = countOverlapping(
    bookings,
    dateKey,
    minuteOfDay(dateKey, scheduledAt),
    durationMin,
  );

  if (used >= env.SLOT_CAPACITY) {
    throw new HttpError(
      409,
      slotFullMessage(limaTimeLabel(scheduledAt), durationMin),
    );
  }
}

/** Verifica la identidad del dueño por celular o DNI. */
function assertOwnerMatches(
  appointment: AppointmentWithRelations,
  input: AppointmentActionAuthInput,
): void {
  const phoneMatches = Boolean(
    input.phone && appointment.owner.phone === input.phone,
  );
  const documentMatches = Boolean(
    input.documentId && appointment.owner.documentId === input.documentId,
  );

  if (!phoneMatches && !documentMatches) {
    throw new HttpError(
      403,
      "Los datos no coinciden con la reserva. Revisa el celular o el DNI usado al agendar.",
    );
  }
}

async function generateUniqueCode(tx: Prisma.TransactionClient): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    let suffix = "";
    for (let index = 0; index < CODE_LENGTH; index += 1) {
      suffix += CODE_ALPHABET.charAt(randomInt(CODE_ALPHABET.length));
    }

    const code = `CV-${suffix}`;
    const existing = await tx.appointment.findUnique({
      where: { code },
      select: { id: true },
    });

    if (!existing) return code;
  }

  throw new HttpError(
    500,
    "No se pudo generar un código de seguimiento único. Intenta nuevamente.",
  );
}

function appointmentUpdateEvent(appointment: AppointmentWithRelations, position: number | null) {
  return {
    code: appointment.code,
    status: appointment.status,
    priority: appointment.priority,
    queuePosition: position,
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Creación (pública, sin registro)
// ---------------------------------------------------------------------------

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<AppointmentDTO> {
  const service = await prisma.service.findFirst({
    where: { id: input.serviceId, active: true },
    select: { id: true, durationMin: true },
  });

  if (!service) {
    throw new HttpError(404, "El servicio seleccionado no está disponible");
  }

  const dateKey = limaDateKey(input.scheduledAt);

  const appointment = await prisma.$transaction(async (tx) => {
    // Serializa todas las reservas del mismo día. Así dos clientes distintos
    // no pueden ver el mismo cupo libre y confirmar a la vez. El lock se
    // libera automáticamente al terminar la transacción.
    const lockKey = `appointment-day:${dateKey}`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    await assertSlotAvailable(
      tx,
      dateKey,
      input.scheduledAt,
      service.durationMin,
    );

    // El dueño se identifica por teléfono: si ya existe, reutilizamos su ficha.
    const owner = await tx.owner.upsert({
      where: { phone: input.owner.phone },
      update: {
        fullName: input.owner.fullName,
        ...(input.owner.email ? { email: input.owner.email } : {}),
        ...(input.owner.documentId ? { documentId: input.owner.documentId } : {}),
      },
      create: {
        fullName: input.owner.fullName,
        phone: input.owner.phone,
        email: input.owner.email ?? null,
        documentId: input.owner.documentId ?? null,
      },
    });

    // Evita duplicados exactos: mismo celular, mismo día y misma hora con una
    // cita todavía activa. Así un refresco o un doble clic no reserva dos veces.
    const duplicate = await tx.appointment.findFirst({
      where: {
        ownerId: owner.id,
        scheduledAt: input.scheduledAt,
        status: { in: ["PENDING", "CONFIRMED", "WAITING", "IN_PROGRESS"] },
      },
      select: { code: true },
    });

    if (duplicate) {
      throw new HttpError(
        409,
        `Ya existe una cita activa para este celular en ese mismo horario (código ${duplicate.code}). Revisa tu seguimiento para no duplicar la reserva.`,
      );
    }

    // Reutilizamos la mascota si el dueño ya la tiene registrada con ese nombre.
    const existingPet = await tx.pet.findFirst({
      where: {
        ownerId: owner.id,
        name: { equals: input.pet.name, mode: "insensitive" },
      },
    });

    const pet = existingPet
      ? await tx.pet.update({
          where: { id: existingPet.id },
          data: {
            species: input.pet.species,
            breed: input.pet.breed ?? existingPet.breed,
            birthDate: input.pet.birthDate ?? existingPet.birthDate,
            notes: input.pet.notes ?? existingPet.notes,
          },
        })
      : await tx.pet.create({
          data: {
            ownerId: owner.id,
            name: input.pet.name,
            species: input.pet.species,
            breed: input.pet.breed ?? null,
            birthDate: input.pet.birthDate ?? null,
            notes: input.pet.notes ?? null,
          },
        });

    const code = await generateUniqueCode(tx);

    return tx.appointment.create({
      data: {
        code,
        ownerId: owner.id,
        petId: pet.id,
        serviceId: service.id,
        scheduledAt: input.scheduledAt,
        reason: input.reason ?? null,
        notes: input.notes ?? null,
        status: "PENDING",
      },
      include: appointmentInclude,
    });
  });

  return toAppointmentDTO(appointment);
}

// ---------------------------------------------------------------------------
// Seguimiento público por código
// ---------------------------------------------------------------------------

export async function getAppointmentByCode(code: string): Promise<AppointmentDTO> {
  const appointment = await prisma.appointment.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: appointmentInclude,
  });

  if (!appointment) {
    throw new HttpError(404, "No encontramos una cita con ese código de seguimiento");
  }

  const position = await getQueuePositionFor(appointment);
  return toAppointmentDTO(appointment, position);
}

/** Check-in del cliente: lo coloca en la sala de espera virtual. */
export async function checkInAppointment(code: string): Promise<AppointmentDTO> {
  const normalizedCode = code.trim().toUpperCase();

  const appointment = await prisma.appointment.findUnique({
    where: { code: normalizedCode },
  });

  if (!appointment) {
    throw new HttpError(404, "No encontramos una cita con ese código de seguimiento");
  }

  if (appointment.status === "WAITING") {
    return getAppointmentByCode(normalizedCode);
  }

  if (appointment.status !== "PENDING" && appointment.status !== "CONFIRMED") {
    throw new HttpError(
      409,
      `La cita está "${STATUS_LABELS[appointment.status]}" y no puede registrarse en la sala de espera`,
    );
  }

  const now = new Date();

  if (!isSameLimaDay(appointment.scheduledAt, now)) {
    throw new HttpError(
      409,
      `Esta cita es para el ${limaDateLabel(appointment.scheduledAt)}. Solo puedes registrar tu llegada el día de la cita.`,
    );
  }

  const opensAt = new Date(
    appointment.scheduledAt.getTime() - CHECK_IN_LEAD_MINUTES * 60_000,
  );

  if (now < opensAt) {
    throw new HttpError(
      409,
      `Todavía es muy temprano para registrar tu llegada. Podrás hacerlo desde las ${limaTimeLabel(opensAt)} del día de la cita.`,
    );
  }

  const today = limaDayRange(now);

  if (now >= today.end) {
    throw new HttpError(
      409,
      "El horario de atención de hoy ya terminó. Escríbenos para reprogramar tu cita.",
    );
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      status: "WAITING",
      checkedInAt: appointment.checkedInAt ?? new Date(),
    },
    include: appointmentInclude,
  });

  const position = await getQueuePositionFor(updated);
  await broadcastQueue();
  emitAppointmentUpdate(appointmentUpdateEvent(updated, position));

  return toAppointmentDTO(updated, position);
}

// ---------------------------------------------------------------------------
// Panel de staff
// ---------------------------------------------------------------------------

export async function listAppointments(
  query: ListAppointmentsQuery,
): Promise<AppointmentDTO[]> {
  const where: Prisma.AppointmentWhereInput = {};

  if (query.status) {
    where.status = query.status;
  }

  if (query.date) {
    const { start, end } = limaDayRangeFromKey(query.date);
    where.scheduledAt = { gte: start, lt: end };
  }

  if (query.q) {
    const search = query.q;
    where.OR = [
      { code: { contains: search.toUpperCase(), mode: "insensitive" } },
      { owner: { fullName: { contains: search, mode: "insensitive" } } },
      { owner: { phone: { contains: search } } },
      { pet: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: appointmentInclude,
    orderBy: query.date ? { scheduledAt: "asc" } : { scheduledAt: "desc" },
    take: query.limit,
  });

  return appointments.map((appointment) => toAppointmentDTO(appointment));
}

export async function updateAppointmentStatus(
  id: number,
  input: UpdateAppointmentStatusInput,
  actor: AuthUser,
): Promise<AppointmentDTO> {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: appointmentInclude,
  });

  if (!appointment) {
    throw new HttpError(404, "Cita no encontrada");
  }

  if (appointment.status === input.status) {
    const position = await getQueuePositionFor(appointment);
    return toAppointmentDTO(appointment, position);
  }

  const allowed = ALLOWED_TRANSITIONS[appointment.status];

  if (!allowed.includes(input.status)) {
    throw new HttpError(
      409,
      `No se puede pasar de "${STATUS_LABELS[appointment.status]}" a "${STATUS_LABELS[input.status]}"`,
    );
  }

  const data: Prisma.AppointmentUpdateInput = {
    status: input.status,
  };

  if (input.status === "WAITING" && !appointment.checkedInAt) {
    data.checkedInAt = new Date();
  }

  if (input.status === "IN_PROGRESS") {
    data.startedAt = new Date();
    // Si es un veterinario quien inicia la atención, queda asignado a él.
    if (actor.role === "VETERINARIAN" && !appointment.assignedVetId) {
      data.assignedVet = { connect: { id: actor.id } };
    }
  }

  if (input.status === "COMPLETED") {
    data.finishedAt = new Date();
  }

  if (input.status === "CANCELLED") {
    data.cancelledAt = new Date();
  }

  if (
    input.status === "CONFIRMED" &&
    (appointment.status === "CANCELLED" || appointment.status === "NO_SHOW")
  ) {
    data.cancelledAt = null;
    data.checkedInAt = null;
    data.startedAt = null;
    data.finishedAt = null;
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data,
    include: appointmentInclude,
  });

  const position = await getQueuePositionFor(updated);
  await broadcastQueue();
  emitAppointmentUpdate(appointmentUpdateEvent(updated, position));

  return toAppointmentDTO(updated, position);
}

/**
 * Disponibilidad de un día de Lima para un servicio concreto.
 *
 * Devuelve las franjas que alcanzan a terminar antes del cierre, cuáles ya
 * están llenas y cuántas citas se solapan con cada una. La duración real del
 * servicio evita vender dos veces el mismo tramo de agenda.
 */
export async function getAvailability(
  dateKey: string,
  serviceId?: number,
): Promise<AvailabilityDTO> {
  let durationMin = 30;

  if (serviceId) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, active: true },
      select: { durationMin: true },
    });

    if (!service) {
      throw new HttpError(404, "El servicio seleccionado no está disponible");
    }

    durationMin = service.durationMin;
  }

  const [bookings, scheduleSlots] = await Promise.all([
    bookingsForDay(prisma, dateKey),
    Promise.resolve(buildScheduleSlots(dateKey, durationMin)),
  ]);

  const capacity = env.SLOT_CAPACITY;
  const computed = buildCapacitySlots(
    scheduleSlots,
    bookings,
    dateKey,
    durationMin,
    capacity,
  );

  return {
    date: dateKey,
    capacity,
    durationMin,
    serviceId: serviceId ?? null,
    slots: computed.filter((slot) => !slot.available).map((slot) => slot.time),
    availableSlots: computed
      .filter((slot) => slot.available)
      .map((slot) => slot.time),
    scheduleSlots,
  };
}

// ---------------------------------------------------------------------------
// Acciones públicas sobre una cita: cancelar y reprogramar
// ---------------------------------------------------------------------------

async function findAppointmentForOwner(code: string): Promise<AppointmentWithRelations> {
  const appointment = await prisma.appointment.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: appointmentInclude,
  });

  if (!appointment) {
    throw new HttpError(404, "No encontramos una cita con ese código de seguimiento");
  }

  return appointment;
}

/** El cliente cancela su propia cita desde el seguimiento. */
export async function cancelAppointmentByCode(
  code: string,
  input: AppointmentActionAuthInput,
): Promise<AppointmentDTO> {
  const appointment = await findAppointmentForOwner(code);
  assertOwnerMatches(appointment, input);

  if (appointment.status === "CANCELLED") {
    const position = await getQueuePositionFor(appointment);
    return toAppointmentDTO(appointment, position);
  }

  if (
    appointment.status !== "PENDING" &&
    appointment.status !== "CONFIRMED" &&
    appointment.status !== "WAITING"
  ) {
    throw new HttpError(
      409,
      `La cita está "${STATUS_LABELS[appointment.status]}" y ya no se puede cancelar desde aquí. Escríbenos por WhatsApp.`,
    );
  }

  const cancelled = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
    include: appointmentInclude,
  });

  await broadcastQueue();
  emitAppointmentUpdate(appointmentUpdateEvent(cancelled, null));

  return toAppointmentDTO(cancelled, null);
}

/**
 * El cliente mueve su cita a otra fecha/hora conservando servicio y mascota.
 * La cita vuelve a "Registrada" para que recepción la confirme de nuevo.
 */
export async function rescheduleAppointmentByCode(
  code: string,
  input: RescheduleAppointmentInput,
): Promise<AppointmentDTO> {
  const appointment = await findAppointmentForOwner(code);
  assertOwnerMatches(appointment, input);

  if (
    appointment.status === "IN_PROGRESS" ||
    appointment.status === "COMPLETED"
  ) {
    throw new HttpError(
      409,
      `La cita está "${STATUS_LABELS[appointment.status]}" y ya no se puede reprogramar. Escríbenos por WhatsApp.`,
    );
  }

  const dateKey = limaDateKey(input.scheduledAt);
  const durationMin = appointment.service.durationMin;

  const updated = await prisma.$transaction(async (tx) => {
    // Mismo advisory lock que usa la reserva: evita que dos reprogramaciones
    // simultáneas ocupen la última franja del día.
    const lockKey = `appointment-day:${dateKey}`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    await assertSlotAvailable(
      tx,
      dateKey,
      input.scheduledAt,
      durationMin,
      appointment.id,
    );

    return tx.appointment.update({
      where: { id: appointment.id },
      data: {
        scheduledAt: input.scheduledAt,
        status: "PENDING",
        checkedInAt: null,
        startedAt: null,
        finishedAt: null,
        cancelledAt: null,
      },
      include: appointmentInclude,
    });
  });

  await broadcastQueue();
  emitAppointmentUpdate(appointmentUpdateEvent(updated, null));

  return toAppointmentDTO(updated, null);
}

// ---------------------------------------------------------------------------
// Emergencias con triaje
// ---------------------------------------------------------------------------

/**
 * Registra una emergencia y la coloca directamente en la cola prioritaria.
 *
 * No pasa por confirmación ni por el cupo normal de la agenda: una urgencia
 * no puede esperar a que recepción la apruebe. Solo se acepta dentro del
 * horario de atención; fuera de horario la web muestra los teléfonos.
 */
export async function createEmergencyAppointment(
  input: CreateEmergencyInput,
): Promise<AppointmentDTO> {
  const now = new Date();

  if (!isClinicOpenAt(now)) {
    throw new HttpError(
      409,
      "La clínica está cerrada en este momento. Llámanos al +51 987 654 321 para orientarte.",
    );
  }

  const service = await prisma.service.findFirst({
    where: {
      active: true,
      OR: [
        { slug: "emergencia" },
        { name: { contains: "Emergencia", mode: "insensitive" } },
      ],
    },
    orderBy: { id: "asc" },
    select: { id: true },
  });

  if (!service) {
    throw new HttpError(
      503,
      "El servicio de emergencia no está configurado. Llámanos al +51 987 654 321.",
    );
  }

  const appointment = await prisma.$transaction(async (tx) => {
    const owner = await tx.owner.upsert({
      where: { phone: input.owner.phone },
      update: {
        fullName: input.owner.fullName,
        documentId: input.owner.documentId,
      },
      create: {
        fullName: input.owner.fullName,
        phone: input.owner.phone,
        documentId: input.owner.documentId,
      },
    });

    const existingPet = await tx.pet.findFirst({
      where: {
        ownerId: owner.id,
        name: { equals: input.pet.name, mode: "insensitive" },
      },
    });

    const pet = existingPet
      ? await tx.pet.update({
          where: { id: existingPet.id },
          data: {
            species: input.pet.species,
            breed: input.pet.breed ?? existingPet.breed,
          },
        })
      : await tx.pet.create({
          data: {
            ownerId: owner.id,
            name: input.pet.name,
            species: input.pet.species,
            breed: input.pet.breed ?? null,
          },
        });

    const code = await generateUniqueCode(tx);

    return tx.appointment.create({
      data: {
        code,
        ownerId: owner.id,
        petId: pet.id,
        serviceId: service.id,
        scheduledAt: now,
        status: "WAITING",
        priority: "EMERGENCY",
        triageSeverity: input.severity,
        triageSymptoms: input.symptoms,
        reason: `Emergencia: ${input.symptoms.slice(0, 160)}`,
        notes: input.notes ?? null,
        checkedInAt: now,
      },
      include: appointmentInclude,
    });
  });

  const position = await getQueuePositionFor(appointment);
  await broadcastQueue();
  emitAppointmentUpdate(appointmentUpdateEvent(appointment, position));

  return toAppointmentDTO(appointment, position);
}

/**
 * Recupera las citas de un cliente que perdió su código.
 * Exige el nombre de la mascota y al menos un dato del dueño (celular o DNI)
 * para no exponer datos de terceros.
 */
export async function lookupAppointments(input: {
  phone?: string;
  documentId?: string;
  petName: string;
}): Promise<AppointmentDTO[]> {
  const ownerFilters: Prisma.OwnerWhereInput[] = [];

  if (input.phone) ownerFilters.push({ phone: input.phone });
  if (input.documentId) ownerFilters.push({ documentId: input.documentId });

  const appointments = await prisma.appointment.findMany({
    where: {
      owner: { OR: ownerFilters },
      pet: { name: { equals: input.petName, mode: "insensitive" } },
    },
    include: appointmentInclude,
    orderBy: { scheduledAt: "desc" },
    take: 8,
  });

  return Promise.all(
    appointments.map(async (appointment) =>
      toAppointmentDTO(
        appointment,
        await getQueuePositionFor(appointment),
      ),
    ),
  );
}

export async function assignVeterinarian(
  id: number,
  vetId: number | null,
): Promise<AppointmentDTO> {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true, code: true },
  });

  if (!appointment) {
    throw new HttpError(404, "Cita no encontrada");
  }

  if (vetId !== null) {
    const vet = await prisma.staffUser.findFirst({
      where: { id: vetId, role: "VETERINARIAN", active: true },
      select: { id: true },
    });

    if (!vet) {
      throw new HttpError(400, "El veterinario seleccionado no está disponible");
    }
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      assignedVet:
        vetId === null ? { disconnect: true } : { connect: { id: vetId } },
    },
    include: appointmentInclude,
  });

  const position = await getQueuePositionFor(updated);
  await broadcastQueue();
  emitAppointmentUpdate(appointmentUpdateEvent(updated, position));

  return toAppointmentDTO(updated, position);
}
