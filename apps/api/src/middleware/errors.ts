import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger";
import { isProduction } from "../config/env";

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

interface PrismaLikeError {
  code: string;
  meta?: unknown;
}

/** Errores que produce body-parser al leer el cuerpo de la solicitud. */
interface BodyParserLikeError {
  type?: string;
  status?: number;
}

function isPrismaKnownError(error: unknown): error is PrismaLikeError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    (error as { name?: unknown }).name === "PrismaClientKnownRequestError"
  );
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Datos inválidos",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      error: error.message,
      ...(error.details !== undefined ? { details: error.details } : {}),
    });
    return;
  }

  // JSON mal formado o cuerpo demasiado grande: son errores del cliente,
  // no fallas internas del servidor.
  if (typeof error === "object" && error !== null) {
    const bodyError = error as BodyParserLikeError;

    if (bodyError.type === "entity.parse.failed") {
      res.status(400).json({ error: "El cuerpo de la solicitud no es JSON válido" });
      return;
    }

    if (bodyError.type === "entity.too.large") {
      res.status(413).json({ error: "La solicitud es demasiado grande" });
      return;
    }
  }

  if (isPrismaKnownError(error)) {
    if (error.code === "P2002") {
      res.status(409).json({ error: "Ya existe un registro con esos datos" });
      return;
    }
    if (error.code === "P2025") {
      res.status(404).json({ error: "El registro solicitado no existe" });
      return;
    }
    if (error.code === "P2003") {
      res.status(400).json({ error: "Referencia inválida en los datos enviados" });
      return;
    }
  }

  logger.error(`Error no controlado en ${req.method} ${req.originalUrl}`, error);

  res.status(500).json({
    error: "Error interno del servidor",
    ...(!isProduction && error instanceof Error ? { debug: error.message } : {}),
  });
}
