import "dotenv/config";
import { z } from "zod";

/**
 * Validación centralizada de variables de entorno.
 * El proceso falla rápido si falta algo crítico.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET debe tener al menos 16 caracteres"),
  JWT_EXPIRES_IN: z.string().default("12h"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  LOW_STOCK_THRESHOLD: z.coerce.number().int().nonnegative().default(5),
  /**
   * Citas simultáneas permitidas en una misma franja de 30 minutos.
   * Con 1 (por defecto) cada horario atiende a un solo paciente a la vez,
   * considerando la duración real del servicio.
   */
  SLOT_CAPACITY: z.coerce.number().int().positive().default(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variables de entorno inválidas:");
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;

/** Orígenes permitidos para CORS y Socket.io. */
export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const isProduction = env.NODE_ENV === "production";
