import { HttpError } from "../middleware/errors";

/**
 * Convierte un parámetro de ruta a un ID numérico positivo.
 * Acepta `unknown` porque los tipos de Express 5 pueden inferir
 * `string | string[] | undefined` según la ruta.
 */
export function parseId(value: unknown, label = "ID"): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);

  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `${label} inválido`);
  }

  return id;
}
