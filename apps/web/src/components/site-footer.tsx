import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Logo } from "@/components/logo";
import { CLINIC, NAV_LINKS } from "@/lib/clinic";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t-4 border-coral-500 bg-forest-950 text-stone-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo light />
          <p className="max-w-xs text-sm leading-relaxed text-stone-400">
            Atención veterinaria cercana y transparente en San Juan de
            Lurigancho. Consultas, vacunas, baños y una tienda pensada para el
            cuidado diario de tu mascota.
          </p>

          <div className="rounded-2xl border border-cream-200/15 bg-white/5 p-3">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-coral-300">
              <MapPin className="size-3.5" />
              Única sede
            </p>
            <p className="mt-1 text-xs leading-relaxed text-stone-300">
              {CLINIC.address}
              <br />
              {CLINIC.district}
            </p>
          </div>

          <a
            href={`https://wa.me/${CLINIC.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5b]"
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </a>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cream-100">
            Enlaces
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-stone-400 transition-colors hover:text-coral-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/login"
                className="text-stone-400 transition-colors hover:text-coral-300"
              >
                Acceso equipo
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cream-100">
            Horario de atención
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            {CLINIC.hours.map((item) => (
              <li key={item.days} className="flex gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-coral-400" />
                <span>
                  <span className="block text-cream-100">{item.days}</span>
                  <span className="text-stone-400">{item.time}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cream-100">
            Contacto
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-stone-400">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-coral-400" />
              <span>
                {CLINIC.address}
                <br />
                {CLINIC.district}
              </span>
            </li>
            <li>
              <a
                href={`tel:${CLINIC.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2 transition-colors hover:text-coral-300"
              >
                <Phone className="size-4 shrink-0 text-coral-400" />
                {CLINIC.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${CLINIC.email}`}
                className="flex items-center gap-2 transition-colors hover:text-coral-300"
              >
                <Mail className="size-4 shrink-0 text-coral-400" />
                {CLINIC.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {CLINIC.name}. Todos los derechos
            reservados.
          </p>
          <p>{CLINIC.emergencyNote} · Hecho con cariño en Lima, Perú.</p>
        </div>
      </div>
    </footer>
  );
}
