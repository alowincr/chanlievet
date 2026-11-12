"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardList,
  Clock,
  LifeBuoy,
  MapPin,
  MessageCircle,
  PawPrint,
  Phone,
  Search,
  Stethoscope,
  Ticket,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { LoadingBlock } from "@/components/ui/spinner";
import { PetAvatar } from "@/components/placeholders";
import { StatusBadge } from "@/components/status-badge";
import { ApiError, apiFetch, describeApiError } from "@/lib/api";
import { useAppointmentWatch } from "@/lib/hooks/use-appointment-watch";
import { CLINIC } from "@/lib/clinic";
import {
  SPECIES_LABELS,
  STATUS_LABELS,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
} from "@/lib/format";
import type { Appointment, AppointmentStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const STEPS: Array<{
  status: AppointmentStatus;
  label: string;
  icon: typeof Check;
}> = [
  { status: "PENDING", label: "Registrada", icon: Ticket },
  { status: "CONFIRMED", label: "Confirmada", icon: Check },
  { status: "WAITING", label: "En espera", icon: Clock },
  { status: "IN_PROGRESS", label: "En atención", icon: Stethoscope },
  { status: "COMPLETED", label: "Finalizada", icon: PawPrint },
];

const STATUS_INDEX: Partial<Record<AppointmentStatus, number>> = {
  PENDING: 0,
  CONFIRMED: 1,
  WAITING: 2,
  IN_PROGRESS: 3,
  COMPLETED: 4,
};

export default function TrackingPage() {
  const [codeInput, setCodeInput] = useState("");
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [confirmCheckIn, setConfirmCheckIn] = useState(false);
  const [liveNotice, setLiveNotice] = useState(false);

  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [recoveryPet, setRecoveryPet] = useState("");
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoveryResults, setRecoveryResults] = useState<Appointment[]>([]);
  const [recoverySearched, setRecoverySearched] = useState(false);

  const load = useCallback(
    async (rawCode: string, options?: { silent?: boolean }) => {
      const code = rawCode.trim().toUpperCase();
      if (!code) {
        setError("Ingresa tu código de seguimiento.");
        return;
      }

      if (!options?.silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await apiFetch<{ appointment: Appointment }>(
          `/api/appointments/track/${encodeURIComponent(code)}`,
          { auth: false },
        );
        setAppointment(response.appointment);
        setActiveCode(response.appointment.code);
        setCodeInput(response.appointment.code);
        setError(null);
      } catch (caught) {
        if (options?.silent) return;
        setAppointment(null);
        setActiveCode(null);
        setError(describeApiError(caught));
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("codigo");
    if (code) void load(code);
  }, [load]);

  const handleUpdate = useCallback(() => {
    if (!activeCode) return;
    setLiveNotice(true);
    void load(activeCode, { silent: true });
  }, [activeCode, load]);

  useAppointmentWatch(activeCode, handleUpdate);

  useEffect(() => {
    if (!liveNotice) return;
    const timeout = window.setTimeout(() => setLiveNotice(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [liveNotice]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void load(codeInput);
  }

  async function handleRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecoveryBusy(true);
    setRecoveryError(null);
    setRecoveryResults([]);
    setRecoverySearched(false);

    try {
      const response = await apiFetch<{ appointments: Appointment[] }>(
        "/api/appointments/lookup",
        {
          method: "POST",
          auth: false,
          body: { phone: recoveryPhone, petName: recoveryPet.trim() },
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

  async function handleCheckIn() {
    if (!appointment) return;
    setCheckingIn(true);
    setError(null);

    try {
      const response = await apiFetch<{ appointment: Appointment }>(
        `/api/appointments/track/${encodeURIComponent(appointment.code)}/check-in`,
        { method: "POST", auth: false },
      );
      setAppointment(response.appointment);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "No pudimos registrar tu llegada. Intenta nuevamente.",
      );
    } finally {
      setCheckingIn(false);
    }
  }

  const currentIndex = appointment
    ? (STATUS_INDEX[appointment.status] ?? -1)
    : -1;
  const isClosed =
    appointment?.status === "CANCELLED" || appointment?.status === "NO_SHOW";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="size-3.5" />
        Volver al inicio
      </Link>
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          <Ticket className="size-3.5" />
          Seguimiento de cita
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Consulta el estado de tu cita
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-500 sm:text-base">
          Ingresa el código que te entregamos al reservar. Se actualiza en
          tiempo real cuando el equipo cambia el estado de la atención.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="mt-6 flex flex-col gap-2 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <Input
            value={codeInput}
            onChange={(event) =>
              setCodeInput(event.target.value.toUpperCase().slice(0, 10))
            }
            placeholder="Ej. CV-7K2M9Q"
            className="pl-10 font-mono tracking-widest"
            aria-label="Código de seguimiento"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Buscando..." : "Buscar cita"}
        </Button>
      </form>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setRecoveryOpen((current) => !current)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800"
          aria-expanded={recoveryOpen}
        >
          <LifeBuoy className="size-3.5" />
          {recoveryOpen ? "Ocultar recuperación" : "¿Perdiste tu código? Recupéralo aquí"}
        </button>
      </div>

      {recoveryOpen ? (
        <form
          onSubmit={handleRecovery}
          className="mt-3 space-y-3 rounded-2xl border border-brand-200 bg-brand-50/40 p-4"
        >
          <p className="text-xs leading-relaxed text-stone-600">
            Ingresa el celular que usaste al reservar y el nombre de tu mascota.
            Te mostraremos los códigos de tus citas.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={recoveryPhone}
              onChange={(event) =>
                setRecoveryPhone(event.target.value.replace(/\D/g, "").slice(0, 9))
              }
              placeholder="Celular (9 dígitos)"
              inputMode="numeric"
              aria-label="Celular usado al reservar"
              required
            />
            <Input
              value={recoveryPet}
              onChange={(event) => setRecoveryPet(event.target.value)}
              placeholder="Nombre de tu mascota"
              aria-label="Nombre de la mascota"
              maxLength={80}
              required
            />
          </div>
          <Button type="submit" size="sm" disabled={recoveryBusy}>
            <Search className="size-4" />
            {recoveryBusy ? "Buscando..." : "Recuperar mis códigos"}
          </Button>

          {recoveryError ? (
            <p className="text-xs text-rose-600">{recoveryError}</p>
          ) : null}

          {recoverySearched &&
          !recoveryBusy &&
          recoveryError === null &&
          recoveryResults.length === 0 ? (
            <p className="text-xs text-stone-500">
              No encontramos citas con esos datos. Revisa el celular y el nombre
              de tu mascota, o escríbenos por WhatsApp.
            </p>
          ) : null}

          {recoveryResults.length > 0 ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {recoveryResults.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-stone-200 bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold tracking-wider text-brand-700">
                      {item.code}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-[11px] text-stone-500">
                    {formatDate(item.scheduledAt)} · {formatTime(item.scheduledAt)} ·{" "}
                    {item.service.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCodeInput(item.code);
                      void load(item.code);
                      setRecoveryOpen(false);
                    }}
                    className="mt-1 inline-flex text-[11px] font-semibold text-brand-700 hover:text-brand-800"
                  >
                    Ver seguimiento →
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </form>
      ) : null}

      {error ? (
        <Alert variant="error" className="mt-4" title="No pudimos encontrar la cita">
          {error}
        </Alert>
      ) : null}

      {liveNotice ? (
        <Alert variant="success" className="mt-4">
          La cita se actualizó en tiempo real.
        </Alert>
      ) : null}

      {loading ? (
        <div className="mt-6">
          <LoadingBlock label="Consultando tu cita..." />
        </div>
      ) : null}

      {!loading && !appointment && !error ? (
        <div className="mt-6">
          <EmptyState
            icon={<Ticket className="size-6" />}
            title="Tu código aparece en la confirmación"
            description="Si no lo encuentras, escríbenos por WhatsApp con tu nombre y el de tu mascota."
            action={
              <a
                href={`https://wa.me/${CLINIC.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700"
              >
                <MessageCircle className="size-4" />
                Escribir a la clínica
              </a>
            }
          />
        </div>
      ) : null}

      {appointment ? (
        <div className="mt-6 space-y-5">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-4 bg-gradient-to-br from-brand-50 to-white p-5">
              <PetAvatar
                name={appointment.pet.name}
                species={appointment.pet.species}
                photoUrl={appointment.pet.photoUrl}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-stone-900">
                    {appointment.pet.name}
                  </h2>
                  <StatusBadge status={appointment.status} />
                </div>
                <p className="mt-0.5 text-sm text-stone-500">
                  {SPECIES_LABELS[appointment.pet.species]}
                  {appointment.pet.breed ? ` · ${appointment.pet.breed}` : ""} ·{" "}
                  {appointment.service.name}
                </p>
                <p className="mt-1 font-mono text-xs font-semibold tracking-widest text-brand-700">
                  {appointment.code}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-stone-800">
                  {formatDate(appointment.scheduledAt)}
                </p>
                <p className="text-stone-500">
                  {formatTime(appointment.scheduledAt)} hrs
                </p>
              </div>
            </div>

            {!isClosed ? (
              <div className="border-t border-stone-100 p-5">
                <ol className="grid grid-cols-5 gap-1.5">
                  {STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const reached = index <= currentIndex;
                    const current = index === currentIndex;

                    return (
                      <li key={step.status} className="flex flex-col items-center text-center">
                        <span
                          className={cn(
                            "grid size-9 place-items-center rounded-full border-2 transition-colors",
                            reached
                              ? "border-brand-600 bg-brand-600 text-white"
                              : "border-stone-200 bg-white text-stone-400",
                            current && "ring-4 ring-brand-100",
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span
                          className={cn(
                            "mt-1.5 text-[10px] font-semibold sm:text-xs",
                            reached ? "text-brand-700" : "text-stone-400",
                          )}
                        >
                          {step.label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : (
              <div className="border-t border-stone-100 p-5">
                <Alert variant="error" title={`Cita ${STATUS_LABELS[appointment.status].toLowerCase()}`}>
                  Si necesitas otra fecha, agenda una nueva cita o escríbenos
                  por WhatsApp.
                </Alert>
              </div>
            )}
          </Card>

          {appointment.status === "WAITING" ? (
            <div className="flex flex-wrap items-center gap-5 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-lg shadow-brand-900/15">
              <div className="grid size-20 place-items-center rounded-2xl bg-white/10">
                <span className="text-4xl font-extrabold tabular-nums">
                  {appointment.queuePosition ?? "—"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-100">
                  Tu posición en la sala
                </p>
                <p className="mt-1 text-lg font-semibold">
                  Estás en la cola de atención
                </p>
                <p className="mt-1 text-sm text-brand-100">
                  Te llamaremos cuando sea el turno de {appointment.pet.name}.
                  Mantén esta página abierta para ver el avance en vivo.
                </p>
              </div>
            </div>
          ) : null}

          {appointment.status === "IN_PROGRESS" ? (
            <Alert variant="success" title="¡Es el turno de tu mascota!">
              {appointment.pet.name} está en atención
              {appointment.assignedVet
                ? ` con ${appointment.assignedVet.fullName}`
                : ""}.
            </Alert>
          ) : null}

          {appointment.status === "COMPLETED" ? (
            <Alert variant="success" title="Atención finalizada">
              Gracias por confiar en ChanlieVet. Si tienes indicaciones
              pendientes, escríbenos por WhatsApp.
            </Alert>
          ) : null}

          {appointment.status === "PENDING" ||
          appointment.status === "CONFIRMED" ? (
            <Card>
              <CardHeader
                title="¿Ya llegaste a la clínica?"
                description="Registra tu llegada para ingresar a la sala de espera virtual."
              />
              <div className="space-y-3 p-5">
                {appointment.canCheckIn ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={() => setConfirmCheckIn(true)}
                      disabled={checkingIn}
                    >
                      <MapPin className="size-4" />
                      {checkingIn ? "Registrando..." : "Registrar mi llegada"}
                    </Button>
                    <p className="text-xs text-stone-500">
                      También puedes avisarnos en recepción al ingresar.
                    </p>
                  </div>
                ) : (
                  <Alert variant="info" title="Aún no es momento de registrar tu llegada">
                    {appointment.checkInOpensAt ? (
                      <>
                        Podrás registrar tu llegada el{" "}
                        <strong>
                          {formatDate(appointment.scheduledAt)} desde las{" "}
                          {formatTime(appointment.checkInOpensAt)}
                        </strong>
                        , dos horas antes de tu cita. Si llegas antes, avísanos
                        en recepción.
                      </>
                    ) : (
                      <>
                        Esta cita es para el{" "}
                        <strong>{formatDate(appointment.scheduledAt)}</strong>. El
                        registro en la sala se habilita el mismo día de la cita.
                      </>
                    )}
                  </Alert>
                )}
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Detalle de la cita" />
            <div className="grid gap-4 p-5 text-sm sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  Dueño
                </p>
                <p className="mt-0.5 font-medium text-stone-800">
                  {appointment.owner.fullName}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  Contacto
                </p>
                <a
                  href={`tel:${appointment.owner.phone}`}
                  className="mt-0.5 inline-flex items-center gap-1.5 font-medium text-stone-800 hover:text-brand-700"
                >
                  <Phone className="size-3.5" />
                  {appointment.owner.phone}
                </a>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  Servicio
                </p>
                <p className="mt-0.5 font-medium text-stone-800">
                  {appointment.service.name} ·{" "}
                  {formatCurrency(appointment.service.price)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  Horario reservado
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 font-medium text-stone-800">
                  <CalendarDays className="size-3.5" />
                  {formatDateTime(appointment.scheduledAt)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  Registro en sala
                </p>
                <p className="mt-0.5 font-medium text-stone-800">
                  {appointment.checkedInAt
                    ? formatDateTime(appointment.checkedInAt)
                    : "Aún no registrado"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  Veterinario
                </p>
                <p className="mt-0.5 font-medium text-stone-800">
                  {appointment.assignedVet?.fullName ?? "Por asignar"}
                </p>
              </div>
              {appointment.reason ? (
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                    Motivo
                  </p>
                  <p className="mt-0.5 text-stone-700">{appointment.reason}</p>
                </div>
              ) : null}
            </div>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-5 py-4">
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <ClipboardList className="size-4 text-brand-600" />
              ¿Necesitas reprogramar o tienes una duda?
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAppointment(null);
                  setActiveCode(null);
                  setCodeInput("");
                  setError(null);
                }}
              >
                Buscar otro código
              </Button>
              <a
                href={`https://wa.me/${CLINIC.whatsapp}?text=${encodeURIComponent(
                  `Hola ChanlieVet, tengo una consulta sobre la cita ${appointment.code} de ${appointment.pet.name}.`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#25D366] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5b]"
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </a>
            </div>
          </div>

          <p className="text-center text-[11px] text-stone-400">
            Código de seguimiento:{" "}
            <Badge tone="brand" className="font-mono">
              {appointment.code}
            </Badge>
          </p>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmCheckIn}
        title="¿Registrar tu llegada?"
        description={
          appointment
            ? `Vas a ingresar a ${appointment.pet.name} a la sala de espera virtual de hoy. Si aún no estás en la clínica, espera a llegar para registrarte.`
            : undefined
        }
        confirmLabel="Sí, ya llegué"
        cancelLabel="Todavía no"
        busy={checkingIn}
        onCancel={() => setConfirmCheckIn(false)}
        onConfirm={() => {
          setConfirmCheckIn(false);
          void handleCheckIn();
        }}
      />
    </div>
  );
}
