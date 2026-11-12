import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Correo inválido")
  .max(160)
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(200);

/** Texto opcional que además puede limpiarse enviando una cadena vacía. */
const nullableText = (max: number) =>
  z
    .preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? null : value,
      z.string().trim().max(max).nullable(),
    )
    .optional();

export const listStaffQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  role: z.enum(["ADMIN", "VETERINARIAN"]).optional(),
});

export type ListStaffQuery = z.infer<typeof listStaffQuerySchema>;

export const createStaffSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Ingresa el nombre completo")
    .max(120),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["ADMIN", "VETERINARIAN"]).default("VETERINARIAN"),
  specialty: nullableText(120),
  bio: nullableText(500),
  active: z.boolean().default(true),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffSchema = z.object({
  fullName: z.string().trim().min(3, "Ingresa el nombre completo").max(120).optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  role: z.enum(["ADMIN", "VETERINARIAN"]).optional(),
  specialty: nullableText(120),
  bio: nullableText(500),
  active: z.boolean().optional(),
});

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
