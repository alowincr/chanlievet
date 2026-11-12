"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Plus, ShoppingBasket } from "lucide-react";
import { ProductImagePlaceholder } from "@/components/placeholders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/hooks/use-cart";
import { AUDIENCE_LABELS, formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;

  function handleAdd() {
    addItem(product, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-900/5 transition-shadow hover:shadow-md hover:shadow-stone-900/10">
      <Link href={`/producto/${product.slug}`} className="block p-3 pb-0">
        <ProductImagePlaceholder
          name={product.name}
          categorySlug={product.category.slug}
          imageUrl={product.imageUrl}
          className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-[1.015]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
            {product.category.name}
          </span>
          <Badge tone={product.audience === "CAT" ? "sky" : product.audience === "DOG" ? "amber" : "neutral"}>
            {AUDIENCE_LABELS[product.audience]}
          </Badge>
        </div>

        <Link
          href={`/producto/${product.slug}`}
          className="mt-2 line-clamp-2 font-semibold leading-snug text-stone-900 hover:text-brand-700"
        >
          {product.name}
        </Link>

        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-500">
          {product.description ?? "Producto seleccionado por nuestro equipo veterinario."}
        </p>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-lg font-bold text-stone-900">
                {formatCurrency(product.price)}
              </p>
              <p className="text-xs text-stone-500">
                {soldOut
                  ? "Sin stock"
                  : product.lowStock
                    ? `Últimas ${product.stock} unidades`
                    : `${product.stock} disponibles`}
              </p>
            </div>

            <Button
              size="sm"
              onClick={handleAdd}
              disabled={soldOut}
              aria-label={`Agregar ${product.name} al carrito`}
              className="px-3"
            >
              {added ? (
                <>
                  <Check className="size-4" /> Listo
                </>
              ) : (
                <>
                  <Plus className="size-4" /> Agregar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="m-3 aspect-[4/3] animate-pulse rounded-2xl bg-stone-200/70" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-20 animate-pulse rounded bg-stone-200/70" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200/70" />
        <div className="h-3 w-full animate-pulse rounded bg-stone-200/70" />
        <div className="flex items-center justify-between pt-3">
          <div className="h-5 w-20 animate-pulse rounded bg-stone-200/70" />
          <div className="h-8 w-24 animate-pulse rounded-full bg-stone-200/70" />
        </div>
      </div>
    </div>
  );
}

export function CartHint() {
  return (
    <Link
      href="/carrito"
      className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
    >
      <ShoppingBasket className="size-4" /> Ver carrito
    </Link>
  );
}
