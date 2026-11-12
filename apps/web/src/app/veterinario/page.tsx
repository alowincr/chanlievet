"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CalendarDays,
  Check,
  Clock,
  MessageCircle,
  Phone,
  Play,
  Radio,
  RefreshCw,
  Stethoscope,
  Timer,
  UserCheck,
} from "lucide-react";
import { PetAvatar } from "@/components/placeholders";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingBlock } from "@/components/ui/spinner";
import { apiFetch, describeApiError } from "@/lib/api";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import { useElapsedMinutes } from "@/lib/hooks/use-elapsed-minutes";
import { getSocket, SOCKET_EVENTS } from "@/lib/socket";
import {
  SPECIES_LABELS,
  formatDateTime,
  formatTime,
} from "@/lib/format";
import type { Appointment, AppointmentStatus } from "@/lib/types";

function InProgressCard({
  appointment,
  busy,
  onFinish,
}: {
  appointment: Appointment;
  busy: boolean;
  onFinish: () => void;
}) {
  const minutes = useElapsedMinutes(appointment.startedAt);

  return (
    <div className="rounded-2xl border border-violet-200 bg-white p-4 shadow-sm shadow-violet-900/5">
      <div className="flex items-start gap-3">
        <PetAvatar
          name={appointment.pet.name}
          species={appointment.pet.species}
          photoUrl={appointment.pet.photoUrl}
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-stone-900">{appointment.pet.name}</p>
          <p className="text-xs text-stone-500">
            {SPECIES_LABELS[appointment.pet.species]}
            {appointment.pet.breed ? ` · ${appointment.pet.breed}` : ""}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {appointment.owner.fullName} · {appointment.service.name}
          </p>
        </div>
        <Badge tone="violet">
          <Timer className="size-3" />
          {minutes} min
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-stone-50 px-3 py-2 text-[11px] text-stone-500">
        <span>Inicio: {appointment.startedAt ? formatTime(appointment.startedAt) : "—"}</span>
        <span>{appointment.assignedVet?.fullName ?? "Sin veterinario"}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={onFinish} disabled={busy}>
          <Check className="size-4" />
          {busy ? "Guardando..." : "Finalizar atención"}
        </Button>
        <a
          href={`tel:${appointment.owner.phone}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-200 px-3 text-xs font-semibold text-stone-600 hover:border-brand-300"
        >
          <Phone className="size-3.5" />
          Llamar
        </a>
      </div>
    </div>
  );
}

export default function VetPanelPage() {
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    appointment: Appointment;
    status: "COMPLETED" | "NO_SHOW";
  } | null>(null);

  const appointments = useApiQuery<{ appointments: Appointment[] }>(
    "/api/appointments?limit=100",
  );

  const refetch = appointments.refetch;

  useEffect(() => {
    const socket = getSocket();
    const handler = () => refetch();
    socket.on(SOCKET_EVENTS.APPOINTMENT_UPDATED, handler);
    // La cola también se mueve cuando recepción registra una llegada o
    // cuando otro veterinario cambia un estado.
    socket.on(SOCKET_EVENTS.QUEUE_UPDATED, handler);

    return () => {
      socket.off(SOCKET_EVENTS.APPOINTMENT_UPDATED, handler);
      socket.off(SOCKET_EVENTS.QUEUE_UPDATED, handler);
    };
  }, [refetch]);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const changeStatus = useCallback(
    async (appointment: Appointment, status: AppointmentStatus) => {
      setBusy(appointment.id);
      setError(null);

      try {
        await apiFetch(`/api/appointments/${appointment.id}/status`, {
          method: "PATCH",
          body: { status },
        });
        const labels: Record<string, string> = {
          CONFIRMED: "confirmada",
          WAITING: "en sala de espera",
          IN_PROGRESS: "en atención",
          COMPLETED: "finalizada",
          NO_SHOW: "marcada como no asistió",
        };
        setMessage(
          `Cita de ${appointment.pet.name} ${labels[status] ?? "actualizada"}.`,
        );
        setPendingAction(null);
        refetch();
      } catch (caught) {
        setError(describeApiError(caught));
      } finally {
        setBusy(null);
      }
    },
    [refetch],
  );

  /** Las acciones que no se deshacen con un clic piden confirmación. */
  function requestStatus(
    appointment: Appointment,
    status: AppointmentStatus,
  ) {
    if (status === "COMPLETED" || status === "NO_SHOW") {
      setPendingAction({ appointment, status });
      return;
    }

    void changeStatus(appointment, status);
  }

  if (appointments.loading) {
    return <LoadingBlock label="Cargando la cola de atención..." />;
  }

  if (appointments.error || !appointments.data) {
    return (
      <Alert variant="error" title="No pudimos cargar la cola">
        <p>{appointments.error ?? "Intenta nuevamente."}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={refetch}>
          <RefreshCw className="size-4" />
          Reintentar
        </Button>
      </Alert>
    );
  }

  const all = appointments.data.appointments;

  const waiting = all
    .filter((appointment) => appointment.status === "WAITING")
    .sort(
      (a, b) =>
        new Date(a.checkedInAt ?? a.scheduledAt).getTime() -
        new Date(b.checkedInAt ?? b.scheduledAt).getTime(),
    );

  const inProgress = all.filter(
    (appointment) => appointment.status === "IN_PROGRESS",
  );

  const upcoming = all
    .filter(
      (appointment) =>
        appointment.status === "PENDING" || appointment.status === "CONFIRMED",
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900">
            Cola de atención
          </h2>
          <p className="text-sm text-stone-500">
            Llama al siguiente paciente y actualiza el estado en un clic.
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-stone-400">
            <Activity className="size-3.5 text-violet-500" />
            La administración ve cada inicio y cierre en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
          <ButtonLink href="/veterinario/sala" size="sm" variant="outline">
            <Radio className="size-4" />
            Sala en vivo
          </ButtonLink>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "En espera",
            value: waiting.length,
            icon: Clock,
            tone: "bg-amber-50 text-amber-700",
          },
          {
            label: "En atención",
            value: inProgress.length,
            icon: Activity,
            tone: "bg-violet-50 text-violet-700",
          },
          {
            label: "Por confirmar",
            value: upcoming.length,
            icon: UserCheck,
            tone: "bg-sky-50 text-sky-700",
          },
          {
            label: "En cola hoy",
            value: all.filter(
              (appointment) =>
                appointment.status === "WAITING" ||
                appointment.status === "IN_PROGRESS",
            ).length,
            icon: Stethoscope,
            tone: "bg-brand-50 text-brand-700",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4"
            >
              <span className={`grid size-10 place-items-center rounded-xl ${item.tone}`}>
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-bold tabular-nums text-stone-900">
                  {item.value}
                </p>
                <p className="text-[11px] text-stone-500">{item.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {error ? (
        <Alert variant="error" title="No se pudo actualizar la cita">
          {error}
        </Alert>
      ) : null}

      {message ? <Alert variant="success">{message}</Alert> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* En espera */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Clock className="size-4 text-amber-600" />
                En espera
              </span>
            }
            description="Ordenados por hora de llegada."
            action={<Badge tone="amber">{waiting.length}</Badge>}
          />
          <div className="space-y-3 p-4">
            {waiting.length === 0 ? (
              <EmptyState
                icon={<Clock className="size-5" />}
                title="Nadie en espera"
                description="Cuando un cliente registre su llegada aparecerá aquí."
              />
            ) : (
              waiting.map((appointment, index) => (
                <div
                  key={appointment.id}
                  className={
                    index === 0
                      ? "rounded-2xl border border-brand-300 bg-brand-50/40 p-4"
                      : "rounded-2xl border border-stone-200 bg-white p-4"
                  }
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <span className="grid size-8 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      {index === 0 ? (
                        <span className="text-[9px] font-bold uppercase tracking-wide text-brand-700">
                          Siguiente
                        </span>
                      ) : null}
                    </div>

                    <PetAvatar
                      name={appointment.pet.name}
                      species={appointment.pet.species}
                      photoUrl={appointment.pet.photoUrl}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stone-900">
                        {appointment.pet.name}
                      </p>
                      <p className="text-xs text-stone-500">
                        {SPECIES_LABELS[appointment.pet.species]} ·{" "}
                        {appointment.service.name}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {appointment.owner.fullName} · {appointment.owner.phone}
                      </p>
                      <p className="mt-1 text-[11px] text-stone-400">
                        Cita {formatTime(appointment.scheduledAt)} · Llegó{" "}
                        {appointment.checkedInAt
                          ? formatDateTime(appointment.checkedInAt)
                          : "—"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          disabled={busy === appointment.id}
                          onClick={() =>
                            void changeStatus(appointment, "IN_PROGRESS")
                          }
                          className="px-3 text-xs"
                        >
                          <Play className="size-3.5" />
                          Iniciar atención
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === appointment.id}
                          onClick={() => requestStatus(appointment, "NO_SHOW")}
                          className="px-3 text-xs"
                        >
                          No asistió
                        </Button>
                        <a
                          href={`tel:${appointment.owner.phone}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 text-xs font-semibold text-stone-600 hover:border-brand-300"
                        >
                          <Phone className="size-3.5" />
                          Llamar
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* En atención */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Activity className="size-4 text-violet-600" />
                En atención
              </span>
            }
            description="Consultas en curso."
            action={<Badge tone="violet">{inProgress.length}</Badge>}
          />
          <div className="space-y-3 p-4">
            {inProgress.length === 0 ? (
              <EmptyState
                icon={<Activity className="size-5" />}
                title="Sin consultas en curso"
                description="Inicia la atención de un paciente en espera."
              />
            ) : (
              inProgress.map((appointment) => (
                <InProgressCard
                  key={appointment.id}
                  appointment={appointment}
                  busy={busy === appointment.id}
                  onFinish={() => requestStatus(appointment, "COMPLETED")}
                />
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4 text-sky-600" />
              Por confirmar y próximas
            </span>
          }
          description="Citas registradas que aún no ingresan a la sala."
          action={<Badge tone="sky">{upcoming.length}</Badge>}
        />
        <div className="p-4">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="size-5" />}
              title="No hay citas pendientes"
              description="Las nuevas reservas aparecerán en esta sección."
            />
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {upcoming.map((appointment) => (
                <li
                  key={appointment.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3"
                >
                  <PetAvatar
                    name={appointment.pet.name}
                    species={appointment.pet.species}
                    photoUrl={appointment.pet.photoUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-semibold text-stone-900">
                        {appointment.pet.name}
                      </p>
                      <Badge
                        tone={appointment.status === "PENDING" ? "amber" : "sky"}
                      >
                        {appointment.status === "PENDING"
                          ? "Registrada"
                          : "Confirmada"}
                      </Badge>
                    </div>
                    <p className="truncate text-[11px] text-stone-500">
                      {appointment.owner.fullName} · {appointment.service.name}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      {formatDateTime(appointment.scheduledAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === appointment.id}
                      onClick={() => void changeStatus(appointment, "WAITING")}
                      className="px-2.5 text-[11px]"
                    >
                      A sala de espera
                    </Button>
                    <a
                      href={`https://wa.me/51${appointment.owner.phone}?text=${encodeURIComponent(
                        `Hola ${appointment.owner.fullName}, le escribimos de ChanlieVet por la cita de ${appointment.pet.name}.`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="grid size-9 place-items-center rounded-full border border-stone-200 text-[#1ebe5b] hover:border-[#25D366]"
                      aria-label={`Escribir a ${appointment.owner.fullName} por WhatsApp`}
                    >
                      <MessageCircle className="size-4" />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={pendingAction !== null}
        tone={pendingAction?.status === "NO_SHOW" ? "danger" : "default"}
        title={
          pendingAction?.status === "NO_SHOW"
            ? "¿Marcar como inasistencia?"
            : "¿Finalizar la atención?"
        }
        description={
          pendingAction
            ? pendingAction.status === "NO_SHOW"
              ? `La cita de ${pendingAction.appointment.pet.name} quedará marcada como no asistió. Si la persona llega después, recepción puede reactivarla desde el panel de citas.`
              : `La consulta de ${pendingAction.appointment.pet.name} se cerrará y saldrá de la cola de atención.`
            : undefined
        }
        confirmLabel={
          pendingAction?.status === "NO_SHOW"
            ? "Sí, marcar inasistencia"
            : "Sí, finalizar"
        }
        cancelLabel="Volver"
        busy={busy !== null}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (!pendingAction) return;
          void changeStatus(pendingAction.appointment, pendingAction.status);
        }}
      />
    </div>
  );
}
