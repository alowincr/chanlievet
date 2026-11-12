import type { Prisma, StaffUser } from "../../generated/prisma/client";
import { hashPassword } from "../../lib/password";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errors";
import type {
  AdminStaffDTO,
  PublicVeterinarianDTO,
  StaffDTO,
} from "../../types/dto";
import type {
  CreateStaffInput,
  ListStaffQuery,
  UpdateStaffInput,
} from "./staff.schema";

type StaffWithCount = StaffUser & { _count: { appointments: number } };

const staffInclude = {
  _count: { select: { appointments: true } },
} satisfies Prisma.StaffUserInclude;

function toAdminStaffDTO(user: StaffWithCount): AdminStaffDTO {
  return {
    ...toStaffDTO(user),
    appointmentsCount: user._count.appointments,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toStaffDTO(user: StaffUser): StaffDTO {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    active: user.active,
    specialty: user.specialty,
    bio: user.bio,
  };
}

/** Datos vigentes del usuario autenticado (se consultan en cada /auth/me). */
export async function getAuthenticatedUser(id: number): Promise<StaffDTO> {
  const user = await prisma.staffUser.findUnique({ where: { id } });

  if (!user || !user.active) {
    throw new HttpError(401, "La sesión ya no es válida");
  }

  return toStaffDTO(user);
}

/** Personal veterinario activo (para asignaciones y selector del panel). */
export async function listVeterinarians(): Promise<StaffDTO[]> {
  const vets = await prisma.staffUser.findMany({
    where: { role: "VETERINARIAN", active: true },
    orderBy: { fullName: "asc" },
  });

  return vets.map(toStaffDTO);
}

/**
 * Equipo visible en la web pública. No expone correos ni datos de acceso:
 * solo nombre, foto, especialidad y presentación.
 */
export async function listPublicVeterinarians(): Promise<PublicVeterinarianDTO[]> {
  const vets = await prisma.staffUser.findMany({
    where: { role: "VETERINARIAN", active: true },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      specialty: true,
      bio: true,
    },
  });

  return vets;
}

// ---------------------------------------------------------------------------
// Gestión de usuarios (solo administración)
// ---------------------------------------------------------------------------

export async function listStaff(
  query: ListStaffQuery,
): Promise<{ staff: AdminStaffDTO[]; total: number }> {
  const where: Prisma.StaffUserWhereInput = {};

  if (query.role) {
    where.role = query.role;
  }

  if (query.q) {
    where.OR = [
      { fullName: { contains: query.q, mode: "insensitive" } },
      { email: { contains: query.q, mode: "insensitive" } },
      { specialty: { contains: query.q, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.staffUser.findMany({
      where,
      orderBy: [{ active: "desc" }, { fullName: "asc" }],
      include: staffInclude,
      take: 100,
    }),
    prisma.staffUser.count({ where }),
  ]);

  return { staff: users.map(toAdminStaffDTO), total };
}

async function assertEmailAvailable(email: string, exceptId?: number): Promise<void> {
  const existing = await prisma.staffUser.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new HttpError(409, "Ya existe un usuario con ese correo");
  }
}

export async function createStaff(input: CreateStaffInput): Promise<AdminStaffDTO> {
  await assertEmailAvailable(input.email);

  const user = await prisma.staffUser.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      passwordHash: hashPassword(input.password),
      role: input.role,
      specialty: input.specialty ?? null,
      bio: input.bio ?? null,
      active: input.active,
    },
    include: staffInclude,
  });

  return toAdminStaffDTO(user);
}

export async function updateStaff(
  id: number,
  input: UpdateStaffInput,
  actorId: number,
): Promise<AdminStaffDTO> {
  const existing = await prisma.staffUser.findUnique({ where: { id } });

  if (!existing) {
    throw new HttpError(404, "Usuario no encontrado");
  }

  if (input.email !== undefined) {
    await assertEmailAvailable(input.email, id);
  }

  const nextRole = input.role ?? existing.role;
  const nextActive = input.active ?? existing.active;

  if (existing.id === actorId) {
    if (nextRole !== "ADMIN") {
      throw new HttpError(
        409,
        "No puedes quitarte el rol de administrador a tu propia cuenta",
      );
    }

    if (!nextActive) {
      throw new HttpError(409, "No puedes desactivar tu propia cuenta");
    }
  }

  // Salvaguarda: siempre debe quedar al menos un administrador activo.
  if (
    existing.role === "ADMIN" &&
    existing.active &&
    (nextRole !== "ADMIN" || !nextActive)
  ) {
    const otherAdmins = await prisma.staffUser.count({
      where: {
        role: "ADMIN",
        active: true,
        id: { not: existing.id },
      },
    });

    if (otherAdmins === 0) {
      throw new HttpError(
        409,
        "Debe quedar al menos un administrador activo. Crea o activa otro antes de cambiar este usuario.",
      );
    }
  }

  const data: Prisma.StaffUserUpdateInput = {};

  if (input.fullName !== undefined) data.fullName = input.fullName;
  if (input.email !== undefined) data.email = input.email;
  if (input.password !== undefined) data.passwordHash = hashPassword(input.password);
  if (input.role !== undefined) data.role = input.role;
  if (input.specialty !== undefined) data.specialty = input.specialty;
  if (input.bio !== undefined) data.bio = input.bio;
  if (input.active !== undefined) data.active = input.active;

  const user = await prisma.staffUser.update({
    where: { id },
    data,
    include: staffInclude,
  });

  return toAdminStaffDTO(user);
}

/**
 * Baja lógica del usuario. No se borra físicamente para conservar el historial
 * de citas que lo tuvieron asignado.
 */
export async function deactivateStaff(
  id: number,
  actorId: number,
): Promise<AdminStaffDTO> {
  return updateStaff(id, { active: false }, actorId);
}
