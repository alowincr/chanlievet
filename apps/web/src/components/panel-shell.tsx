"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Package,
  PawPrint,
  Radio,
  Stethoscope,
  UserCog,
  UsersRound,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Spinner } from "@/components/ui/spinner";
import { StaffAvatar } from "@/components/placeholders";
import { useAuth } from "@/lib/hooks/use-auth";
import { cn } from "@/lib/cn";

const ADMIN_NAV = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/citas", label: "Citas", icon: ClipboardList },
  { href: "/admin/pacientes", label: "Pacientes", icon: UsersRound },
  { href: "/admin/personal", label: "Personal", icon: UserCog },
  { href: "/admin/productos", label: "Productos", icon: Package },
];

const VET_NAV = [
  { href: "/veterinario", label: "Cola de atención", icon: Stethoscope },
  { href: "/veterinario/sala", label: "Sala en vivo", icon: Radio },
];

export function PanelShell({
  panel,
  title,
  subtitle,
  children,
}: {
  panel: "admin" | "vet";
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const authorized =
    Boolean(user) && (panel === "admin" ? user?.role === "ADMIN" : true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (panel === "admin" && user.role !== "ADMIN") {
      router.replace("/veterinario");
    }
  }, [loading, user, router, pathname, panel]);

  if (loading || !authorized || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-stone-100">
        <div className="flex flex-col items-center gap-3 text-sm text-stone-500">
          <Spinner className="size-7" />
          Verificando acceso...
        </div>
      </div>
    );
  }

  const nav = panel === "admin" ? ADMIN_NAV : VET_NAV;
  const isActive = (href: string) =>
    href === "/admin" || href === "/veterinario"
      ? pathname === href
      : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-stone-100/80">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-forest-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-cream-50"
      >
        Saltar al contenido
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-stone-200 bg-white md:flex">
        <div className="border-b border-stone-100 px-5 py-5">
          <Logo />
        </div>

        <nav className="flex-1 space-y-1 p-3">
          <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
            {panel === "admin" ? "Administración" : "Atención clínica"}
          </p>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-brand-50 text-brand-700"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}

          {panel === "admin" ? (
            <Link
              href="/veterinario"
              className="mt-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
            >
              <Stethoscope className="size-4" />
              Vista veterinario
            </Link>
          ) : user.role === "ADMIN" ? (
            <Link
              href="/admin"
              className="mt-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
            >
              <LayoutDashboard className="size-4" />
              Panel admin
            </Link>
          ) : null}

          <Link
            href="/"
            className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            <ExternalLink className="size-4" />
            Ver sitio público
          </Link>
        </nav>

        <div className="border-t border-stone-100 p-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-stone-50 px-3 py-2.5">
            <StaffAvatar name={user.fullName} avatarUrl={user.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-800">
                {user.fullName}
              </p>
              <p className="truncate text-[11px] text-stone-500">
                {user.role === "ADMIN" ? "Administradora" : "Veterinario/a"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="rounded-full p-2 text-stone-400 transition-colors hover:bg-white hover:text-rose-600"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 md:hidden">
                <PawPrint className="size-4 text-brand-600" />
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                  ChanlieVet
                </span>
              </div>
              <h1 className="truncate text-lg font-bold tracking-tight text-stone-900 sm:text-xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="truncate text-xs text-stone-500">{subtitle}</p>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white px-2 py-1 sm:flex">
                <StaffAvatar
                  name={user.fullName}
                  avatarUrl={user.avatarUrl}
                  size="sm"
                />
                <span className="max-w-32 truncate text-xs font-medium text-stone-600">
                  {user.fullName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 transition-colors hover:border-rose-200 hover:text-rose-600"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                    isActive(item.href)
                      ? "bg-brand-50 text-brand-700"
                      : "bg-stone-100 text-stone-600",
                  )}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main
          id="contenido"
          className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
