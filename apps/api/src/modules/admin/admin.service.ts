import type { Prisma } from "../../generated/prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { limaDayRange } from "../../lib/time";
import type {
  ActivityEventDTO,
  AdminStatsDTO,
  AppointmentStatusValue,
  PatientOwnerDTO,
} from "../../types/dto";
import {
  appointmentInclude,
  toAppointmentDTO,
} from "../appointments/appointment.mapper";
import { getQueueSnapshot } from "../queue/queue.service";

interface ActivitySource {
  id: number;
  code: string;
  status: AppointmentStatusValue;
  createdAt: Date;
  checkedInAt: Date | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  updatedAt: Date;
  pet: { name: string };
  owner: { fullName: string };
  service: { name: string };
  assignedVet: { fullName: string } | null;
}

function buildActivity(appointments: ActivitySource[]): ActivityEventDTO[] {
  const events: Array<Omit<ActivityEventDTO, "id"> & { id: string }> = [];

  for (const appointment of appointments) {
    const base = {
      appointmentId: appointment.id,
      code: appointment.code,
      petName: appointment.pet.name,
      ownerName: appointment.owner.fullName,
      serviceName: appointment.service.name,
      vetName: appointment.assignedVet?.fullName ?? null,
    };

    const push = (
      type: string,
      at: Date | null,
      status: AppointmentStatusValue,
      label: string,
    ) => {
      if (!at) return;
      events.push({
        ...base,
        id: `${appointment.id}-${type}`,
        status,
        at: at.toISOString(),
        label,
      });
    };

    push("created", appointment.createdAt, "PENDING", "Registró una cita");
    push("checked-in", appointment.checkedInAt, "WAITING", "Registró su llegada");
    push("started", appointment.startedAt, "IN_PROGRESS", "Inició la atención");
    push("finished", appointment.finishedAt, "COMPLETED", "Finalizó la atención");

    if (appointment.status === "CANCELLED") {
      push("cancelled", appointment.updatedAt, "CANCELLED", "Canceló la cita");
    }

    if (appointment.status === "NO_SHOW") {
      push("no-show", appointment.updatedAt, "NO_SHOW", "Marcada como no asistió");
    }
  }

  return events
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 12);
}

export async function getAdminStats(): Promise<AdminStatsDTO> {
  const now = new Date();
  const { start: startOfDay, end: endOfDay } = limaDayRange(now);
  const today = { gte: startOfDay, lt: endOfDay };

  const [
    appointmentsToday,
    pending,
    waiting,
    inProgress,
    emergenciesToday,
    completedToday,
    cancelledToday,
    lowStockProducts,
    lowStockCount,
    upcoming,
    owners,
    pets,
    products,
    appointments,
    liveQueue,
    activityAppointments,
  ] = await Promise.all([
    prisma.appointment.count({
      where: {
        scheduledAt: today,
        status: { not: "CANCELLED" },
      },
    }),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.appointment.count({ where: { status: "WAITING", scheduledAt: today } }),
    prisma.appointment.count({ where: { status: "IN_PROGRESS", scheduledAt: today } }),
    prisma.appointment.count({
      where: {
        priority: "EMERGENCY",
        scheduledAt: today,
        status: { not: "CANCELLED" },
      },
    }),
    prisma.appointment.count({
      where: {
        status: "COMPLETED",
        finishedAt: today,
      },
    }),
    prisma.appointment.count({
      where: {
        status: "CANCELLED",
        scheduledAt: today,
      },
    }),
    prisma.product.findMany({
      where: { active: true, stock: { lte: env.LOW_STOCK_THRESHOLD } },
      orderBy: { stock: "asc" },
      take: 6,
      select: {
        id: true,
        name: true,
        stock: true,
        category: { select: { name: true } },
      },
    }),
    prisma.product.count({
      where: { active: true, stock: { lte: env.LOW_STOCK_THRESHOLD } },
    }),
    prisma.appointment.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED", "WAITING"] },
        scheduledAt: { gte: now },
      },
      include: appointmentInclude,
      orderBy: { scheduledAt: "asc" },
      take: 6,
    }),
    prisma.owner.count(),
    prisma.pet.count(),
    prisma.product.count(),
    prisma.appointment.count(),
    getQueueSnapshot(now, "staff"),
    prisma.appointment.findMany({
      where: {
        OR: [{ scheduledAt: today }, { updatedAt: { gte: startOfDay } }],
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        code: true,
        status: true,
        createdAt: true,
        checkedInAt: true,
        startedAt: true,
        finishedAt: true,
        updatedAt: true,
        pet: { select: { name: true } },
        owner: { select: { fullName: true } },
        service: { select: { name: true } },
        assignedVet: { select: { fullName: true } },
      },
    }),
  ]);

  return {
    appointmentsToday,
    pending,
    waiting,
    inProgress,
    emergenciesToday,
    completedToday,
    cancelledToday,
    lowStockCount,
    totals: { owners, pets, products, appointments },
    upcoming: upcoming.map((appointment) => toAppointmentDTO(appointment)),
    liveQueue,
    activity: buildActivity(activityAppointments),
    lowStockProducts: lowStockProducts.map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      category: product.category.name,
    })),
  };
}

export interface ListPatientsQuery {
  q?: string;
  limit: number;
}

/** Directorio de dueños y mascotas para el panel administrativo. */
export async function listPatients(
  query: ListPatientsQuery,
): Promise<{ patients: PatientOwnerDTO[]; total: number }> {
  const where: Prisma.OwnerWhereInput = {};

  if (query.q) {
    const search = query.q;
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
      { documentId: { contains: search } },
      { pets: { some: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const [owners, total] = await Promise.all([
    prisma.owner.findMany({
      where,
      orderBy: { fullName: "asc" },
      take: query.limit,
      include: {
        _count: { select: { appointments: true } },
        appointments: {
          orderBy: { scheduledAt: "desc" },
          take: 1,
          select: { scheduledAt: true, status: true },
        },
        pets: {
          orderBy: { name: "asc" },
          include: {
            _count: { select: { appointments: true } },
            appointments: {
              orderBy: { scheduledAt: "desc" },
              take: 1,
              select: { scheduledAt: true },
            },
          },
        },
      },
    }),
    prisma.owner.count({ where }),
  ]);

  return {
    total,
    patients: owners.map((owner) => ({
      id: owner.id,
      fullName: owner.fullName,
      phone: owner.phone,
      email: owner.email,
      documentId: owner.documentId,
      createdAt: owner.createdAt.toISOString(),
      appointmentsCount: owner._count.appointments,
      lastVisitAt: owner.appointments[0]?.scheduledAt.toISOString() ?? null,
      pets: owner.pets.map((pet) => ({
        id: pet.id,
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        birthDate: pet.birthDate?.toISOString() ?? null,
        photoUrl: pet.photoUrl,
        notes: pet.notes,
        appointmentsCount: pet._count.appointments,
        lastVisitAt: pet.appointments[0]?.scheduledAt.toISOString() ?? null,
      })),
    })),
  };
}
