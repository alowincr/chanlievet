import jwt from "jsonwebtoken";
import type { StaffRole } from "../generated/prisma/enums";
import { env } from "../config/env";

export interface AuthUser {
  id: number;
  role: StaffRole;
  fullName: string;
  email: string;
}

interface TokenPayload {
  sub: string;
  role: StaffRole;
  fullName: string;
  email: string;
}

export function signToken(user: AuthUser): string {
  const payload: TokenPayload = {
    sub: String(user.id),
    role: user.role,
    fullName: user.fullName,
    email: user.email,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): AuthUser {
  const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;

  return {
    id: Number(decoded.sub),
    role: decoded.role,
    fullName: decoded.fullName,
    email: decoded.email,
  };
}
