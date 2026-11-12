import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 px-6 py-14 text-center">
      {icon ? (
        <div className="grid size-12 place-items-center rounded-full bg-white text-stone-400 shadow-sm">
          {icon}
        </div>
      ) : null}
      <div>
        <p className="font-semibold text-stone-800">{title}</p>
        {description ? (
          <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
