"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardCheck,
  Clock,
  Copy,
  LifeBuoy,
  MessageCircle,
  Search,
  Stethoscope,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { LoadingBlock } from "@/components/ui/spinner";
import { SpeciesIcon } from "@/components/species-icon";
import { StatusBadge } from "@/components/status-badge";
import { ApiError, apiFetch, describeApiError } from "@/lib/api";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import { CLINIC } from "@/lib/clinic";
import {
  SPECIES_LABELS,
  formatCurrency,
  formatDate,
  formatTime,
} from "@/lib/format";
import type { Appointment, Availability, Service, Species } from "@/lib/types";
import { cn } from "@/lib/cn";

// Lima no tiene horario de verano: siempre UTC-5.
const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000;
const LIMA_OFFSET_SUFFIX = "-05:00";

interface FormState {
  fullName: string;
  phone: string;
  email: string;
  documentId: string;
  petName: string;
  species: Species;
  breed: string;
  birthDate: string;
  petNotes: string;
  reason: string;
}

const INITIAL_FORM: FormState = {
  fullName: "",
  phone: "",
  email: "",
  documentId: "",
  petName: "",
  species: "DOG",
  breed: "",
  birthDate: "",
  petNotes: "",
  reason: "",
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Fecha `YYYY-MM-DD` en el calendario de Lima, sin importar el huso del equipo. */
function limaDateKey(date: Date = new Date()): string {
  const shifted = new Date(date.getTime() - LIMA_OFFSET_MS);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(
    shifted.getUTCDate(),
  )}`;
}

/** Minutos transcurridos del día en Lima. */
function limaMinutesOfDay(date: Date = new Date()): number {
  const shifted = new Date(date.getTime() - LIMA_OFFSET_MS);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

function nextDays(count: number) {
  const now = Date.now();

  return Array.from({ length: count }, (_, index) => {
    const instant = new Date(now + index * 24 * 60 * 60 * 1000);
    const value = limaDateKey(instant);
    const label =
      index === 0
        ? "Hoy"
        : index === 1
          ? "Mañana"
          : new Intl.DateTimeFormat("es-PE", {
              timeZone: "America/Lima",
              weekday: "short",
              day: "numeric",
            }).format(instant);

    return { value, label };
  });
}

/** Horarios de atención según el día de la semana en Lima. */
function buildSlots(dateValue: string): string[] {
  if (!dateValue) return [];

  const noon = new Date(`${dateValue}T12:00:00${LIMA_OFFSET_SUFFIX}`);
  if (Number.isNaN(noon.getTime())) return [];

  const day = noon.getUTCDay();
  let startHour = 8;
  let endHour = 20;

  if (day === 6) endHour = 18;
  if (day === 0) {
    startHour = 9;
    endHour = 14;
  }

  const isToday = dateValue === limaDateKey();
  const nowMinutes = limaMinutesOfDay();
  const slots: string[] = [];

  for (let minutes = startHour * 60; minutes < endHour * 60; minutes += 30) {
    if (isToday && minutes < nowMinutes + 30) continue;
    slots.push(`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`);
  }

  return slots;
}

function tomorrowValue(): string {
  return limaDateKey(new Date(Date.now() + 24 * 60 * 60 * 1000));
}

/** Instante UTC de una fecha/hora de Lima. */
function limaInstant(dateValue: string, timeValue: string): string {
  return new Date(
    `${dateValue}T${timeValue}:00${LIMA_OFFSET_SUFFIX}`,
  ).toISOString();
}

export default function BookingPage() {
  const servicesQuery = useApiQuery<{ services: Service[] }>("/api/services");

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(tomorrowValue);
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<Appointment | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [copied, setCopied] = useState(false);

  // Recuperación del código perdido.
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [recoveryDocumentId, setRecoveryDocumentId] = useState("");
  const [recoveryPet, setRecoveryPet] = useState("");
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoveryResults, setRecoveryResults] = useState<Appointment[]>([]);
  const [recoverySearched, setRecoverySearched] = useState(false);

  const dayOptions = useMemo(() => nextDays(5), []);
  const today = useMemo(() => limaDateKey(), []);
  const localSlots = useMemo(() => buildSlots(date), [date]);

  const availability = useApiQuery<Availability>(
    date
      ? `/api/appointments/availability?date=${date}${
          serviceId ? `&serviceId=${serviceId}` : ""
        }`
      : null,
  );

  // La respuesta del API manda: incluye la duración del servicio y descarta
  // las franjas que no alcanzan a terminar antes del cierre.
  const availabilityMatches =
    Boolean(availability.data) &&
    availability.data?.date === date &&
    String(availability.data?.serviceId ?? "") === serviceId;

  const slots = useMemo(() => {
    if (availabilityMatches && availability.data) {
      return availability.data.scheduleSlots;
    }
    return localSlots;
  }, [availabilityMatches, availability.data, localSlots]);

  const takenSlots = useMemo(() => {
    if (!availabilityMatches || !availability.data) return new Set<string>();
    return new Set(availability.data.slots);
  }, [availabilityMatches, availability.data]);

  const selectedService = servicesQuery.data?.services.find(
    (service) => String(service.id) === serviceId,
  );

  // Si la persona recarga la página después de reservar, recuperamos la cita
  // desde el código de la URL en lugar de mostrar un formulario vacío.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("codigo");
    if (!code) return;

    let active = true;
    setRestoring(true);

    apiFetch<{ appointment: Appointment }>(
      `/api/appointments/track/${encodeURIComponent(code)}`,
      { auth: false },
    )
      .then(({ appointment }) => {
        if (active) setCreated(appointment);
      })
      .catch(() => {
        if (active) window.history.replaceState(null, "", "/citas");
      })
      .finally(() => {
        if (active) setRestoring(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!servicesQuery.data) return;

    const slug = new URLSearchParams(window.location.search).get("servicio");
    if (!slug) return;

    const match = servicesQuery.data.services.find(
      (service) => service.slug === slug,
    );

    if (match) setServiceId(String(match.id));
  }, [servicesQuery.data]);

  useEffect(() => {
    if (time && (!slots.includes(time) || takenSlots.has(time))) setTime("");
  }, [slots, takenSlots, time]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handlePhone(value: string) {
    update("phone", value.replace(/\D/g, "").slice(0, 9));
  }

  /** Valida el formulario y abre la confirmación (sin enviar todavía). */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (submitting) return;

    if (!serviceId) {
      setError("Selecciona el servicio que necesita tu mascota.");
      return;
    }

    if (!date || !time) {
      setError("Selecciona una fecha y una hora disponibles.");
      return;
    }

    if (takenSlots.has(time)) {
      setError("Ese horario acaba de ocuparse. Elige otro, por favor.");
      return;
    }

    if (!/^9\d{8}$/.test(form.phone)) {
      setError("Ingresa un celular peruano válido de 9 dígitos (empieza con 9).");
      return;
    }

    if (!/^\d{8}$/.test(form.documentId)) {
      setError("Ingresa un DNI válido de 8 dígitos.");
      return;
    }

    if (!form.fullName.trim() || !form.petName.trim()) {
      setError("Completa el nombre del dueño y de la mascota.");
      return;
    }

    setConfirmOpen(true);
  }

  /** Envío real, solo después de que la persona confirma el resumen. */
  async function submitBooking() {
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await apiFetch<{ appointment: Appointment }>(
        "/api/appointments",
        {
          method: "POST",
          auth: false,
          body: {
            owner: {
              fullName: form.fullName.trim(),
              phone: form.phone,
              email: form.email.trim() || undefined,
              documentId: form.documentId,
            },
            pet: {
              name: form.petName.trim(),
              species: form.species,
              breed: form.breed.trim() || undefined,
              birthDate: form.birthDate || undefined,
              notes: form.petNotes.trim() || undefined,
            },
            serviceId: Number(serviceId),
            scheduledAt: limaInstant(date, time),
            reason: form.reason.trim() || undefined,
          },
        },
      );

      setConfirmOpen(false);
      setCreated(response.appointment);
      window.history.replaceState(
        null,
        "",
        `/citas?codigo=${encodeURIComponent(response.appointment.code)}`,
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setConfirmOpen(false);

      if (caught instanceof ApiError && Array.isArray(caught.details)) {
        const mapped: Record<string, string> = {};
        for (const detail of caught.details) {
          if (typeof detail !== "object" || detail === null) continue;
          const path =
            "path" in detail ? String((detail as { path: unknown }).path) : "";
          const message =
            "message" in detail
              ? String((detail as { message: unknown }).message)
              : "";
          if (path && message) mapped[path] = message;
        }
        setFieldErrors(mapped);
      }

      setError(describeApiError(caught));
      availability.refetch();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecoveryError(null);
    setRecoveryResults([]);
    setRecoverySearched(false);

    if (!recoveryPhone && !recoveryDocumentId) {
      setRecoveryError("Ingresa el celular o el DNI que usaste al reservar.");
      return;
    }

    if (!recoveryPet.trim()) {
      setRecoveryError("Ingresa el nombre de tu mascota.");
      return;
    }

    setRecoveryBusy(true);

    try {
      const response = await apiFetch<{ appointments: Appointment[] }>(
        "/api/appointments/lookup",
        {
          method: "POST",
          auth: false,
          body: {
            phone: recoveryPhone || undefined,
            documentId: recoveryDocumentId || undefined,
            petName: recoveryPet.trim(),
          },
        },
      );
      setRecoveryResults(response.appointments);
      setRecoverySearched(true);
    } catch (caught) {
      setRecoveryError(describeApiError(caught));
    } finally {
      setRecoveryBusy(false);
    }
  }

  function resetBooking() {
    setCreated(null);
    setForm(INITIAL_FORM);
    setServiceId("");
    setDate(tomorrowValue());
    setTime("");
    setError(null);
    setFieldErrors({});
    setCopied(false);
    setRecoveryOpen(false);
    setRecoveryResults([]);
    setRecoverySearched(false);
    window.history.replaceState(null, "", "/citas");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function copyCode(code: string) {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }

  if (restoring) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <LoadingBlock label="Recuperando tu cita..." />
      </div>
    );
  }

  if (created) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-8 text-center text-white">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-white/15">
              <ClipboardCheck className="size-7" />
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              ¡Cita registrada!
            </h1>
            <p className="mt-2 text-sm text-brand-100">
              Guarda tu código de seguimiento. Lo necesitarás para registrar tu
              llegada y ver tu turno en vivo.
            </p>

            <div className="mx-auto mt-5 flex max-w-sm items-center justify-center gap-2 rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
              <span className="font-mono text-2xl font-bold tracking-[0.2em]">
                {created.code}
              </span>
              <button
                type="button"
                onClick={() => copyCode(created.code)}
                className="grid size-9 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
                aria-label="Copiar código de seguimiento"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </button>
            </div>
            {copied ? (
              <p className="mt-1 text-[11px] text-brand-100">Código copiado</p>
            ) : null}
          </div>

          <div className="space-y-5 p-6 sm:p-8">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Servicio
                </p>
                <p className="mt-1 text-sm font-semibold text-stone-800">
                  {created.service.name}
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Fecha y hora
                </p>
                <p className="mt-1 text-sm font-semibold text-stone-800">
                  {formatDate(created.scheduledAt)} ·{" "}
                  {formatTime(created.scheduledAt)}
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Mascota
                </p>
                <p className="mt-1 text-sm font-semibold text-stone-800">
                  {created.pet.name}
                </p>
              </div>
            </div>

            <Alert variant="warning" title="Importante">
              Llega unos minutos antes y registra tu llegada desde la página de
              seguimiento. Así entrarás a la sala de espera virtual.
            </Alert>

            <div className="flex flex-col gap-2 sm:flex-row">
              <ButtonLink
                href={`/seguimiento?codigo=${created.code}`}
                className="flex-1"
              >
                <ClipboardCheck className="size-4" />
                Ver seguimiento
              </ButtonLink>
              <Button
                type="button"
                variant="outline"
                onClick={resetBooking}
                className="flex-1"
              >
                Agendar otra cita
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-stone-400">
              <Link href="/" className="inline-flex items-center gap-1 hover:text-brand-700">
                <ArrowLeft className="size-3.5" />
                Volver al inicio
              </Link>
              <span>¿Necesitas cambiar algo? Usa Seguimiento con tu código.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="size-3.5" />
        Volver al inicio
      </Link>
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          <CalendarDays className="size-3.5" />
          Reserva sin registro
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Agenda la cita de tu mascota
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-500 sm:text-base">
          Completa los datos y recibe un código de seguimiento al instante. No
          necesitas crear una cuenta.
        </p>
      </div>

      {servicesQuery.error ? (
        <Alert variant="error" className="mt-6" title="No pudimos cargar los servicios">
          <button
            type="button"
            onClick={servicesQuery.refetch}
            className="font-semibold underline"
          >
            Reintentar
          </button>
        </Alert>
      ) : null}

      {servicesQuery.loading ? (
        <div className="mt-8">
          <LoadingBlock label="Cargando servicios disponibles..." />
        </div>
      ) : (
        <div className="mt-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <form
              id="booking-form"
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <Card>
                <CardHeader
                  title="1. Servicio"
                  description="Elige el motivo principal de la visita."
                />
                <div className="space-y-4 p-5">
                  <Field
                    label="Servicio"
                    htmlFor="service"
                    required
                    error={fieldErrors.serviceId}
                  >
                    <Select
                      id="service"
                      value={serviceId}
                      onChange={(event) => setServiceId(event.target.value)}
                      required
                    >
                      <option value="">Selecciona un servicio</option>
                      {servicesQuery.data?.services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} · {formatCurrency(service.price)} ·{" "}
                          {service.durationMin} min
                        </option>
                      ))}
                    </Select>
                  </Field>

                  {selectedService ? (
                    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-brand-50/60 px-3 py-2 text-xs text-stone-600">
                      <Stethoscope className="size-4 text-brand-600" />
                      {selectedService.description}
                      <Badge tone="brand">
                        {formatCurrency(selectedService.price)}
                      </Badge>
                      <Badge tone="neutral">
                        <Clock className="size-3" />
                        {selectedService.durationMin} min
                      </Badge>
                    </div>
                  ) : null}
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="2. Fecha y hora"
                  description={
                    selectedService
                      ? `Tu cita ocupa ${selectedService.durationMin} min seguidos de agenda. Solo mostramos horas con cupo real.`
                      : "Los horarios mostrados ya están disponibles."
                  }
                />
                <div className="space-y-4 p-5">
                  <div className="flex flex-wrap gap-2">
                    {dayOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDate(option.value)}
                        className={
                          date === option.value
                            ? "rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white"
                            : "rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600 hover:border-brand-300"
                        }
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <Field label="Fecha" htmlFor="date" required error={fieldErrors.scheduledAt}>
                    <Input
                      id="date"
                      type="date"
                      min={today}
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      required
                    />
                  </Field>

                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-stone-700">
                        Horarios disponibles
                      </p>
                      {availability.loading ? (
                        <span className="text-[11px] text-stone-400">
                          Verificando disponibilidad...
                        </span>
                      ) : takenSlots.size > 0 ? (
                        <span className="text-[11px] text-stone-400">
                          {takenSlots.size} horario(s) ya ocupado(s)
                        </span>
                      ) : null}
                    </div>
                    {slots.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-500">
                        No quedan horarios para esta fecha. Prueba con otro día.
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                        {slots.map((slot) => {
                          const taken = takenSlots.has(slot);
                          const selected = time === slot && !taken;

                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={taken}
                              onClick={() => setTime(slot)}
                              aria-label={
                                taken
                                  ? `${slot}, horario ocupado`
                                  : `Elegir ${slot}`
                              }
                              className={cn(
                                "rounded-lg border py-2 text-xs font-semibold transition-colors",
                                taken
                                  ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 line-through"
                                  : selected
                                    ? "border-brand-600 bg-brand-600 text-white"
                                    : "border-stone-200 bg-white text-stone-600 hover:border-brand-300 hover:text-brand-700",
                              )}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {availability.error ? (
                      <p className="mt-2 text-[11px] text-amber-700">
                        No pudimos verificar los horarios ocupados. El sistema
                        igual rechazará una reserva duplicada.
                      </p>
                    ) : null}
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="3. Tus datos"
                  description="Usaremos tu celular para confirmar la cita."
                />
                <div className="grid gap-4 p-5 sm:grid-cols-2">
                  <Field
                    label="Nombre completo"
                    htmlFor="fullName"
                    required
                    className="sm:col-span-2"
                    error={fieldErrors["owner.fullName"]}
                  >
                    <Input
                      id="fullName"
                      value={form.fullName}
                      onChange={(event) => update("fullName", event.target.value)}
                      placeholder="Ej. María López"
                      minLength={3}
                      maxLength={120}
                      required
                    />
                  </Field>

                  <Field
                    label="Celular"
                    htmlFor="phone"
                    required
                    hint="9 dígitos, empieza con 9."
                    error={fieldErrors["owner.phone"]}
                  >
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(event) => handlePhone(event.target.value)}
                      placeholder="987654321"
                      inputMode="numeric"
                      pattern="9[0-9]{8}"
                      maxLength={9}
                      required
                    />
                  </Field>

                  <Field
                    label="Correo"
                    htmlFor="email"
                    hint="Opcional"
                    error={fieldErrors["owner.email"]}
                  >
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(event) => update("email", event.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      maxLength={160}
                    />
                  </Field>

                  <Field
                    label="DNI"
                    htmlFor="documentId"
                    required
                    hint="8 dígitos, sin espacios."
                    className="sm:col-span-2"
                    error={fieldErrors["owner.documentId"]}
                  >
                    <Input
                      id="documentId"
                      value={form.documentId}
                      onChange={(event) =>
                        update(
                          "documentId",
                          event.target.value.replace(/\D/g, "").slice(0, 8),
                        )
                      }
                      placeholder="12345678"
                      inputMode="numeric"
                      pattern="[0-9]{8}"
                      maxLength={8}
                      required
                    />
                  </Field>
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="4. Tu mascota"
                  description="Si ya nos visitó antes, reutilizaremos su ficha."
                />
                <div className="grid gap-4 p-5 sm:grid-cols-2">
                  <Field
                    label="Nombre"
                    htmlFor="petName"
                    required
                    error={fieldErrors["pet.name"]}
                  >
                    <Input
                      id="petName"
                      value={form.petName}
                      onChange={(event) => update("petName", event.target.value)}
                      placeholder="Ej. Michi"
                      maxLength={80}
                      required
                    />
                  </Field>

                  <Field label="Especie" htmlFor="species" required>
                    <div className="grid grid-cols-3 gap-2">
                      {(["DOG", "CAT", "OTHER"] as Species[]).map((species) => (
                        <button
                          key={species}
                          type="button"
                          onClick={() => update("species", species)}
                          className={
                            form.species === species
                              ? "flex flex-col items-center gap-1 rounded-xl border-2 border-brand-500 bg-brand-50 py-2 text-xs font-semibold text-brand-700"
                              : "flex flex-col items-center gap-1 rounded-xl border border-stone-200 bg-white py-2 text-xs font-medium text-stone-600 hover:border-brand-300"
                          }
                        >
                          <SpeciesIcon species={species} className="size-5" />
                          {SPECIES_LABELS[species]}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Raza" htmlFor="breed" hint="Opcional">
                    <Input
                      id="breed"
                      value={form.breed}
                      onChange={(event) => update("breed", event.target.value)}
                      placeholder="Ej. Mestizo, siamés..."
                      maxLength={80}
                    />
                  </Field>

                  <Field
                    label="Fecha de nacimiento"
                    htmlFor="birthDate"
                    hint="Opcional"
                  >
                    <Input
                      id="birthDate"
                      type="date"
                      max={today}
                      value={form.birthDate}
                      onChange={(event) =>
                        update("birthDate", event.target.value)
                      }
                    />
                  </Field>

                  <Field
                    label="Notas sobre tu mascota"
                    htmlFor="petNotes"
                    hint="Alergias, medicamentos, comportamiento..."
                    className="sm:col-span-2"
                  >
                    <Textarea
                      id="petNotes"
                      value={form.petNotes}
                      onChange={(event) =>
                        update("petNotes", event.target.value)
                      }
                      placeholder="Cuéntanos algo que debamos saber antes de la atención."
                      maxLength={500}
                    />
                  </Field>
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="5. Motivo de la cita"
                  description="Opcional, pero nos ayuda a prepararnos."
                />
                <div className="p-5">
                  <Field label="Motivo" htmlFor="reason">
                    <Textarea
                      id="reason"
                      value={form.reason}
                      onChange={(event) => update("reason", event.target.value)}
                      placeholder="Ej. Cojea de la pata derecha desde ayer."
                      maxLength={500}
                    />
                  </Field>
                </div>
              </Card>
            </form>

            <aside className="h-fit space-y-4 lg:sticky lg:top-28">
              <Card>
                <CardHeader title="Resumen de la cita" />
                <div className="space-y-3 p-5 text-sm">
                  <div className="flex items-start gap-3">
                    <Stethoscope className="mt-0.5 size-4 shrink-0 text-brand-600" />
                    <div>
                      <p className="font-medium text-stone-800">
                        {selectedService?.name ?? "Servicio por elegir"}
                      </p>
                      <p className="text-xs text-stone-500">
                        {selectedService
                          ? `${formatCurrency(selectedService.price)} · ${selectedService.durationMin} min`
                          : "Selecciona un servicio"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-brand-600" />
                    <div>
                      <p className="font-medium text-stone-800">
                        {date
                          ? new Intl.DateTimeFormat("es-PE", {
                              timeZone: "America/Lima",
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            }).format(
                              new Date(`${date}T12:00:00${LIMA_OFFSET_SUFFIX}`),
                            )
                          : "Fecha por elegir"}
                      </p>
                      <p className="text-xs text-stone-500">
                        {time ? `${time} hrs` : "Selecciona un horario"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <SpeciesIcon
                      species={form.species}
                      className="mt-0.5 size-4 shrink-0 text-brand-600"
                    />
                    <div>
                      <p className="font-medium text-stone-800">
                        {form.petName.trim() || "Nombre de tu mascota"}
                      </p>
                      <p className="text-xs text-stone-500">
                        {SPECIES_LABELS[form.species]}
                        {form.breed ? ` · ${form.breed}` : ""}
                      </p>
                    </div>
                  </div>

                  {selectedService ? (
                    <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                      <span className="text-stone-500">Total estimado</span>
                      <span className="text-lg font-bold text-stone-900">
                        {formatCurrency(selectedService.price)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </Card>

              {error ? <Alert variant="error">{error}</Alert> : null}

              <Button
                type="submit"
                form="booking-form"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Registrando cita..." : "Confirmar cita"}
              </Button>

              <p className="px-2 text-center text-[11px] leading-relaxed text-stone-400">
                Al confirmar aceptas que te contactemos por teléfono o WhatsApp
                para coordinar la atención.
              </p>

              <div className="flex items-center justify-center gap-2 rounded-xl bg-stone-100 px-3 py-2 text-[11px] text-stone-500">
                <MessageCircle className="size-3.5 text-brand-600" />
                ¿Dudas? Escríbenos al {CLINIC.phone}
              </div>

              <Card>
                <button
                  type="button"
                  onClick={() => setRecoveryOpen((current) => !current)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                  aria-expanded={recoveryOpen}
                >
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700">
                    <LifeBuoy className="size-4 text-brand-600" />
                    ¿Perdiste tu código?
                  </span>
                  <span className="text-[11px] font-medium text-brand-700">
                    {recoveryOpen ? "Cerrar" : "Recuperar"}
                  </span>
                </button>

                {recoveryOpen ? (
                  <form
                    onSubmit={handleRecovery}
                    className="space-y-3 border-t border-stone-100 p-4"
                  >
                    <p className="text-xs leading-relaxed text-stone-500">
                      Busca tus citas con el celular o el DNI que usaste al
                      reservar, y el nombre de tu mascota.
                    </p>
                    <Input
                      type="tel"
                      autoComplete="tel"
                      value={recoveryPhone}
                      onChange={(event) =>
                        setRecoveryPhone(
                          event.target.value.replace(/\D/g, "").slice(0, 9),
                        )
                      }
                      placeholder="Celular (9 dígitos)"
                      inputMode="numeric"
                      aria-label="Celular usado al reservar"
                    />
                    <Input
                      value={recoveryDocumentId}
                      onChange={(event) =>
                        setRecoveryDocumentId(
                          event.target.value.replace(/\D/g, "").slice(0, 8),
                        )
                      }
                      placeholder="DNI (8 dígitos)"
                      inputMode="numeric"
                      aria-label="DNI usado al reservar"
                    />
                    <Input
                      value={recoveryPet}
                      onChange={(event) => setRecoveryPet(event.target.value)}
                      placeholder="Nombre de tu mascota"
                      aria-label="Nombre de la mascota"
                      maxLength={80}
                      required
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={recoveryBusy}
                    >
                      <Search className="size-4" />
                      {recoveryBusy ? "Buscando..." : "Buscar mis citas"}
                    </Button>

                    {recoveryError ? (
                      <p className="text-[11px] text-rose-600">{recoveryError}</p>
                    ) : null}

                    {recoverySearched &&
                    !recoveryBusy &&
                    recoveryError === null &&
                    recoveryResults.length === 0 ? (
                      <p className="text-[11px] text-stone-500">
                        No encontramos citas con esos datos. Revisa el celular o
                        el DNI y el nombre de tu mascota, o escríbenos por
                        WhatsApp.
                      </p>
                    ) : null}

                    {recoveryResults.length > 0 ? (
                      <ul className="space-y-2">
                        {recoveryResults.map((item) => (
                          <li
                            key={item.id}
                            className="rounded-xl border border-stone-200 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold tracking-wider text-brand-700">
                                {item.code}
                              </span>
                              <StatusBadge status={item.status} />
                            </div>
                            <p className="mt-1 text-[11px] text-stone-500">
                              {formatDate(item.scheduledAt)} ·{" "}
                              {formatTime(item.scheduledAt)} ·{" "}
                              {item.service.name}
                            </p>
                            <Link
                              href={`/seguimiento?codigo=${item.code}`}
                              className="mt-1 inline-flex text-[11px] font-semibold text-brand-700 hover:text-brand-800"
                            >
                              Ver seguimiento →
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </form>
                ) : null}
              </Card>
            </aside>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="¿Confirmamos tu cita?"
        description={
          <>
            Revisa que todo esté correcto. Después de registrarla recibirás un
            código de seguimiento; con ese código podrás cancelar o reprogramar
            la cita sin llamarnos.
          </>
        }
        confirmLabel="Sí, reservar cita"
        cancelLabel="Volver y revisar"
        busy={submitting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void submitBooking()}
      >
        <div className="space-y-2 rounded-2xl bg-stone-50 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-stone-500">Servicio</span>
            <span className="text-right font-semibold text-stone-800">
              {selectedService?.name ?? "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-stone-500">Fecha y hora</span>
            <span className="text-right font-semibold text-stone-800">
              {date
                ? new Intl.DateTimeFormat("es-PE", {
                    timeZone: "America/Lima",
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  }).format(new Date(`${date}T12:00:00${LIMA_OFFSET_SUFFIX}`))
                : "—"}{" "}
              · {time || "—"} hrs
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-stone-500">Mascota</span>
            <span className="text-right font-semibold text-stone-800">
              {form.petName.trim() || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-stone-500">Celular</span>
            <span className="text-right font-semibold text-stone-800">
              {form.phone || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-stone-500">DNI</span>
            <span className="text-right font-semibold text-stone-800">
              {form.documentId || "—"}
            </span>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
