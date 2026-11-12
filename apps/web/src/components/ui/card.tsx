import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border-2 border-forest-900/10 bg-white shadow-[0_18px_45px_-38px_rgba(18,56,45,0.55)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-forest-900/10 px-5 py-4",
        className,
      )}
    >
      <div>
        <h3 className="font-semibold text-stone-900">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-sm text-stone-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
