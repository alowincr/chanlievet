import { PawPrint } from "lucide-react";
import type { Species } from "@/lib/types";
import { SPECIES_LABELS, initials } from "@/lib/format";
import { SpeciesIcon } from "@/components/species-icon";
import { cn } from "@/lib/cn";

const SPECIES_TONES: Record<Species, string> = {
  DOG: "bg-amber-100 text-amber-700",
  CAT: "bg-sky-100 text-sky-700",
  OTHER: "bg-brand-100 text-brand-700",
};

export function PetAvatar({
  name,
  species,
  photoUrl,
  size = "md",
  className,
}: {
  name: string;
  species: Species;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "size-9 text-base",
    md: "size-12 text-xl",
    lg: "size-16 text-3xl",
  };

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={cn("shrink-0 rounded-full object-cover", sizes[size], className)}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={`${name}, ${SPECIES_LABELS[species]}`}
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold",
        SPECIES_TONES[species],
        sizes[size],
        className,
      )}
    >
      <SpeciesIcon
        species={species}
        className={
          size === "sm" ? "size-4" : size === "md" ? "size-5" : "size-7"
        }
      />
    </span>
  );
}

export function StaffAvatar({
  name,
  avatarUrl,
  size = "md",
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "size-9 text-xs",
    md: "size-11 text-sm",
    lg: "size-16 text-lg",
  };

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={cn("shrink-0 rounded-full object-cover", sizes[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-stone-900 font-bold text-white",
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function PawMark({ className }: { className?: string }) {
  return <PawPrint className={cn("size-5", className)} />;
}
