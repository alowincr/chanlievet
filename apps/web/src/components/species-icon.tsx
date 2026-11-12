import { Cat, Dog, PawPrint } from "lucide-react";
import type { Species } from "@/lib/types";
import { cn } from "@/lib/cn";

const SPECIES_ICONS = {
  DOG: Dog,
  CAT: Cat,
  OTHER: PawPrint,
} as const;

/** Icono lineal por especie. Reemplaza los emojis 🐶/🐱/🐾 del sitio. */
export function SpeciesIcon({
  species,
  className,
}: {
  species: Species;
  className?: string;
}) {
  const Icon = SPECIES_ICONS[species] ?? PawPrint;
  return <Icon className={cn("size-5", className)} aria-hidden="true" />;
}
