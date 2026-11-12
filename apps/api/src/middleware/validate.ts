import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

/** Valida `req.body` contra un esquema Zod y reemplaza el body por el dato tipado. */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
}
