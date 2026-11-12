import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Correo inválido").max(160),
  password: z.string().min(1, "Ingresa tu contraseña").max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
