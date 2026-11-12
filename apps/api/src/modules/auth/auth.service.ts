import { prisma } from "../../lib/prisma";
import { signToken } from "../../lib/jwt";
import { verifyPassword } from "../../lib/password";
import { HttpError } from "../../middleware/errors";
import type { AuthResponseDTO } from "../../types/dto";
import { toStaffDTO } from "../staff/staff.service";
import type { LoginInput } from "./auth.schema";

export async function login(input: LoginInput): Promise<AuthResponseDTO> {
  const user = await prisma.staffUser.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user || !user.active || !verifyPassword(input.password, user.passwordHash)) {
    throw new HttpError(401, "Correo o contraseña incorrectos");
  }

  const token = signToken({
    id: user.id,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
  });

  return { token, user: toStaffDTO(user) };
}
