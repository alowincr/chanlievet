import Link from "next/link";
import { ArrowLeft, PawPrint, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-brand-50 via-white to-white px-4">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-900/20">
          <PawPrint className="size-8" />
        </span>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-brand-600">
          Error 404
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
          Esta página se perdió como un gato curioso
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          No encontramos lo que buscabas. Vuelve al inicio o revisa nuestra
          tienda y agenda de citas.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <ArrowLeft className="size-4" />
            Volver al inicio
          </Link>
          <Link
            href="/tienda"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-stone-300 px-5 text-sm font-semibold text-stone-700 transition-colors hover:border-brand-400 hover:text-brand-700"
          >
            <SearchX className="size-4" />
            Ir a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
