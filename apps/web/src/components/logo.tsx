import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({
  href = "/",
  light = false,
  className,
}: {
  href?: string;
  light?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span
        className={cn(
          "relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl transition-transform group-hover:-rotate-6",
          light && "bg-white p-1 shadow-sm shadow-black/20",
        )}
      >
        <Image
          src="/logo-chanlievet.png"
          alt=""
          width={256}
          height={256}
          className="size-full object-contain"
        />
      </span>
      <span className="leading-tight">
        <span
          className={cn(
            "block font-display text-lg font-extrabold tracking-tight",
            light ? "text-white" : "text-stone-900",
          )}
        >
          ChanlieVet
        </span>
        <span
          className={cn(
            "block text-[10px] font-semibold uppercase tracking-[0.2em]",
            light ? "text-brand-100/80" : "text-brand-600",
          )}
        >
          Clínica veterinaria
        </span>
      </span>
    </Link>
  );
}
