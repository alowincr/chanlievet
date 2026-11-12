"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogIn, Menu, ShoppingBasket, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { useAuth } from "@/lib/hooks/use-auth";
import { useCart } from "@/lib/hooks/use-cart";
import { NAV_LINKS } from "@/lib/clinic";
import { cn } from "@/lib/cn";

export function SiteHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const panelHref = user?.role === "ADMIN" ? "/admin" : "/veterinario";
  const panelLabel = user?.role === "ADMIN" ? "Panel admin" : "Panel vet";

  return (
    <header className="sticky top-0 z-40 border-b-2 border-forest-900/10 bg-cream-50/95 backdrop-blur">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-3 px-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                isActive(link.href)
                  ? "bg-forest-900 text-cream-50"
                  : "text-stone-600 hover:bg-cream-200/60 hover:text-forest-900",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/carrito"
            className="relative inline-flex size-10 items-center justify-center rounded-full border-2 border-forest-900/10 bg-white text-stone-700 transition-colors hover:border-brand-600/40 hover:text-forest-900"
            aria-label={`Carrito${count > 0 ? `, ${count} productos` : ""}`}
          >
            <ShoppingBasket className="size-5" />
            {ready && count > 0 ? (
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-coral-500 px-1 text-[10px] font-bold leading-5 text-white">
                {count}
              </span>
            ) : null}
          </Link>

          <Link
            href={user ? panelHref : "/login"}
            className="hidden items-center gap-2 rounded-full bg-forest-900 px-4 py-2.5 text-sm font-semibold text-cream-50 transition-colors hover:bg-forest-950 sm:inline-flex"
          >
            <LogIn className="size-4" />
            {user ? panelLabel : "Acceso equipo"}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="inline-flex size-10 items-center justify-center rounded-full border-2 border-forest-900/10 bg-white text-stone-700 hover:border-brand-600/40 lg:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t-2 border-forest-900/10 bg-cream-50 px-4 pb-4 pt-2 lg:hidden">
          <nav className="grid gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-semibold",
                  isActive(link.href)
                    ? "bg-forest-900 text-cream-50"
                    : "text-stone-600 hover:bg-cream-200/60",
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={user ? panelHref : "/login"}
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-xl bg-forest-900 px-3 py-2.5 text-sm font-semibold text-cream-50"
            >
              <LogIn className="size-4" />
              {user ? panelLabel : "Acceso equipo"}
            </Link>
            <p className="px-3 pt-3 text-[11px] leading-relaxed text-stone-400">
              Atendemos en una sola sede: Av. Praderas del Norte 1250, Canto
              Grande, San Juan de Lurigancho.
            </p>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
