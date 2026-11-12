"use client";

import { ArrowLeft, Radio } from "lucide-react";
import Link from "next/link";
import { QueueBoard } from "@/components/queue-board";
import { ButtonLink } from "@/components/ui/button";
import { useStaffQueue } from "@/lib/hooks/use-staff-queue";

export default function VetWaitingRoomPage() {
  const { snapshot, connected, error } = useStaffQueue();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <Radio className="size-3.5" />
            Sala en vivo
          </span>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-stone-900">
            Sala de espera del equipo
          </h2>
          <p className="text-sm text-stone-500">
            La misma sala pública, con nombres completos para el personal.
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/veterinario" size="sm" variant="outline">
            <ArrowLeft className="size-4" />
            Volver a la cola
          </ButtonLink>
          <Link
            href="/sala-espera"
            target="_blank"
            className="inline-flex h-9 items-center rounded-full border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition-colors hover:border-brand-400 hover:text-brand-700"
          >
            Ver sala pública
          </Link>
        </div>
      </div>

      <QueueBoard
        snapshot={snapshot}
        connected={connected}
        error={error}
        staffView
      />
    </div>
  );
}
