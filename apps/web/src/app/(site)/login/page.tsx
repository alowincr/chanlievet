"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/hooks/use-auth";
import { describeApiError } from "@/lib/api";

function safeNext(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;

    const next = safeNext(new URLSearchParams(window.location.search).get("next"));
    router.replace(next ?? (user.role === "ADMIN" ? "/admin" : "/veterinario"));
  }, [user, loading, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const currentUser = await login(email.trim(), password);
      const next = safeNext(
        new URLSearchParams(window.location.search).get("next"),
      );
      router.replace(
        next ?? (currentUser.role === "ADMIN" ? "/admin" : "/veterinario"),
      );
    } catch (caught) {
      setError(describeApiError(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-2 lg:items-stretch lg:py-16">
      <div className="relative hidden overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-8 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-dots opacity-20" aria-hidden="true" />
        <div className="relative">
          <Logo light href="/" />
        </div>

        <div className="relative mt-auto">
          <ShieldCheck className="size-10 text-brand-200" />
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight">
            Acceso para el equipo de ChanlieVet
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-brand-100">
            Gestiona citas, inventario y la cola de atención desde un solo
            lugar. Las pantallas de recepción y veterinarios se actualizan en
            tiempo real.
          </p>

          <ul className="mt-6 space-y-2 text-sm text-brand-100">
            <li className="flex items-center gap-2">
              <Stethoscope className="size-4" />
              Estados de atención en vivo
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Control de stock y productos
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4" />
              Seguimiento de citas sin registro
            </li>
          </ul>
        </div>

        <p className="relative mt-8 text-[11px] text-brand-200/70">
          Acceso exclusivo para personal autorizado.
        </p>
      </div>

      <div className="flex flex-col justify-center rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="lg:hidden">
          <Logo href="/" />
        </div>

        <div className="mt-6 lg:mt-0">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            Iniciar sesión
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Ingresa con las credenciales de tu cuenta de staff.
          </p>
        </div>

        {loading ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-stone-500">
            <Spinner /> Verificando sesión...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Correo electrónico" htmlFor="email" required>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@chanlievet.pe"
                  className="pl-10"
                  autoComplete="email"
                  required
                />
              </div>
            </Field>

            <Field label="Contraseña" htmlFor="password" required>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Tu contraseña"
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </Field>

            {error ? <Alert variant="error">{error}</Alert> : null}

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Ingresando..." : "Ingresar al panel"}
            </Button>
          </form>
        )}

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-brand-700"
        >
          <ArrowLeft className="size-4" />
          Volver al sitio público
        </Link>
      </div>
    </div>
  );
}
