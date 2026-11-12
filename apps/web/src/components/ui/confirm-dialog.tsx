"use client";

import { TriangleAlert, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Diálogo de confirmación para acciones que no se pueden deshacer con un
 * clic (cancelar una cita, marcar inasistencia, finalizar una atención).
 * Siempre ofrece una salida clara: "Volver".
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Sí, continuar",
  cancelLabel = "Volver",
  tone = "default",
  busy = false,
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-stone-950/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-2xl",
              tone === "danger"
                ? "bg-rose-50 text-rose-600"
                : "bg-amber-50 text-amber-600",
            )}
          >
            <TriangleAlert className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="confirm-dialog-title"
              className="text-lg font-bold tracking-tight text-stone-900"
            >
              {title}
            </h2>
            {description ? (
              <div className="mt-1.5 text-sm leading-relaxed text-stone-500">
                {description}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>

        {children ? <div className="mt-4">{children}</div> : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Guardando..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
