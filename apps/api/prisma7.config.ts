import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Configuración de Prisma ORM 7.
 *
 * En Prisma 7 la URL de conexión ya no vive en `schema.prisma`: el CLI la lee
 * desde este archivo y el cliente la recibe a través del driver adapter.
 */
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://chanlievet:chanlievet@localhost:5432/chanlievet?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
