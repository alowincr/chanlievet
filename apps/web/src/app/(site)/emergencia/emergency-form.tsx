"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Copy,
  MessageCircle,
  Phone,
  Siren,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { SpeciesIcon } from "@/components/species-icon";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ApiError, apiFetch, describeApiError } from "@/lib/api";
import { CLINIC } from "@/lib/clinic";
import {
  SPECIES_LABELS,
  TRIAGE_DESCRIPTIONS,
  TRIAGE_LABELS,
  formatTime,
} from "@/lib/format";
import type {
  Appointment,
  Species,
  TriageSeverity,
} from "@/lib/types";
import { cn } from "@/lib/cn";

const SEVERITIES: Array<{
  value: TriageSeverity;
  label: string;
  tone: string;
}> = [
  {
    value: "CRITICAL",
    label: "Crítico",
    tone: "border-rose-500 bg-rose-50 text-rose-800",
  },
  {
    value: "URGENT",
    label: "Urgente",
    tone: "border-amber-500 bg-amber-50 text-amber-800",
  },
  {
    value: "MODERATE",
    label: "Moderado",
    tone: "border-sky-500 bg-sky-50 text-sky-800",
  },
];

interface EmergencyFormState {
  fullName: string;
  phone: string;
  documentId: string;
  petName: string;
  species: Species;
  breed: string;
  symptoms: string;
  notes: string;
}

const INITIAL_FORM: EmergencyFormState = {
  fullName: "",
  phone: "",
  documentId: "",
  petName: "",
  species: "DOG",
  breed: "",
  symptoms: "",
  notes: "",
};

