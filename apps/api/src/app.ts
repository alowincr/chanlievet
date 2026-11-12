import cors from "cors";
import express from "express";
import { corsOrigins, env, isProduction } from "./config/env";
import { logger } from "./lib/logger";
import { errorHandler, notFoundHandler } from "./middleware/errors";
import { apiRouter } from "./routes";
import type { HealthDTO } from "./types/dto";

export const app = express();

app.disable("x-powered-by");
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

/** Healthcheck (usado por Docker Compose). */
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

app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);
