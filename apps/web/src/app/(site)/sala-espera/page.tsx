"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { CalendarDays, Radio, Ticket } from "lucide-react";
import { QueueBoard } from "@/components/queue-board";
import { useLiveQueue } from "@/lib/hooks/use-live-queue";
import { CLINIC } from "@/lib/clinic";

export default function WaitingRoomPage() {
  const { snapshot, connected, error } = useLiveQueue();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          <Radio className="size-3.5" />
          Actualización en tiempo real
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Sala de espera virtual
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-500 sm:text-base">
          Consulta cuántos pacientes están en espera y quién está en atención
          ahora. Solo verás las citas de hoy; la pantalla se actualiza
          automáticamente.
        </p>
      </div>

      <div className="mt-6">
        <QueueBoard snapshot={snapshot} connected={connected} error={error} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-5 py-4">
        <div className="flex items-start gap-2 text-xs leading-relaxed text-stone-500">
          <Ticket className="mt-0.5 size-4 shrink-0 text-brand-600" />
          <span>
            Si ya tienes una cita, registra tu llegada desde el seguimiento para
            entrar a la fila.
          </span>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/seguimiento" size="sm" variant="outline">
            <Ticket className="size-4" />
            Mi seguimiento
          </ButtonLink>
          <ButtonLink href="/citas" size="sm">
            <CalendarDays className="size-4" />
            Agendar cita
          </ButtonLink>
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-stone-400">
        ¿Tienes una emergencia? Llámanos al{" "}
        <Link href={`tel:${CLINIC.phone.replace(/\s/g, "")}`} className="font-semibold text-brand-700">
          {CLINIC.phone}
        </Link>
        .
      </p>
    </div>
  );
}