export function EmergencyForm() {
  const [form, setForm] = useState<EmergencyFormState>(INITIAL_FORM);
  const [severity, setSeverity] = useState<TriageSeverity>("URGENT");
  const [open, setOpen] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<Appointment | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    apiFetch<{ open: boolean; message: string }>(
      "/api/appointments/emergency/status",
      { auth: false },
    )
      .then((response) => {
        if (!active) return;
        setOpen(response.open);
        setStatusMessage(response.message);
      })
      .catch(() => {
        if (active) setOpen(true);
      });

    return () => {
      active = false;
    };
  }, []);

  function update<K extends keyof EmergencyFormState>(
    key: K,
    value: EmergencyFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function copyCode(code: string) {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (open === false) {
      setError(
        "La clínica está cerrada. Llámanos para recibir orientación inmediata.",
      );
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

    if (form.symptoms.trim().length < 10) {
      setError("Describe brevemente lo que observas (mínimo 10 caracteres).");
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiFetch<{ appointment: Appointment }>(
        "/api/appointments/emergency",
        {
          method: "POST",
          auth: false,
          body: {
            owner: {
              fullName: form.fullName.trim(),
              phone: form.phone,
              documentId: form.documentId,
            },
            pet: {
              name: form.petName.trim(),
              species: form.species,
              breed: form.breed.trim() || undefined,
            },
            severity,
            symptoms: form.symptoms.trim(),
            notes: form.notes.trim() || undefined,
          },
        },
      );

      setCreated(response.appointment);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
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
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="overflow-hidden rounded-3xl border-2 border-rose-200 bg-white shadow-xl shadow-rose-900/5">
        <div className="bg-gradient-to-br from-rose-600 to-rose-800 px-6 py-8 text-center text-white">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-white/15">
            <Siren className="size-7" />
          </span>
          <h3 className="mt-4 text-2xl font-bold tracking-tight">
            Emergencia registrada
          </h3>
          <p className="mt-2 text-sm text-rose-100">
            {created.pet.name} tiene prioridad en la cola. Guarda tu código y
            acércate a la sede.
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
            <p className="mt-1 text-[11px] text-rose-100">Código copiado</p>
          ) : null}
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Posición en la cola
              </p>
              <p className="mt-1 text-lg font-bold text-stone-900">
                {created.queuePosition
                  ? `#${created.queuePosition}`
                  : "Prioridad"}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Triaje
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-800">
                {created.triageSeverity
                  ? TRIAGE_LABELS[created.triageSeverity]
                  : "Emergencia"}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Registro
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-800">
                {formatTime(created.scheduledAt)} hrs
              </p>
            </div>
          </div>

          <Alert variant="error" title="Acércate ahora a la clínica">
            {created.pet.name} ya está en la cola prioritaria. Si el traslado se
            complica, llama al {CLINIC.phone}.
          </Alert>

          <div className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">
            <p className="font-semibold text-stone-800">{CLINIC.address}</p>
            <p className="text-xs text-stone-500">{CLINIC.district}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <ButtonLink
              href={`/seguimiento?codigo=${created.code}`}
              className="flex-1"
            >
              <ClipboardCheck className="size-4" />
              Ver seguimiento
            </ButtonLink>
            <a
              href={`tel:${CLINIC.phone.replace(/\s/g, "")}`}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border-2 border-forest-900/20 bg-white text-sm font-semibold text-forest-900 hover:border-brand-600"
            >
              <Phone className="size-4" />
              Llamar a la clínica
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-stone-400">
            <a
              href={`https://wa.me/${CLINIC.whatsapp}?text=${encodeURIComponent(
                `Hola ChanlieVet, registré la emergencia ${created.code} para ${created.pet.name}.`,
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#1ebe5b] hover:text-[#17994a]"
            >
              <MessageCircle className="size-3.5" />
              Avisar por WhatsApp
            </a>
            <Link href="/" className="hover:text-brand-700">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border-2 border-forest-900/10 bg-cream-50 p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-stone-900">
            Triaje de emergencia
          </h3>
          <p className="mt-0.5 text-xs text-stone-500">
            Los campos con <span className="text-rose-600">*</span> son
            obligatorios.
          </p>
        </div>
        {open === null ? (
          <Badge tone="neutral">Verificando horario...</Badge>
        ) : open ? (
          <Badge tone="emerald">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Clínica abierta
          </Badge>
        ) : (
          <Badge tone="rose">
            <XCircle className="size-3" />
            Clínica cerrada
          </Badge>
        )}
      </div>

      {open === false ? (
        <Alert variant="error" className="mt-4" title="Fuera del horario de atención">
          {statusMessage ||
            "La clínica está cerrada. Llámanos para recibir orientación inmediata."}{" "}
          <a
            href={`tel:${CLINIC.phone.replace(/\s/g, "")}`}
            className="font-semibold underline"
          >
            {CLINIC.phone}
          </a>
        </Alert>
      ) : null}

      <fieldset className="mt-5 space-y-4" disabled={open === false || submitting}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nombre del dueño"
            htmlFor="emergency-fullName"
            required
            className="sm:col-span-2"
            error={fieldErrors["owner.fullName"]}
          >
            <Input
              id="emergency-fullName"
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
            htmlFor="emergency-phone"
            required
            hint="9 dígitos, empieza con 9."
            error={fieldErrors["owner.phone"]}
          >
            <Input
              id="emergency-phone"
              type="tel"
              value={form.phone}
              onChange={(event) =>
                update("phone", event.target.value.replace(/\D/g, "").slice(0, 9))
              }
              placeholder="987654321"
              inputMode="numeric"
              pattern="9[0-9]{8}"
              maxLength={9}
              required
            />
          </Field>

          <Field
            label="DNI"
            htmlFor="emergency-documentId"
            required
            hint="8 dígitos."
            error={fieldErrors["owner.documentId"]}
          >
            <Input
              id="emergency-documentId"
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

          <Field
            label="Nombre de la mascota"
            htmlFor="emergency-petName"
            required
            error={fieldErrors["pet.name"]}
          >
            <Input
              id="emergency-petName"
              value={form.petName}
              onChange={(event) => update("petName", event.target.value)}
              placeholder="Ej. Michi"
              maxLength={80}
              required
            />
          </Field>

          <Field label="Raza" htmlFor="emergency-breed" hint="Opcional">
            <Input
              id="emergency-breed"
              value={form.breed}
              onChange={(event) => update("breed", event.target.value)}
              placeholder="Ej. Mestizo, siamés..."
              maxLength={80}
            />
          </Field>

          <Field label="Especie" htmlFor="emergency-species" required className="sm:col-span-2">
            <div className="grid grid-cols-3 gap-2">
              {(["DOG", "CAT", "OTHER"] as Species[]).map((species) => (
                <button
                  key={species}
                  type="button"
                  onClick={() => update("species", species)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border py-2 text-xs font-semibold transition-colors",
                    form.species === species
                      ? "border-2 border-brand-500 bg-brand-50 text-brand-700"
                      : "border-stone-200 bg-white text-stone-600 hover:border-brand-300",
                  )}
                >
                  <SpeciesIcon species={species} className="size-5" />
                  {SPECIES_LABELS[species]}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-stone-700">
            Gravedad observada <span className="text-rose-600">*</span>
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {SEVERITIES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSeverity(option.value)}
                aria-pressed={severity === option.value}
                className={cn(
                  "rounded-2xl border-2 p-3 text-left transition-colors",
                  severity === option.value
                    ? option.tone
                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300",
                )}
              >
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  <TriangleAlert className="size-4" />
                  {option.label}
                </span>
                <span className="mt-1 block text-[11px] leading-relaxed opacity-80">
                  {TRIAGE_DESCRIPTIONS[option.value]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Field
          label="¿Qué observas?"
          htmlFor="emergency-symptoms"
          required
          hint="Síntomas, cuándo empezaron y si ingirió algo."
          error={fieldErrors.symptoms}
        >
          <Textarea
            id="emergency-symptoms"
            value={form.symptoms}
            onChange={(event) => update("symptoms", event.target.value)}
            placeholder="Ej. Respira con dificultad desde hace 20 minutos y tiene las encías pálidas."
            maxLength={800}
            required
          />
        </Field>

        <Field
          label="Datos adicionales"
          htmlFor="emergency-notes"
          hint="Opcional: alergias, medicamentos o condiciones previas."
        >
          <Textarea
            id="emergency-notes"
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Ej. Es alérgico a la penicilina."
            maxLength={500}
          />
        </Field>
      </fieldset>

      {error ? (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      ) : null}

      <Button
        type="submit"
        size="lg"
        variant="danger"
        className="mt-5 w-full"
        disabled={open === false || submitting}
      >
        <Siren className="size-4" />
        {submitting ? "Registrando emergencia..." : "Registrar emergencia y priorizar"}
      </Button>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-stone-400">
        El triaje es orientativo. La evaluación presencial del veterinario
        define el tratamiento.{" "}
        <a
          href={`https://wa.me/${CLINIC.whatsapp}`}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-brand-700"
        >
          ¿Dudas? Escríbenos
        </a>
        .
      </p>

      <Link
        href="/citas"
        className="mt-3 flex items-center justify-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-brand-700"
      >
        Si no es una urgencia, agenda una cita normal
        <ArrowRight className="size-3" />
      </Link>
    </form>
  );
}
