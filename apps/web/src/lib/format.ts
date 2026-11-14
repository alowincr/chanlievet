import type {
  AppointmentStatus,
  ProductAudience,
  Species,
  TriageSeverity,
} from "./types";

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60_000));

  if (minutes < 1) return "hace unos segundos";
  if (minutes === 1) return "hace 1 minuto";
  if (minutes < 60) return `hace ${minutes} minutos`;

  const hours = Math.round(minutes / 60);
  if (hours === 1) return "hace 1 hora";
  return `hace ${hours} horas`;
}

export function elapsedMinutes(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: "Registrada",
  CONFIRMED: "Confirmada",
  WAITING: "En espera",
  IN_PROGRESS: "En atención",
  COMPLETED: "Finalizada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

export const SPECIES_LABELS: Record<Species, string> = {
  DOG: "Perro",
  CAT: "Gato",
  OTHER: "Otra mascota",
};

export const TRIAGE_LABELS: Record<TriageSeverity, string> = {
  CRITICAL: "Crítico",
  URGENT: "Urgente",
  MODERATE: "Moderado",
};

export const TRIAGE_DESCRIPTIONS: Record<TriageSeverity, string> = {
  CRITICAL: "Dificultad para respirar, convulsiones, sangrado abundante o accidente grave.",
  URGENT: "Dolor intenso, vómitos persistentes, golpe o deterioro rápido.",
  MODERATE: "Síntomas que requieren evaluación pronto, sin riesgo inmediato evidente.",
};

export const AUDIENCE_LABELS: Record<ProductAudience, string> = {
  DOG: "Perro",
  CAT: "Gato",
  ALL: "Todos",
};

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
