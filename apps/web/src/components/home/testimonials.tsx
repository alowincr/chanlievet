"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { cn } from "@/lib/cn";

const TESTIMONIALS = [
  {
    name: "María Fernanda Quispe",
    pet: "Luna",
    zone: "Canto Grande",
    text: "Llegué con Luna por una infección y nos atendieron el mismo día. Me explicaron el tratamiento sin apuro y me mandaron el resumen por WhatsApp. La sala en vivo me salvó de esperar de pie con la gata estresada.",
  },
  {
    name: "Jorge Luis Ramírez",
    pet: "Rocky",
    zone: "Bayóvar",
    text: "Reservé desde el celular sin crear cuenta y en dos minutos ya tenía mi código. Cuando llegué sabía exactamente en qué puesto estaba. Rocky salió bañado, peinado y tranquilo.",
  },
  {
    name: "Carmen Rosa Flores",
    pet: "Michi",
    zone: "Zárate",
    text: "La doctora se dio cuenta de algo en los dientes de Michi que yo no había notado. Volvimos a los quince días y todo iba mucho mejor. Se nota que quieren de verdad a los animales.",
  },
  {
    name: "Luis Alberto Chávez",
    pet: "Nala",
    zone: "Campoy",
    text: "Compré su alimento en la tienda y el stock era real: me confirmaron por WhatsApp antes de que fuera. Nada de pagar y esperar a que el producto aparezca.",
  },
  {
    name: "Andrea Salazar",
    pet: "Toby",
    zone: "San Carlos",
    text: "Me gustó que no me vendieran mil cosas. Nos dieron lo justo, con el precio claro desde el inicio, y Toby ya está corriendo otra vez como si nada.",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

export function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(media.matches);
    const listener = (event: MediaQueryListEvent) => setReduceMotion(event.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      const total = TESTIMONIALS.length;
      const next = (index + total) % total;
      const card = track.children[next] as HTMLElement | undefined;
      if (!card) return;
      track.scrollTo({
        left: card.offsetLeft - track.offsetLeft,
        behavior: reduceMotion ? "auto" : "smooth",
      });
      setActive(next);
    },
    [reduceMotion],
  );

  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const children = Array.from(track.children) as HTMLElement[];
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    children.forEach((child, index) => {
      const distance = Math.abs(
        child.offsetLeft - track.offsetLeft - track.scrollLeft,
      );
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    setActive(bestIndex);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion) return;
    const timer = window.setInterval(() => {
      scrollToIndex(active + 1);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [active, paused, reduceMotion, scrollToIndex]);

  return (
    <section
      className="border-y border-stone-100 bg-white py-16 sm:py-20"
      aria-label="Testimonios de clientes"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Testimonios"
            title="Familias que ya confían en nosotros"
            description="Historias reales de pacientes y tutores del distrito. Desliza, usa las flechas o deja que el carrusel avance solo."
          />
          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
            <span className="font-display text-3xl font-extrabold leading-none text-stone-900">
              4.9
            </span>
            <div>
              <div
                className="flex gap-0.5 text-amber-500"
                role="img"
                aria-label="Calificación promedio de 4.9 de 5"
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="size-3.5 fill-current" />
                ))}
              </div>
              <p className="mt-1 text-xs text-stone-500">
                +1 200 atenciones este año
              </p>
            </div>
          </div>
        </div>

        <div
          className="relative mt-8"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div
            ref={trackRef}
            role="region"
            aria-roledescription="carrusel"
            aria-label="Testimonios de clientes"
            tabIndex={0}
            onScroll={handleScroll}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                scrollToIndex(active + 1);
              }
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                scrollToIndex(active - 1);
              }
            }}
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-4"
          >
            {TESTIMONIALS.map((testimonial, index) => (
              <article
                key={testimonial.name}
                aria-roledescription="diapositiva"
                aria-label={`${index + 1} de ${TESTIMONIALS.length}`}
                className="flex w-[86%] shrink-0 snap-start flex-col rounded-3xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-900/5 transition-colors hover:border-brand-200 sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className="flex gap-0.5 text-amber-500"
                    role="img"
                    aria-label="5 de 5 estrellas"
                  >
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star key={starIndex} className="size-4 fill-current" />
                    ))}
                  </div>
                  <Quote className="size-8 shrink-0 text-brand-100" aria-hidden="true" />
                </div>

                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-stone-600">
                  “{testimonial.text}”
                </blockquote>

                <footer className="mt-5 flex items-center gap-3 border-t border-stone-100 pt-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
                    {initials(testimonial.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-900">
                      {testimonial.name}
                    </p>
                    <p className="truncate text-xs text-stone-500">
                      {testimonial.pet} · {testimonial.zone}
                    </p>
                  </div>
                </footer>
              </article>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              {TESTIMONIALS.map((testimonial, index) => (
                <button
                  key={testimonial.name}
                  type="button"
                  onClick={() => scrollToIndex(index)}
                  aria-label={`Ir al testimonio de ${testimonial.name}`}
                  aria-current={active === index}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
                    active === index
                      ? "w-7 bg-brand-600"
                      : "w-2 bg-stone-300 hover:bg-stone-400",
                  )}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => scrollToIndex(active - 1)}
                aria-label="Testimonio anterior"
                className="grid size-10 place-items-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollToIndex(active + 1)}
                aria-label="Siguiente testimonio"
                className="grid size-10 place-items-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:border-brand-300 hover:text-brand-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
