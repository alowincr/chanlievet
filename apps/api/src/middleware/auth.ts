import type { NextFunction, Request, Response } from "express";
import type { StaffRole } from "../generated/prisma/enums";
import { verifyToken } from "../lib/jwt";
import { HttpError } from "./errors";

/** Exige un JWT válido en `Authorization: Bearer <token>`. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    throw new HttpError(401, "Token de acceso requerido");
  }

  try {
    req.user = verifyToken(header.slice("Bearer ".length).trim());
  } catch {
    throw new HttpError(401, "Sesión inválida o expirada");
  }

  next();
}

/** Restringe el acceso a uno o más roles del personal. */
export function requireRole(...roles: StaffRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new HttpError(401, "Token de acceso requerido");
    }

    if (!roles.includes(req.user.role)) {
      throw new HttpError(403, "No tienes permisos para realizar esta acción");
    }

    next();
  };
}
