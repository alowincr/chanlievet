"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CalendarDays,
  ClipboardList,
  RefreshCw,
  RotateCcw,
  Search,
  SearchX,
  X,
} from "lucide-react";
import { PetAvatar } from "@/components/placeholders";
import { StatusBadge } from "@/components/status-badge";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/field";
import { LoadingBlock } from "@/components/ui/spinner";
import { apiFetch, describeApiError } from "@/lib/api";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import { getSocket, SOCKET_EVENTS } from "@/lib/socket";
import {
  STATUS_LABELS,
  TRIAGE_LABELS,
  formatDateTime,
  formatTime,
} from "@/lib/format";
import type {
  Appointment,
  AppointmentStatus,
  StaffUser,
} from "@/lib/types";

interface Action {
  label: string;
  status: AppointmentStatus;
  variant: "primary" | "outline" | "danger";
}

const ACTIONS: Record<AppointmentStatus, Action[]> = {
  PENDING: [
    { label: "Confirmar", status: "CONFIRMED", variant: "primary" },
    { label: "En espera", status: "WAITING", variant: "outline" },
    { label: "Cancelar", status: "CANCELLED", variant: "danger" },
  ],
  CONFIRMED: [
    { label: "En espera", status: "WAITING", variant: "primary" },
    { label: "No asistió", status: "NO_SHOW", variant: "outline" },
    { label: "Cancelar", status: "CANCELLED", variant: "danger" },
  ],
  WAITING: [
    { label: "Iniciar", status: "IN_PROGRESS", variant: "primary" },
    { label: "No asistió", status: "NO_SHOW", variant: "outline" },
    { label: "Cancelar", status: "CANCELLED", variant: "danger" },
  ],
  IN_PROGRESS: [
    { label: "Finalizar", status: "COMPLETED", variant: "primary" },
  ],
  COMPLETED: [],
  CANCELLED: [
    { label: "Restaurar", status: "CONFIRMED", variant: "outline" },
  ],
  NO_SHOW: [
    { label: "Restaurar", status: "CONFIRMED", variant: "outline" },
  ],
};

const STATUS_OPTIONS: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "WAITING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

