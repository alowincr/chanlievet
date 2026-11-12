"use client";

import { SectionHeading } from "@/components/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import type { Product } from "@/lib/types";

export function FeaturedProducts() {
  const { data, loading, error, refetch } = useApiQuery<{
    products: Product[];
  }>("/api/products?limit=4");

  return (
    <section className="bg-sand-50/70 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          eyebrow="Tienda"
          title="Productos elegidos por nuestros veterinarios"
          description="Alimentos, camas, antipulgas y accesorios con stock actualizado en tiempo real."
          action={
            <ButtonLink href="/tienda" variant="outline" size="sm">
              Ver toda la tienda
            </ButtonLink>
          }
        />

        {error ? (
          <Alert
            variant="error"
            className="mt-6"
            title="No pudimos cargar los productos"
          >
            <button type="button" onClick={refetch} className="font-semibold underline">
              Reintentar
            </button>
          </Alert>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))
            : data?.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </div>
    </section>
  );
}
