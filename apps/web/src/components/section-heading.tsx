import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div
      className={
        align === "center"
          ? "mx-auto max-w-2xl text-center"
          : "flex flex-wrap items-end justify-between gap-4"
      }
    >
      <div className={align === "center" ? "" : "max-w-2xl"}>
        {eyebrow ? (
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-coral-600">
            <span className="inline-block h-px w-6 bg-coral-400" aria-hidden="true" />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-forest-950 sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-stone-500 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
