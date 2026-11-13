/**
 * Utilidades de fecha/hora para la clínica.
 *
 * La operación es 100 % en Lima (Perú), que usa UTC-5 sin horario de verano.
 * Centralizar aquí los límites del día evita que una cita del viernes
 * aparezca como parte de la cola de hoy por culpa del huso horario del
 * servidor.
 */
export const CLINIC_TIMEZONE = "America/Lima";

/** Lima no observa horario de verano: su offset es siempre UTC-5. */
const LIMA_OFFSET_MINUTES = -5 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Minutos de anticipación con los que se habilita el check-in. */
export const CHECK_IN_LEAD_MINUTES = 120;

export interface LimaDateParts {
  year: number;
  month: number;
  day: number;
}

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CLINIC_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Partes de calendario (año/mes/día) de un instante, vistas desde Lima. */
export function limaDateParts(date: Date = new Date()): LimaDateParts {
  const parts = partsFormatter.formatToParts(date);
  const values: Record<string, number> = {};

  for (const part of parts) {
    if (part.type === "year" || part.type === "month" || part.type === "day") {
      values[part.type] = Number(part.value);
    }
  }

  return {
    year: values.year ?? date.getUTCFullYear(),
    month: values.month ?? date.getUTCMonth() + 1,
    day: values.day ?? date.getUTCDate(),
  };
}

/** Clave de calendario de Lima en formato `YYYY-MM-DD`. */
export function limaDateKey(date: Date = new Date()): string {
  const { year, month, day } = limaDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Instante UTC que corresponde a la medianoche de Lima de una clave. */
export function limaMidnightUtc(dateKey: string): Date {
  const [yearPart = "0", monthPart = "1", dayPart = "1"] = dateKey.split("-");
  const utcMs = Date.UTC(
    Number(yearPart),
    Number(monthPart) - 1,
    Number(dayPart),
    0,
    0,
    0,
    0,
  );
  return new Date(utcMs - LIMA_OFFSET_MINUTES * 60_000);
}

/** Rango [inicio, fin) del día de Lima que contiene al instante dado. */
export function limaDayRange(date: Date = new Date()): {
  start: Date;
  end: Date;
  key: string;
} {
  const key = limaDateKey(date);
  const start = limaMidnightUtc(key);
  return { start, end: new Date(start.getTime() + DAY_MS), key };
}

/** Rango [inicio, fin) del día de Lima indicado por `YYYY-MM-DD`. */
export function limaDayRangeFromKey(dateKey: string): {
  start: Date;
  end: Date;
  key: string;
} {
  const start = limaMidnightUtc(dateKey);
  return { start, end: new Date(start.getTime() + DAY_MS), key: dateKey };
}

export function isSameLimaDay(a: Date, b: Date): boolean {
  return limaDateKey(a) === limaDateKey(b);
}

export function isTodayInLima(date: Date): boolean {
  return isSameLimaDay(date, new Date());
}

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: CLINIC_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** `HH:mm` (24 h) de un instante visto desde Lima. */
export function limaTimeLabel(date: Date): string {
  return timeFormatter.format(date);
}

/** Minutos transcurridos desde la medianoche de Lima (0–1439). */
export function limaMinutesOfDay(date: Date = new Date()): number {
  const shifted = new Date(date.getTime() + LIMA_OFFSET_MINUTES * 60_000);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

/** Fecha legible (por ejemplo, «viernes, 13 de noviembre»). */
export function limaDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: CLINIC_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}
