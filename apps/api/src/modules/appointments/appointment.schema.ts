import { z } from "zod";

export const APPOINTMENT_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "WAITING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

const phoneSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .pipe(
    z
      .string()
      .regex(/^9\d{8}$/, "Ingresa un celular válido de 9 dígitos (Perú)"),
  );

export const createAppointmentSchema = z
  .object({
    owner: z.object({
      fullName: z
        .string()
        .trim()
        .min(3, "Ingresa el nombre completo del dueño")
        .max(120),
      phone: phoneSchema,
      email: z.preprocess(
        (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
        z.string().trim().email("Correo inválido").max(160).optional(),
      ),
      documentId: optionalText(20),
    }),
    pet: z.object({
      name: z.string().trim().min(1, "Ingresa el nombre de la mascota").max(80),
      species: z.enum(["DOG", "CAT", "OTHER"]),
      breed: optionalText(80),
      birthDate: z.preprocess(
        (value) => (value === "" || value === null ? undefined : value),
        z.coerce.date().optional(),
      ),
      notes: optionalText(500),
    }),
    serviceId: z.coerce.number().int().positive("Selecciona un servicio"),
    scheduledAt: z.coerce.date(),
    reason: optionalText(500),
    notes: optionalText(500),
  })
  .refine((data) => data.scheduledAt.getTime() >= Date.now() - 5 * 60 * 1000, {
    path: ["scheduledAt"],
    message: "La fecha y hora de la cita debe ser futura",
  });

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
});

export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;

export const assignVeterinarianSchema = z.object({
  vetId: z.coerce.number().int().positive().nullable(),
});

export type AssignVeterinarianInput = z.infer<typeof assignVeterinarianSchema>;

export const listAppointmentsQuerySchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha esperado: YYYY-MM-DD")
    .optional(),
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;

/** Búsqueda pública de citas cuando el cliente perdió su código. */
export const lookupAppointmentsSchema = z.object({
  phone: phoneSchema,
  petName: z.string().trim().min(1, "Ingresa el nombre de tu mascota").max(80),
});

export type LookupAppointmentsInput = z.infer<typeof lookupAppointmentsSchema>;

/** Disponibilidad pública de una fecha (`YYYY-MM-DD` en hora de Lima). */
export const availabilityQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha esperado: YYYY-MM-DD"),
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
