import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  HeartPulse,
  MapPin,
  MessageCircle,
  PawPrint,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  Ticket,
  TriangleAlert,
  Wifi,
} from "lucide-react";
import { QueueTeaser } from "@/components/home/queue-teaser";
import { ServicesSection } from "@/components/home/services-section";
import { VeterinariansCarousel } from "@/components/home/veterinarians-carousel";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Testimonials } from "@/components/home/testimonials";
import { SectionHeading } from "@/components/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { CLINIC } from "@/lib/clinic";

const TRUST = [
  {
    icon: Stethoscope,
    title: "Equipo veterinario",
    text: "Diagnóstico claro y trato cercano en cada consulta.",
  },
  {
    icon: Wifi,
    title: "Sala de espera en vivo",
    text: "Consulta tu posición desde el celular, sin filas.",
  },
  {
    icon: ShieldCheck,
    title: "Stock real",
    text: "Los productos de la tienda reflejan el inventario actual.",
  },
  {
    icon: MessageCircle,
    title: "Atención por WhatsApp",
    text: "Coordina pedidos y resuelve dudas antes de venir.",
  },
];

const STEPS = [
  {
    icon: CalendarDays,
    title: "Reserva sin crear cuenta",
    text: "Elige el servicio, la fecha y los datos de tu mascota. Solo necesitamos tu celular para contactarte.",
  },
  {
    icon: Ticket,
    title: "Recibe tu código",
    text: "Al confirmar la cita te damos un código único, por ejemplo CV-7K2M9Q, para hacer seguimiento.",
  },
  {
    icon: HeartPulse,
    title: "Sigue tu turno en vivo",
    text: "Registra tu llegada y observa tu posición en la sala de espera virtual actualizada al instante.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b-2 border-forest-900/10 bg-cream-50">
        <div className="absolute inset-0 bg-grid opacity-70" aria-hidden="true" />
        <div
          className="absolute -left-24 top-24 size-72 rounded-full bg-coral-200/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -right-16 bottom-0 size-72 rounded-full bg-brand-200/40 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24 lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-forest-900/15 bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-forest-900">
              <MapPin className="size-3.5 text-coral-500" />
              Única sede · San Juan de Lurigancho
            </span>

            <h1 className="mt-5 max-w-xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-forest-950 sm:text-5xl lg:text-6xl">
              Cuidamos a tu mascota{" "}
              <span className="text-brand-700">como en casa.</span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-stone-600 sm:text-lg">
              Consultas, vacunas y baños en Canto Grande. Agenda tu cita sin
              registro, guarda tu código y sigue tu turno en tiempo real.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/citas" size="lg">
                <CalendarDays className="size-4" />
                Agendar cita
              </ButtonLink>
              <ButtonLink href="/tienda" variant="outline" size="lg">
                Explorar tienda
                <ArrowRight className="size-4" />
              </ButtonLink>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-600">
              {["Sin registro obligatorio", "Código de seguimiento", "Atención 7 días"].map(
                (item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Check className="size-4 rounded-full bg-coral-100 p-0.5 text-coral-700" />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute -left-3 top-10 hidden rotate-[-6deg] rounded-2xl border-2 border-forest-900/10 bg-white px-4 py-3 shadow-lg shadow-stone-900/5 sm:block">
              <p className="text-[10px] font-bold uppercase tracking-wide text-coral-600">
                Atención cercana
              </p>
              <p className="mt-0.5 text-xs text-stone-500">
                Lun a dom · {CLINIC.district.split(",")[0]}
              </p>
            </div>

            <QueueTeaser />

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border-2 border-forest-900/10 bg-white p-4">
                <Clock className="size-5 text-brand-600" />
                <p className="mt-2 text-sm font-semibold text-stone-900">
                  Honramos tu hora
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  Cita y seguimiento por código
                </p>
              </div>
              <div className="rounded-2xl border-2 border-forest-900/10 bg-white p-4">
                <Sparkles className="size-5 text-coral-500" />
                <p className="mt-2 text-sm font-semibold text-stone-900">
                  Trato sin apuros
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  Explicamos cada indicación
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b-2 border-forest-900/10 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
                    {item.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Emergencias */}
      <section className="border-b-2 border-forest-900/10 bg-rose-50/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-600">
              <Siren className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-stone-900">
                ¿Tu mascota tiene una urgencia?
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-stone-600">
                Haz un triaje rápido y pasa al frente de la cola de atención.
              </p>
            </div>
          </div>
          <ButtonLink href="/emergencia" variant="danger" size="sm">
            <TriangleAlert className="size-4" />
            Triaje de emergencia
          </ButtonLink>
        </div>
      </section>

      <ServicesSection />

      <VeterinariansCarousel />

      <FeaturedProducts />

      <Testimonials />

      {/* Cómo funciona */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <SectionHeading
          align="center"
          eyebrow="Seguimiento"
          title="Agendar es así de simple"
          description="Sin formularios interminables ni cuentas nuevas. En tres pasos ya estás en la cola de atención."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative rounded-2xl border-2 border-forest-900/10 bg-white p-6 shadow-[0_16px_40px_-32px_rgba(18,56,45,0.5)]"
              >
                <span className="absolute right-5 top-5 text-4xl font-black text-cream-200">
                  0{index + 1}
                </span>
                <span className="grid size-11 place-items-center rounded-xl bg-brand-600 text-white">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold text-stone-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-500">
                  {step.text}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-5 text-center text-sm text-stone-600">
          <span>¿Ya tienes una cita?</span>
          <Link
            href="/seguimiento"
            className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800"
          >
            Consulta tu código de seguimiento
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="relative overflow-hidden rounded-[2rem] border-2 border-forest-900/20 bg-forest-950 px-6 py-10 text-white sm:px-10 sm:py-14">
          <div
            className="absolute right-6 top-1/2 hidden -translate-y-1/2 select-none sm:block"
            aria-hidden="true"
          >
            <PawPrint className="size-40 rotate-12 text-white/5" strokeWidth={1.5} />
          </div>
          <div
            className="absolute -left-20 -bottom-24 size-64 rounded-full bg-coral-500/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-coral-300">
              {CLINIC.tagline}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Tu mascota merece una visita tranquila.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-100 sm:text-base">
              Reserva en menos de dos minutos. Si prefieres, escríbenos por
              WhatsApp y con gusto te ayudamos a elegir el servicio.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/citas" variant="outline" size="lg">
                <CalendarDays className="size-4" />
                Agendar ahora
              </ButtonLink>
              <a
                href={`https://wa.me/${CLINIC.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 px-6 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                <MessageCircle className="size-4" />
                Escribir por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