export default function AdminAppointmentsPage() {
  const [status, setStatus] = useState<"ALL" | AppointmentStatus>("ALL");
  const [date, setDate] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    appointment: Appointment;
    action: Action;
  } | null>(null);

  const path = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (date) params.set("date", date);
    if (search.trim()) params.set("q", search.trim());
    params.set("limit", "100");
    return `/api/appointments?${params.toString()}`;
  }, [status, date, search]);

  const appointments = useApiQuery<{ appointments: Appointment[] }>(path);
  const vets = useApiQuery<{ veterinarians: StaffUser[] }>(
    "/api/staff/veterinarians",
  );

  const refetch = appointments.refetch;

  useEffect(() => {
    const socket = getSocket();
    const handler = () => refetch();
    socket.on(SOCKET_EVENTS.APPOINTMENT_UPDATED, handler);
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
    async (appointment: Appointment, nextStatus: AppointmentStatus) => {
      const key = `status-${appointment.id}`;
      setBusy(key);
      setActionError(null);

      try {
        await apiFetch(`/api/appointments/${appointment.id}/status`, {
          method: "PATCH",
          body: { status: nextStatus },
        });
        setMessage(
          `Cita ${appointment.code} actualizada a "${STATUS_LABELS[nextStatus]}".`,
        );
        setPendingAction(null);
        refetch();
      } catch (caught) {
        setActionError(describeApiError(caught));
      } finally {
        setBusy(null);
      }
    },
    [refetch],
  );

  /** Pide confirmación antes de cancelar, marcar inasistencia o finalizar. */
  function requestStatus(appointment: Appointment, action: Action) {
    if (
      action.status === "CANCELLED" ||
      action.status === "NO_SHOW" ||
      action.status === "COMPLETED"
    ) {
      setPendingAction({ appointment, action });
      return;
    }

    void changeStatus(appointment, action.status);
  }

  const assignVet = useCallback(
    async (appointment: Appointment, vetId: string) => {
      const key = `vet-${appointment.id}`;
      setBusy(key);
      setActionError(null);

      try {
        await apiFetch(`/api/appointments/${appointment.id}/vet`, {
          method: "PATCH",
          body: { vetId: vetId ? Number(vetId) : null },
        });
        setMessage(`Veterinario actualizado para la cita ${appointment.code}.`);
        refetch();
      } catch (caught) {
        setActionError(describeApiError(caught));
      } finally {
        setBusy(null);
      }
    },
    [refetch],
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchDraft);
  }

  const hasFilters = status !== "ALL" || date !== "" || search !== "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900">
            Agenda de citas
          </h2>
          <p className="text-sm text-stone-500">
            Confirma, asigna veterinarios y controla el flujo de atención.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="size-4" />
          Actualizar
        </Button>
      </div>

      <Card>
        <div className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Buscar por código, dueño, celular o mascota"
                className="pl-10"
                aria-label="Buscar citas"
              />
            </div>

            <Select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "ALL" | AppointmentStatus)
              }
              aria-label="Filtrar por estado"
              className="lg:w-48"
            >
              <option value="ALL">Todos los estados</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {STATUS_LABELS[option]}
                </option>
              ))}
            </Select>

            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              aria-label="Filtrar por fecha"
              className="lg:w-44"
            />

            <div className="flex gap-2">
              <Button type="submit" size="sm">
                <Search className="size-4" />
                Buscar
              </Button>
              {hasFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatus("ALL");
                    setDate("");
                    setSearch("");
                    setSearchDraft("");
                  }}
                >
                  <X className="size-4" />
                  Limpiar
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      </Card>

      {actionError ? (
        <Alert variant="error" title="No se pudo actualizar la cita">
          {actionError}
        </Alert>
      ) : null}

      {message ? <Alert variant="success">{message}</Alert> : null}

      {appointments.loading ? (
        <LoadingBlock label="Cargando citas..." />
      ) : appointments.error ? (
        <Alert variant="error" title="No pudimos cargar las citas">
          <p>{appointments.error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={refetch}
          >
            Reintentar
          </Button>
        </Alert>
      ) : appointments.data && appointments.data.appointments.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-6" />}
          title="No hay citas con esos filtros"
          description="Prueba con otro estado, fecha o término de búsqueda."
          action={
            hasFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatus("ALL");
                  setDate("");
                  setSearch("");
                  setSearchDraft("");
                }}
              >
                Limpiar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <CardHeader
            title="Citas encontradas"
            description={`${appointments.data?.appointments.length ?? 0} resultado(s)`}
            action={
              <span className="inline-flex items-center gap-1.5 text-xs text-stone-400">
                <ClipboardList className="size-3.5" />
                Se actualiza en vivo
              </span>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-left text-[11px] uppercase tracking-wide text-stone-400">
                  <th className="px-4 py-2.5 font-semibold">Cita</th>
                  <th className="px-4 py-2.5 font-semibold">Mascota / dueño</th>
                  <th className="px-4 py-2.5 font-semibold">Servicio</th>
                  <th className="px-4 py-2.5 font-semibold">Horario</th>
                  <th className="px-4 py-2.5 font-semibold">Estado</th>
                  <th className="px-4 py-2.5 font-semibold">Veterinario</th>
                  <th className="px-4 py-2.5 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {appointments.data?.appointments.map((appointment) => {
                  const actions = ACTIONS[appointment.status];
                  const statusBusy = busy === `status-${appointment.id}`;
                  const vetBusy = busy === `vet-${appointment.id}`;

                  return (
                    <tr key={appointment.id} className="align-top hover:bg-stone-50/50">
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="font-mono text-xs font-semibold text-brand-700">
                          {appointment.code}
                        </p>
                        <p className="mt-0.5 text-[10px] text-stone-400">
                          {formatDateTime(appointment.createdAt)}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <PetAvatar
                            name={appointment.pet.name}
                            species={appointment.pet.species}
                            photoUrl={appointment.pet.photoUrl}
                            size="sm"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="font-medium text-stone-900">
                                {appointment.pet.name}
                              </p>
                              {appointment.priority === "EMERGENCY" ? (
                                <Badge tone="rose">
                                  Emergencia
                                  {appointment.triageSeverity
                                    ? ` · ${TRIAGE_LABELS[appointment.triageSeverity]}`
                                    : ""}
                                </Badge>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-stone-500">
                              {appointment.owner.fullName}
                            </p>
                            <a
                              href={`tel:${appointment.owner.phone}`}
                              className="text-[11px] text-brand-600 hover:underline"
                            >
                              {appointment.owner.phone}
                            </a>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-stone-700">{appointment.service.name}</p>
                        <p className="text-[11px] text-stone-400">
                          {appointment.service.durationMin} min
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="text-stone-700">
                          {formatDateTime(appointment.scheduledAt)}
                        </p>
                        <p className="text-[11px] text-stone-400">
                          {formatTime(appointment.scheduledAt)} hrs
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={appointment.status} />
                        {appointment.queuePosition ? (
                          <p className="mt-1 text-[10px] text-stone-400">
                            Posición #{appointment.queuePosition}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-4 py-3">
                        <Select
                          value={appointment.assignedVet?.id ?? ""}
                          onChange={(event) =>
                            void assignVet(appointment, event.target.value)
                          }
                          disabled={vetBusy}
                          aria-label={`Asignar veterinario a ${appointment.code}`}
                          className="min-w-36 py-1.5 text-xs"
                        >
                          <option value="">Sin asignar</option>
                          {vets.data?.veterinarians.map((vet) => (
                            <option key={vet.id} value={vet.id}>
                              {vet.fullName}
                            </option>
                          ))}
                        </Select>
                      </td>

                      <td className="px-4 py-3">
                        {actions.length === 0 ? (
                          <span className="text-xs text-stone-400">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {actions.map((action) => (
                              <Button
                                key={action.status}
                                size="sm"
                                variant={action.variant}
                                disabled={statusBusy}
                                onClick={() => requestStatus(appointment, action)}
                                className="px-2.5 text-[11px]"
                              >
                                {statusBusy ? (
                                  "..."
                                ) : action.label === "Restaurar" ? (
                                  <>
                                    <RotateCcw className="size-3.5" />
                                    {action.label}
                                  </>
                                ) : (
                                  action.label
                                )}
                              </Button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <p className="flex items-center gap-1.5 text-xs text-stone-400">
        <CalendarDays className="size-3.5" />
        La agenda muestra hasta 100 citas por consulta. Usa los filtros para
        acotar los resultados.
      </p>

      <ConfirmDialog
        open={pendingAction !== null}
        tone={
          pendingAction?.action.status === "CANCELLED" ||
          pendingAction?.action.status === "NO_SHOW"
            ? "danger"
            : "default"
        }
        title={
          pendingAction?.action.status === "CANCELLED"
            ? "¿Cancelar esta cita?"
            : pendingAction?.action.status === "NO_SHOW"
              ? "¿Marcar como inasistencia?"
              : "¿Finalizar la atención?"
        }
        description={
          pendingAction
            ? pendingAction.action.status === "CANCELLED"
              ? `La cita ${pendingAction.appointment.code} de ${pendingAction.appointment.pet.name} quedará cancelada. Si fue un error, podrás restaurarla desde esta misma tabla.`
              : pendingAction.action.status === "NO_SHOW"
                ? `La cita ${pendingAction.appointment.code} de ${pendingAction.appointment.pet.name} quedará marcada como no asistió. Puedes restaurarla luego si la persona llega.`
                : `La consulta de ${pendingAction.appointment.pet.name} se cerrará y saldrá de la sala de espera.`
            : undefined
        }
        confirmLabel={
          pendingAction?.action.status === "CANCELLED"
            ? "Sí, cancelar"
            : pendingAction?.action.status === "NO_SHOW"
              ? "Sí, marcar inasistencia"
              : "Sí, finalizar"
        }
        cancelLabel="Volver"
        busy={pendingAction !== null && busy === `status-${pendingAction.appointment.id}`}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (!pendingAction) return;
          void changeStatus(pendingAction.appointment, pendingAction.action.status);
        }}
      />
    </div>
  );
}
