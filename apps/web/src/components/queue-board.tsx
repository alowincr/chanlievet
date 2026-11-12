"use client";

import { useState } from "react";
import { Clock, PawPrint, Radio, WifiOff } from "lucide-react";
import { PetAvatar, StaffAvatar } from "@/components/placeholders";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useElapsedMinutes } from "@/lib/hooks/use-elapsed-minutes";
import { SPECIES_LABELS, formatRelative, formatTime } from "@/lib/format";
import type { QueuePatient, QueueSnapshot } from "@/lib/types";
import { cn } from "@/lib/cn";

/** Nombre parcial: la sala pública nunca muestra apellidos completos. */
export function partialName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0] ?? fullName;
  return `${parts[0]} ${parts[1]?.charAt(0) ?? ""}.`;
}

export function formatLimaDateKey(dateKey: string): string {
  const parsed = new Date(`${dateKey}T12:00:00-05:00`);
  if (Number.isNaN(parsed.getTime())) return dateKey;

  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parsed);
}

function InProgressCard({
  patient,
  staffView,
}: {
  patient: QueuePatient;
  staffView: boolean;
}) {
  const minutes = useElapsedMinutes(patient.startedAt);

  return (
    <div className="flex gap-4 rounded-2xl border border-violet-200 bg-white p-4 shadow-sm shadow-violet-900/5">
      <PetAvatar
        name={patient.pet.name}
        species={patient.pet.species}
        photoUrl={patient.pet.photoUrl}
        size="lg"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-stone-900">{patient.pet.name}</p>
          <Badge tone="violet">En atención</Badge>
        </div>
        <p className="mt-0.5 text-xs text-stone-500">
          {SPECIES_LABELS[patient.pet.species]} ·{" "}
          {staffView
            ? patient.owner.fullName
            : partialName(patient.owner.fullName)}{" "}
          · {patient.service.name}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <StaffAvatar
            name={patient.vet?.fullName ?? "Equipo ChanlieVet"}
            avatarUrl={patient.vet?.avatarUrl}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-stone-700">
              {patient.vet?.fullName ?? "Equipo ChanlieVet"}
            </p>
            <p className="text-[11px] text-stone-400">
              Atendiendo hace {minutes} min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaitingRow({
  patient,
  isNext,
  staffView,
}: {
  patient: QueuePatient;
  isNext: boolean;
  staffView: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 transition-colors",
        isNext
          ? "border-brand-300 bg-brand-50/40 shadow-sm shadow-brand-900/5"
          : "border-stone-200",
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold",
          isNext ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-500",
        )}
      >
        {patient.position ?? "—"}
      </span>

      <PetAvatar
        name={patient.pet.name}
        species={patient.pet.species}
        photoUrl={patient.pet.photoUrl}
        size="sm"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-semibold text-stone-900">
            {patient.pet.name}
          </p>
          {isNext ? <Badge tone="brand">Siguiente</Badge> : null}
        </div>
        <p className="truncate text-[11px] text-stone-500">
          {SPECIES_LABELS[patient.pet.species]} ·{" "}
          {staffView
            ? patient.owner.fullName
            : partialName(patient.owner.fullName)}{" "}
          · {patient.service.name}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-xs font-medium text-stone-700">
          {formatTime(patient.scheduledAt)}
        </p>
        <p className="text-[10px] text-stone-400">
          {patient.checkedInAt
            ? `Llegó ${formatRelative(patient.checkedInAt)}`
            : "En sala"}
        </p>
      </div>
    </li>
  );
}

/**
 * Tablero de sala de espera reutilizable.
 * Se usa en la página pública y dentro del panel veterinario, para que el
 * equipo no tenga que salir de su panel para ver la sala.
 */
export function QueueBoard({
  snapshot,
  connected,
  error,
  staffView = false,
}: {
  snapshot: QueueSnapshot | null;
  connected: boolean;
  error: string | null;
  staffView?: boolean;
}) {
  const [showPrivacy, setShowPrivacy] = useState(false);

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        {error}
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white px-4 py-10 text-center text-sm text-stone-500">
        Conectando con la sala de espera...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
          <CalendarDate dateKey={snapshot.date} />
          <span className="text-stone-300">·</span>
          <span>Hora de Lima</span>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
            connected
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700",
          )}
        >
          <span
            className={cn(
              "size-2 rounded-full",
              connected ? "animate-pulse bg-emerald-500" : "bg-amber-500",
            )}
          />
          {connected ? "En vivo" : "Reconectando..."}
        </span>
      </div>

      {!connected ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <WifiOff className="size-4 shrink-0" />
          La conexión en vivo se está recuperando. Los datos pueden demorar unos
          segundos en actualizarse.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            En espera
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-stone-900">
            {snapshot.waitingCount}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            En atención
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-stone-900">
            {snapshot.inProgressCount}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Última actualización
          </p>
          <p className="mt-1 text-sm font-semibold text-stone-800">
            {formatRelative(snapshot.updatedAt)}
          </p>
          <p className="text-[11px] text-stone-400">
            Se refresca con cada cambio de estado
          </p>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight text-stone-900">
            En atención ahora
          </h2>
          <Badge tone="violet">{snapshot.inProgressCount} paciente(s)</Badge>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {snapshot.inProgress.length === 0 ? (
            <div className="sm:col-span-2">
              <EmptyState
                icon={<PawPrint className="size-6" />}
                title="Ningún paciente en atención"
                description="En cuanto el veterinario inicie una consulta aparecerá aquí."
              />
            </div>
          ) : (
            snapshot.inProgress.map((patient) => (
              <InProgressCard
                key={patient.appointmentId}
                patient={patient}
                staffView={staffView}
              />
            ))
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight text-stone-900">
            Fila de espera
          </h2>
          <Badge tone="brand">{snapshot.waitingCount} en cola</Badge>
        </div>

        {snapshot.waiting.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={<Clock className="size-6" />}
              title="La fila está vacía"
              description="Si ya registraste tu llegada, en breve aparecerás en la cola."
            />
          </div>
        ) : (
          <ol className="mt-3 space-y-2">
            {snapshot.waiting.map((patient, index) => (
              <WaitingRow
                key={patient.appointmentId}
                patient={patient}
                isNext={index === 0}
                staffView={staffView}
              />
            ))}
          </ol>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-500">
        <span className="inline-flex items-center gap-1.5">
          <Radio className="size-3.5 text-brand-600" />
          Solo mostramos las citas de hoy.{" "}
          {staffView
            ? "Vista de personal: nombres completos."
            : "Los nombres son parciales por privacidad."}
        </span>
        {staffView ? null : (
          <button
            type="button"
            onClick={() => setShowPrivacy((current) => !current)}
            className="font-semibold text-brand-700 hover:text-brand-800"
          >
            {showPrivacy ? "Ocultar detalle" : "¿Qué datos se muestran?"}
          </button>
        )}
      </div>

      {showPrivacy && !staffView ? (
        <p className="rounded-xl bg-white px-4 py-3 text-[11px] leading-relaxed text-stone-500">
          La sala pública muestra el nombre de la mascota, el primer nombre y la
          inicial del apellido del dueño, el servicio y los tiempos de llegada.
          No expone celulares, correos ni el código de seguimiento. El equipo de
          la clínica ve la información completa dentro de su panel privado.
        </p>
      ) : null}
    </div>
  );
}

function CalendarDate({ dateKey }: { dateKey: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-stone-600">
      <Clock className="size-3.5 text-brand-600" />
      Cola del {formatLimaDateKey(dateKey)}
    </span>
  );
}
