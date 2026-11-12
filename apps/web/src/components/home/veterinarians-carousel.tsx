"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Pause, Play, Stethoscope } from "lucide-react";
import { StaffAvatar } from "@/components/placeholders";
import { SectionHeading } from "@/components/section-heading";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import type { PublicVeterinarian } from "@/lib/types";

function VeterinarianCard({ vet }: { vet: PublicVeterinarian }) {
  return (
    <article className="group flex w-[280px] shrink-0 flex-col rounded-[1.75rem] border-2 border-forest-900/10 bg-cream-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-600/40 hover:shadow-[0_18px_40px_-28px_rgba(18,56,45,0.65)] sm:w-[320px]">
      <div className="flex items-center gap-3">
        <StaffAvatar
          name={vet.fullName}
          avatarUrl={vet.avatarUrl}
          size="lg"
          className="ring-4 ring-white"
        />
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold tracking-tight text-stone-900">
            {vet.fullName}
          </h3>
          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-coral-600">
            <Stethoscope className="size-3.5" />
            {vet.specialty ?? "Equipo veterinario"}
          </p>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-stone-600">
        {vet.bio ??
          "Parte del equipo de ChanlieVet, acompañando a cada familia en el cuidado de su mascota."}
      </p>

      <Link
        href="/citas"
        className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 transition-colors hover:text-brand-900"
      >
        Agendar con el equipo
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </article>
  );
}

export function VeterinariansCarousel() {
  const [paused, setPaused] = useState(false);
  const { data, loading } = useApiQuery<{ veterinarians: PublicVeterinarian[] }>(
    "/api/staff/veterinarians/public",
  );

  const vets = data?.veterinarians ?? [];

  if (!loading && vets.length === 0) return null;

  // Repetimos lo suficiente para que el bucle no deje huecos en pantallas
  // anchas. El track contiene dos copias exactas y se desplaza al 50 %.
  const repeats = vets.length > 0 ? Math.max(2, Math.ceil(6 / vets.length)) : 0;
  const group = vets.flatMap((vet) =>
    Array.from({ length: repeats }, () => vet),
  );

  return (
    <section className="overflow-hidden border-y-2 border-forest-900/10 bg-cream-100/70 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="El equipo"
          title="Quienes van a cuidar de tu mascota"
          description="Veterinarios con especialidades distintas, un mismo trato: sin apuros y con explicaciones claras."
          action={
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              aria-pressed={paused}
              className="hidden items-center gap-2 rounded-full border-2 border-forest-900/15 bg-white px-4 py-2 text-xs font-bold text-forest-900 transition-colors hover:border-brand-600 hover:text-brand-700 motion-safe:inline-flex"
            >
              {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              {paused ? "Reanudar" : "Pausar movimiento"}
            </button>
          }
        />
      </div>

      {loading ? (
        <div className="mx-auto mt-10 flex max-w-6xl gap-4 overflow-hidden px-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-56 w-[280px] shrink-0 animate-pulse rounded-[1.75rem] border border-stone-200 bg-white/70 sm:w-[320px]"
            />
          ))}
        </div>
      ) : (
        <div className="marquee relative mt-10 overflow-hidden px-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-cream-100 to-transparent sm:w-24" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-cream-100 to-transparent sm:w-24" />

          {/*
            Cada tarjeta lleva su propio margen derecho en lugar de `gap`.
            Así el ancho del track es exactamente N × (tarjeta + margen) y
            desplazarlo al 50 % cae justo donde empieza la segunda copia:
            el bucle no salta ni deja un hueco al reiniciar.
          */}
          <div
            className="animate-marquee flex w-max hover:[animation-play-state:paused]"
            style={{ animationPlayState: paused ? "paused" : undefined }}
          >
            {[...group, ...group].map((vet, position) => (
              <div
                key={`${vet.id}-${position}`}
                className="pr-4"
                aria-hidden={position >= group.length}
                inert={position >= group.length}
              >
                <VeterinarianCard vet={vet} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto mt-8 flex max-w-6xl justify-center px-4">
        <Link
          href="/citas"
          className="inline-flex items-center gap-2 rounded-full border-2 border-forest-900/15 bg-white px-5 py-2.5 text-sm font-bold text-forest-900 transition-colors hover:border-brand-600 hover:text-brand-700"
        >
          Reservar una consulta
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
