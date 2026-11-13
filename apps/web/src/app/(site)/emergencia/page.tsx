import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  HeartPulse,
  MapPin,
  MessageCircle,
  Phone,
  ShieldAlert,
  Siren,
  Stethoscope,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { CLINIC } from "@/lib/clinic";
import { EmergencyForm } from "./emergency-form";

export const metadata: Metadata = {
  title: "Emergencia veterinaria",
  description:
    "Triaje rápido para urgencias veterinarias en San Juan de Lurigancho: dificultad para respirar, convulsiones, sangrado o intoxicación. Prioridad en la cola de atención.",
};

const ALARM_SIGNS = [
  {
    title: "Dificultad para respirar",
    text: "Respira con la boca abierta, se ahoga o tiene las encías azuladas.",
  },
  {
    title: "Convulsiones o desmayos",
    text: "Sacudidas, pérdida de conciencia o desorientación repentina.",
  },
  {
    title: "Sangrado abundante",
    text: "Herida que no deja de sangrar o sangre en la orina o el vómito.",
  },
  {
    title: "Intoxicación",
    text: "Ingirió chocolate, uvas, medicamentos, veneno o un objeto peligroso.",
  },
  {
    title: "Golpe o accidente",
    text: "Caída, atropello, mordida o traumatismo en cualquier parte del cuerpo.",
  },
  {
    title: "No puede orinar",
    text: "Esfuerzo sin resultado, sobre todo en gatos machos. Es una urgencia.",
  },
  {
    title: "Vómito o diarrea severa",
    text: "Repetido, con sangre o acompañado de decaimiento extremo.",
  },
  {
    title: "Parto complicado",
    text: "Más de 30 minutos pujando sin nacimiento o cachorro atascado.",
  },
] as const;

const STEPS = [
  {
    icon: Siren,
    title: "Registra el triaje",
    text: "Cuéntanos qué observas y elige la gravedad. Toma menos de un minuto.",
  },
  {
    icon: ShieldAlert,
    title: "Pasa al frente de la cola",
    text: "Tu mascota entra a la sala con prioridad de emergencia y el equipo la ve primero.",
  },
  {
    icon: Stethoscope,
    title: "Sigue el turno en vivo",
    text: "Guarda el código y consulta el estado desde tu celular mientras esperas.",
  },
] as const;

export default function EmergencyPage() {
  return (
    <div className="bg-cream-50">
      {/* Hero de urgencia */}
      <section className="relative overflow-hidden border-b-2 border-forest-900/10 bg-gradient-to-br from-rose-50 via-cream-50 to-cream-100">
        <div
          className="absolute -right-20 top-10 size-80 rounded-full bg-rose-200/50 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-rose-300 bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-rose-700">
              <TriangleAlert className="size-3.5" />
              Urgencia veterinaria
            </span>
            <h1 className="mt-5 max-w-xl text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-forest-950 sm:text-5xl">
              Si tu mascota está en peligro,{" "}
              <span className="text-rose-600">actúa ahora.</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-stone-600 sm:text-lg">
              Haz un triaje rápido y tu mascota pasará al frente de la cola de
              atención. Si el caso es crítico, llámanos mientras vienes a la
              sede de Canto Grande.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={`tel:${CLINIC.phone.replace(/\s/g, "")}`} size="lg">
                <Phone className="size-4" />
                Llamar a la clínica
              </ButtonLink>
              <a
                href={`https://wa.me/${CLINIC.whatsapp}?text=${encodeURIComponent(
                  "Hola ChanlieVet, tengo una emergencia veterinaria. Necesito orientación.",
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 text-base font-semibold text-white transition-colors hover:bg-[#1ebe5b]"
              >
                <MessageCircle className="size-4" />
                WhatsApp de urgencia
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-rose-600" />
                {CLINIC.address} · {CLINIC.district}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5 text-rose-600" />
                Atención dentro del horario
              </span>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-rose-200 bg-white p-5 shadow-xl shadow-rose-900/5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-rose-100 text-rose-600">
                <HeartPulse className="size-6" />
              </span>
              <div>
                <p className="text-sm font-bold text-stone-900">
                  ¿No sabes si es una emergencia?
                </p>
                <p className="text-xs text-stone-500">
                  Ante la duda, escríbenos. Es mejor consultar a tiempo.
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-stone-600">
              {[
                "Atendemos urgencias todos los días dentro del horario.",
                "El triaje no reemplaza una consulta veterinaria.",
                "No administres medicamentos humanos a tu mascota.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rose-500" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-2xl bg-stone-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Horario de atención
              </p>
              <ul className="mt-1 space-y-0.5 text-xs text-stone-600">
                {CLINIC.hours.map((row) => (
                  <li key={row.days} className="flex justify-between gap-3">
                    <span>{row.days}</span>
                    <span className="font-medium text-stone-800">{row.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Señales de alarma */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-600">
              Señales de alarma
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-forest-950 sm:text-3xl">
              Cuándo no esperar a una cita normal
            </h2>
          </div>
          <Badge tone="rose">Atención prioritaria</Badge>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ALARM_SIGNS.map((sign) => (
            <div
              key={sign.title}
              className="rounded-2xl border-2 border-forest-900/10 bg-white p-4 transition-colors hover:border-rose-300"
            >
              <TriangleAlert className="size-5 text-rose-500" />
              <p className="mt-2 text-sm font-bold text-stone-900">{sign.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-500">
                {sign.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Triaje + pasos */}
      <section className="border-y-2 border-forest-900/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
                Triaje en línea
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-forest-950 sm:text-3xl">
                Registra la urgencia y ven a la sede
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                Completar el triaje no reemplaza la evaluación presencial. Sirve
                para que el equipo se prepare y para que tu mascota tenga
                prioridad al llegar.
              </p>

              <ol className="mt-6 space-y-4">
                {STEPS.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <li key={step.title} className="flex gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-stone-900">
                          {index + 1}. {step.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-stone-500">
                          {step.text}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-6 rounded-2xl bg-rose-50 p-4 text-xs leading-relaxed text-rose-800">
                <strong>Si hay riesgo de vida</strong>, no esperes el registro:
                llama al {CLINIC.phone} y dirígete de inmediato a la clínica.
              </div>

              <Link
                href="/seguimiento"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Ya registré una emergencia: ver seguimiento
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <EmergencyForm />
          </div>
        </div>
      </section>
    </div>
  );
}
