import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";

/**
 * Limitadores para los endpoints públicos más expuestos a abuso.
 *
 * Render y otros proxies añaden `X-Forwarded-For`; `app.ts` activa
 * `trust proxy` en producción para que el límite se aplique por IP real.
 */
function createLimiter(options: {
  windowMs: number;
  limit: number;
  message: string;
}): RequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: options.message });
    },
  });
}

/** Techo general para toda la API: evita barridos masivos. */
export const apiLimiter = createLimiter({
  windowMs: 60 * 1000,
  limit: 600,
  message: "Demasiadas peticiones. Espera un momento e intenta de nuevo.",
});

/** Login: frena la fuerza bruta contra las cuentas del personal. */
export const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message:
    "Demasiados intentos de inicio de sesión. Espera 15 minutos e intenta de nuevo.",
});

/** Reservas públicas: evita crear citas en masa. */
export const bookingLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message:
    "Demasiadas reservas desde esta conexión. Espera una hora o llámanos.",
});

/** Triaje de emergencia: es prioritario, pero también limitado. */
export const emergencyLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message:
    "Demasiados registros de emergencia desde esta conexión. Si es urgente, llámanos.",
});

/** Búsqueda y seguimiento por código. */
export const lookupLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  message: "Demasiadas consultas de seguimiento. Espera unos minutos.",
});

/** Check-in, cancelación y reprogramación desde el seguimiento público. */
export const trackActionLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  message: "Demasiadas acciones sobre la cita. Espera unos minutos.",
});
