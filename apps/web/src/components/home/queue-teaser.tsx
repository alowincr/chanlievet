"use client";

import Link from "next/link";
import { ArrowRight, PawPrint } from "lucide-react";
import { useLiveQueue } from "@/lib/hooks/use-live-queue";
import { cn } from "@/lib/cn";

export function QueueTeaser() {
  const { snapshot, connected } = useLiveQueue();

  const current = snapshot?.inProgress[0] ?? null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-6 text-white shadow-xl shadow-brand-950/20">
      <PawPrint className="absolute -right-4 -top-4 size-28 rotate-12 text-white/5" />

      <div className="relative flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-100">
          <span
            className={cn(
              "size-2 rounded-full",
              connected ? "animate-pulse bg-emerald-300" : "bg-stone-400",
            )}
          />
          Sala de espera en vivo
        </span>
        <span className="text-[10px] font-medium text-brand-200/70">
          {connected ? "Conectado" : "Reconectando..."}
        </span>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
          <p className="text-3xl font-bold tabular-nums">
            {snapshot ? snapshot.waitingCount : "—"}
          </p>
          <p className="mt-0.5 text-xs text-brand-100">pacientes en espera</p>
        </div>
        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
          <p className="text-3xl font-bold tabular-nums">
            {snapshot ? snapshot.inProgressCount : "—"}
          </p>
          <p className="mt-0.5 text-xs text-brand-100">en atención ahora</p>
        </div>
      </div>

      <div className="relative mt-4 rounded-2xl border border-white/10 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-200/80">
          Atendiendo ahora
        </p>
        <p className="mt-0.5 truncate text-sm font-medium">
          {current
            ? `${current.pet.name} · ${current.service.name}`
            : "Ningún paciente en atención"}
        </p>
      </div>

      <Link
        href="/sala-espera"
        className="relative mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-100 transition-colors hover:text-white"
      >
        Ver la sala completa
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
