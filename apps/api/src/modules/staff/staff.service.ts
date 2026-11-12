import type { StaffUser } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errors";
import type { PublicVeterinarianDTO, StaffDTO } from "../../types/dto";

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
