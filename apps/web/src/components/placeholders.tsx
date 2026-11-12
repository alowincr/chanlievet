import {
  BedDouble,
  Bone,
  Droplets,
  Package,
  PawPrint,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Species } from "@/lib/types";
import { SPECIES_LABELS, initials } from "@/lib/format";
import { SpeciesIcon } from "@/components/species-icon";
import { cn } from "@/lib/cn";

const CATEGORY_STYLES: Record<
  string,
  { gradient: string; icon: typeof Bone }
> = {
  alimentos: { gradient: "from-amber-100 via-orange-50 to-white text-amber-500", icon: Bone },
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

export function ProductImagePlaceholder({
  name,
  categorySlug,
  imageUrl,
  className,
  iconClassName,
  showLabel = true,
}: {
  name: string;
  categorySlug: string;
  imageUrl?: string | null;
  className?: string;
  iconClassName?: string;
  showLabel?: boolean;
}) {
  const style = CATEGORY_STYLES[categorySlug] ?? {
    gradient: "from-brand-100 via-brand-50 to-white text-brand-500",
    icon: Package,
  };
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br",
        style.gradient,
        className,
      )}
      role="img"
      aria-label={`Imagen de ${name}`}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        <>
          <div className="absolute -right-6 -top-6 size-24 rounded-full bg-white/40 blur-xl" />
          <Icon className={cn("size-14 drop-shadow-sm", iconClassName)} />
          {showLabel ? (
            <span className="absolute bottom-2.5 left-0 right-0 text-center text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Foto próximamente
            </span>
          ) : null}
        </>
      )}
    </div>
  );
}

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
