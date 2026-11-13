/**
 * Cálculo de cupo por franja.
 *
 * Cada cita ocupa desde su hora de inicio hasta que termina el servicio
 * (`scheduledAt + service.durationMin`). Una franja se puede reservar si el
 * número de citas activas que se solapan con ella es menor que la capacidad
 * configurada (`SLOT_CAPACITY`, por defecto 1).
 */
import { minuteOfDay, formatMinuteOfDay } from "../../lib/schedule";

export interface CapacityBooking {
  scheduledAt: Date;
  durationMin: number;
}

export interface CapacitySlot {
  time: string;
  booked: number;
  available: boolean;
}

export function minutesFromTime(time: string): number {
  const [hoursPart = "0", minutesPart = "0"] = time.split(":");
  return Number(hoursPart) * 60 + Number(minutesPart);
}

export function timesOverlap(
  startA: number,
  durationA: number,
  startB: number,
  durationB: number,
): boolean {
  return startA < startB + Math.max(1, durationB) && startB < startA + Math.max(1, durationA);
}

/** Número de citas activas que se solapan con [startMinute, startMinute + duration). */
export function countOverlapping(
  bookings: CapacityBooking[],
  dateKey: string,
  startMinute: number,
  durationMin: number,
): number {
  return bookings.reduce((total, booking) => {
    const bookingStart = minuteOfDay(dateKey, booking.scheduledAt);
    return total + (timesOverlap(startMinute, durationMin, bookingStart, booking.durationMin) ? 1 : 0);
  }, 0);
}

export function buildCapacitySlots(
  scheduleSlots: string[],
  bookings: CapacityBooking[],
  dateKey: string,
  durationMin: number,
  capacity: number,
): CapacitySlot[] {
  return scheduleSlots.map((time) => {
    const booked = countOverlapping(bookings, dateKey, minutesFromTime(time), durationMin);
    return { time, booked, available: booked < capacity };
  });
}

/** Mensaje uniforme cuando la franja ya está completa. */
export function slotFullMessage(time: string, durationMin: number): string {
  const start = minutesFromTime(time);
  const end = formatMinuteOfDay(start + Math.max(1, durationMin));
  return `El horario de ${time} a ${end} ya no tiene cupo. Elige otra hora, por favor.`;
}
