"use client";

import { useEffect, useState } from "react";
import {
  BedDouble,
  Bone,
  Droplets,
  Expand,
  Package,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

const CATEGORY_STYLES: Record<
  string,
  { gradient: string; icon: typeof Bone }
> = {
  alimentos: {
    gradient: "from-amber-100 via-orange-50 to-white text-amber-500",
    icon: Bone,
  },
  "camas-y-descanso": {
    gradient: "from-sky-100 via-indigo-50 to-white text-sky-500",
    icon: BedDouble,
  },
  desparasitantes: {
    gradient: "from-emerald-100 via-teal-50 to-white text-emerald-500",
    icon: ShieldCheck,
  },
  "higiene-y-cuidado": {
    gradient: "from-cyan-100 via-sky-50 to-white text-cyan-500",
    icon: Droplets,
  },
  "juguetes-y-accesorios": {
    gradient: "from-fuchsia-100 via-rose-50 to-white text-fuchsia-500",
    icon: Sparkles,
  },
};

export function ProductImage({
  name,
  categorySlug,
  imageUrl,
  className,
  iconClassName,
  showLabel = true,
  zoomable = false,
  priority = false,
}: {
  name: string;
  categorySlug: string;
  imageUrl?: string | null;
  className?: string;
  iconClassName?: string;
  showLabel?: boolean;
  /** Permite abrir la imagen en grande con un clic. */
  zoomable?: boolean;
  /** Carga la imagen de inmediato (útil para la ficha principal). */
  priority?: boolean;
}) {
  const style = CATEGORY_STYLES[categorySlug] ?? {
    gradient: "from-brand-100 via-brand-50 to-white text-brand-500",
    icon: Package,
  };
  const Icon = style.icon;
  const [failed, setFailed] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    setFailed(false);
    setZoomOpen(false);
  }, [imageUrl]);

  useEffect(() => {
    if (!zoomOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [zoomOpen]);

  const hasImage = Boolean(imageUrl) && !failed;
  const canZoom = zoomable && hasImage;

  const content = (
    <>
      {hasImage ? (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-br from-stone-50 via-white to-stone-100"
          />
          <img
            src={imageUrl ?? ""}
            alt={name}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            referrerPolicy="no-referrer"
            draggable={false}
            onError={() => setFailed(true)}
            className="relative z-[1] size-full object-contain p-[7%] transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        </>
      ) : (
        <>
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              style.gradient,
            )}
          />
          <div
            aria-hidden="true"
            className="absolute -right-6 -top-6 size-24 rounded-full bg-white/40 blur-xl"
          />
          <div className="relative flex flex-col items-center gap-2 px-2 text-center">
            <Icon className={cn("size-14 drop-shadow-sm", iconClassName)} />
            {showLabel ? (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                {imageUrl ? "Imagen no disponible" : "Foto próximamente"}
              </span>
            ) : null}
          </div>
        </>
      )}

      {canZoom ? (
        <span className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-[10px] font-semibold text-stone-600 shadow-sm ring-1 ring-stone-200 transition-colors group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600">
          <Expand className="size-3" />
          Ampliar
        </span>
      ) : null}
    </>
  );

  return (
    <>
      {canZoom ? (
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-label={`Ampliar imagen de ${name}`}
          className={cn(
            "group relative flex cursor-zoom-in items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200/80 transition-shadow hover:shadow-lg hover:shadow-stone-900/10",
            className,
          )}
        >
          {content}
        </button>
      ) : (
        <div
          role={hasImage ? undefined : "img"}
          aria-label={hasImage ? undefined : `Imagen de ${name}`}
          className={cn(
            "group relative flex items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200/80",
            !hasImage && "bg-transparent",
            className,
          )}
        >
          {content}
        </div>
      )}

      {zoomOpen && imageUrl ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen ampliada de ${name}`}
          onClick={() => setZoomOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/25 transition-colors hover:bg-white/20"
            aria-label="Cerrar imagen ampliada"
          >
            <X className="size-5" />
          </button>

          <div
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex min-h-0 flex-1 items-center justify-center bg-stone-50 p-3 sm:p-6">
              <img
                src={imageUrl}
                alt={name}
                referrerPolicy="no-referrer"
                draggable={false}
                onError={() => {
                  setFailed(true);
                  setZoomOpen(false);
                }}
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-4 py-3">
              <p className="min-w-0 truncate text-sm font-semibold text-stone-800">
                {name}
              </p>
              <p className="shrink-0 text-[11px] text-stone-400">
                Imagen referencial
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
