import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { env, isProduction } from "../config/env";

/**
 * En Prisma 7 el cliente requiere un driver adapter.
 * Usamos `node-postgres` a través de `@prisma/adapter-pg`.
 */
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
});

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: isProduction ? ["error"] : ["warn", "error"],
  });

// Evita crear múltiples clientes durante el hot-reload en desarrollo.
if (!isProduction) {
  globalForPrisma.prisma = prisma;
}
