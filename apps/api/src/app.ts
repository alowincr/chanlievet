import cors from "cors";
import express from "express";
import { corsOrigins, env, isProduction } from "./config/env";
import { logger } from "./lib/logger";
import { errorHandler, notFoundHandler } from "./middleware/errors";
import { apiLimiter } from "./middleware/rate-limit";
import { apiRouter } from "./routes";
import type { HealthDTO } from "./types/dto";

export const app = express();

app.disable("x-powered-by");

// En producción la API vive detrás de un proxy (Render, Nginx, etc.).
// Confiar en el primer salto permite limitar por IP real y no por la del proxy.
if (isProduction) {
  app.set("trust proxy", 1);
}

// Cabeceras defensivas básicas, sin dependencias adicionales.
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  next();
});

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

if (!isProduction) {
  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on("finish", () => {
      logger.debug(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - startedAt}ms)`);
    });
    next();
  });
}

/** El healthcheck queda fuera del límite para no romper Docker/Render. */
app.get("/api/health", (_req, res) => {
  const payload: HealthDTO = {
    ok: true,
    service: "chanlievet-api",
    environment: env.NODE_ENV,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };

  res.json(payload);
});

app.use("/api", apiLimiter);
app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
