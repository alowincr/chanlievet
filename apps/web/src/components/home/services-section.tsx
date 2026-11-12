"use client";

import Link from "next/link";
import {
  HeartPulse,
  Scissors,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/spinner";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import { formatCurrency } from "@/lib/format";
import type { Service } from "@/lib/types";

const ICONS = [Stethoscope, Syringe, ShieldCheck, Scissors, HeartPulse, Sparkles];

const TONES = [
  "bg-brand-100 text-brand-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
];

export function ServicesSection() {
  const { data, loading, error, refetch } = useApiQuery<{
    services: Service[];
  }>("/api/services");

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <SectionHeading
        eyebrow="Servicios"
        title="Todo lo que tu mascota necesita, en un solo lugar"
        description="Atención clínica, preventiva y estética con un equipo que te explica cada paso con claridad."
        action={
          <ButtonLink href="/citas" variant="outline" size="sm">
            Agendar cita
          </ButtonLink>
        }
      />

      {error ? (
        <Alert variant="error" className="mt-6" title="No pudimos cargar los servicios">
          <button type="button" onClick={refetch} className="font-semibold underline">
            Reintentar
          </button>
        </Alert>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-48 rounded-2xl" />
            ))
          : data?.services.map((service, index) => {
              const Icon = ICONS[index % ICONS.length];
              const tone = TONES[index % TONES.length];

              return (
                <Link
                  key={service.id}
                  href={`/citas?servicio=${service.slug}`}
                  className="group flex flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
                >
                  <span
                    className={`grid size-11 place-items-center rounded-xl ${tone}`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-stone-900 group-hover:text-brand-700">
                    {service.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm leading-relaxed text-stone-500">
                    {service.description ??
                      "Atención personalizada con seguimiento veterinario."}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-sm">
                    <span className="font-semibold text-stone-900">
                      {formatCurrency(service.price)}
                    </span>
                    <span className="text-xs text-stone-500">
                      {service.durationMin} min
                    </span>
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
