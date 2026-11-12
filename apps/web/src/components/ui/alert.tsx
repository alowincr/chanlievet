import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "info" | "success" | "warning" | "error";

const STYLES: Record<Variant, { box: string; icon: string }> = {
  info: { box: "border-sky-200 bg-sky-50 text-sky-900", icon: "text-sky-600" },
  success: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: "text-emerald-600",
  },
  warning: {
    box: "border-amber-200 bg-amber-50 text-amber-900",
    icon: "text-amber-600",
  },
  error: { box: "border-rose-200 bg-rose-50 text-rose-900", icon: "text-rose-600" },
};

const ICONS = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: Variant;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const Icon = ICONS[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        STYLES[variant].box,
        className,
      )}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", STYLES[variant].icon)} />
      <div className="space-y-0.5">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="opacity-90">{children}</div> : null}
      </div>
    </div>
  );
}
