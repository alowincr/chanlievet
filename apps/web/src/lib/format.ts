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

export const STATUS_TONES: Record<AppointmentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  CONFIRMED: "bg-sky-100 text-sky-800 border-sky-200",
  WAITING: "bg-brand-100 text-brand-800 border-brand-200",
  IN_PROGRESS: "bg-violet-100 text-violet-800 border-violet-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-stone-200 text-stone-600 border-stone-300",
  NO_SHOW: "bg-rose-100 text-rose-800 border-rose-200",
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

export function speciesLabel(species: Species): string {
  return SPECIES_LABELS[species] ?? "Mascota";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
