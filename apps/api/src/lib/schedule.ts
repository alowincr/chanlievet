/**
 * Horarios de atención y construcción de franjas de reserva.
 *
 * Reglas de la sede de San Juan de Lurigancho:
 *  - Lunes a viernes: 8:00 a. m. – 8:00 p. m.
 *  - Sábados: 8:00 a. m. – 6:00 p. m.
 *  - Domingos y feriados: 9:00 a. m. – 2:00 p. m.
 *
 * Las franjas empiezan cada 30 minutos y una cita solo puede comenzar si
 * alcanza a terminar antes del cierre. La duración real del servicio es la
 * que define cuánto ocupa la agenda.
 */
import {
  limaDateKey,
  limaMidnightUtc,
  limaMinutesOfDay,
} from "./time";

export const SLOT_STEP_MINUTES = 30;

/** Margen mínimo para reservar hoy (no se ofrece una hora que ya casi empieza). */
export const SLOT_LEAD_MINUTES = 30;

export interface BusinessWindow {
  openMinute: number;
  closeMinute: number;
}

const WEEKDAY_WINDOW: BusinessWindow = { openMinute: 8 * 60, closeMinute: 20 * 60 };
const SATURDAY_WINDOW: BusinessWindow = { openMinute: 8 * 60, closeMinute: 18 * 60 };
const SUNDAY_WINDOW: BusinessWindow = { openMinute: 9 * 60, closeMinute: 14 * 60 };

/** Día de la semana (0 = domingo) del calendario de Lima. */
export function limaWeekday(dateKey: string): number {
  return new Date(`${dateKey}T12:00:00-05:00`).getUTCDay();
}

export function businessWindow(dateKey: string): BusinessWindow {
  const day = limaWeekday(dateKey);
  if (day === 0) return SUNDAY_WINDOW;
  if (day === 6) return SATURDAY_WINDOW;
  return WEEKDAY_WINDOW;
}

export function formatMinuteOfDay(minute: number): string {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Minutos desde la medianoche de Lima del inicio del día indicado. */
export function minuteOfDay(dateKey: string, date: Date): number {
  return Math.round(
    (date.getTime() - limaMidnightUtc(dateKey).getTime()) / 60_000,
  );
}

/** La cita debe empezar en una franja de 30 minutos y terminar antes del cierre. */
export function isBookableStart(date: Date, durationMin: number): boolean {
  const dateKey = limaDateKey(date);
  const window = businessWindow(dateKey);
  const minute = minuteOfDay(dateKey, date);
  const duration = Math.max(1, durationMin);

  if (minute % SLOT_STEP_MINUTES !== 0) return false;
  if (minute < window.openMinute) return false;
  if (minute + duration > window.closeMinute) return false;

  return true;
}

/** ¿La clínica está abierta en este instante (hora de Lima)? */
export function isClinicOpenAt(now: Date = new Date()): boolean {
  const dateKey = limaDateKey(now);
  const window = businessWindow(dateKey);
  const minute = limaMinutesOfDay(now);
  return minute >= window.openMinute && minute < window.closeMinute;
}

/**
 * Inicios de franja posibles para un día y una duración.
 *
 * No considera citas existentes: eso lo resuelve la disponibilidad. Para hoy
 * se descartan las franjas que empiezan en menos de 30 minutos.
 */
export function buildScheduleSlots(
  dateKey: string,
  durationMin: number,
  now: Date = new Date(),
): string[] {
  const todayKey = limaDateKey(now);
  if (dateKey < todayKey) return [];

  const window = businessWindow(dateKey);
  const duration = Math.max(1, durationMin);
  let start = window.openMinute;

  if (dateKey === todayKey) {
    const earliest = limaMinutesOfDay(now) + SLOT_LEAD_MINUTES;
    start = Math.max(
      start,
      Math.ceil(earliest / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES,
    );
  }

  const slots: string[] = [];
  for (let minute = start; minute + duration <= window.closeMinute; minute += SLOT_STEP_MINUTES) {
    slots.push(formatMinuteOfDay(minute));
  }

  return slots;
}
