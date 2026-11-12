import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

/**
 * Hash de contraseñas con scrypt (incluido en Node.js, sin dependencias nativas).
 * Formato almacenado: `scrypt:<saltHex>:<hashHex>`
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algorithm, salt, hash] = stored.split(":");

  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const storedHash = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, storedHash.length);

  return storedHash.length === candidate.length && timingSafeEqual(storedHash, candidate);
}
