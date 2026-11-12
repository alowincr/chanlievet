"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";import { PackageSearch, Search, ShoppingBasket, Sparkles } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/field";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import { useCart } from "@/lib/hooks/use-cart";
import { cn } from "@/lib/cn";
import type { Category, Product } from "@/lib/types";

type AudienceFilter = "ALL" | "DOG" | "CAT";

const AUDIENCE_OPTIONS: Array<{ value: AudienceFilter; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "DOG", label: "Perros" },
  { value: "CAT", label: "Gatos" },
];

export default function ShopPage() {
  const [category, setCategory] = useState("all");
  const [audience, setAudience] = useState<AudienceFilter>("ALL");
  const [sort, setSort] = useState("featured");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { count } = useCart();

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const initialCategory = new URLSearchParams(window.location.search).get(
      "categoria",
    );
    if (initialCategory) setCategory(initialCategory);
  }, []);

  const path = useMemo(() => {
    const params = new URLSearchParams();

    if (category !== "all") params.set("category", category);
    if (audience !== "ALL") params.set("audience", audience);
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (sort !== "featured") params.set("sort", sort);

    const query = params.toString();
    return `/api/products${query ? `?${query}` : ""}`;
  }, [category, audience, debouncedSearch, sort]);

  const products = useApiQuery<{ products: Product[] }>(path);
  const categories = useApiQuery<{ categories: Category[] }>("/api/categories");

  const hasFilters =
    category !== "all" || audience !== "ALL" || search.trim() !== "";

  function resetFilters() {
    setCategory("all");
    setAudience("ALL");
    setSearch("");
    setSort("featured");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <Sparkles className="size-3.5" />
            Tienda ChanlieVet
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Todo para consentir a tu mascota
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500 sm:text-base">
            Alimentos, camas, desparasitantes y accesorios recomendados por
            nuestro equipo. Coordinamos la entrega o el recojo en clínica.
          </p>
        </div>

        <ButtonLink href="/carrito" variant="outline" size="sm">
          <ShoppingBasket className="size-4" />
          Carrito{count > 0 ? ` (${count})` : ""}
        </ButtonLink>
      </div>

      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm shadow-stone-900/5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar alimento, cama, antipulgas..."
              className="pl-10"
              aria-label="Buscar productos"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-stone-200 bg-stone-50 p-1">
              {AUDIENCE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAudience(option.value)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                    audience === option.value
                      ? "bg-white text-brand-700 shadow-sm"
                      : "text-stone-500 hover:text-stone-800",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Ordenar productos"
              className="w-auto"
            >
              <option value="featured">Más recientes</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="name">Nombre (A-Z)</option>
            </Select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              category === "all"
                ? "bg-brand-600 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200",
            )}
          >
            Todas las categorías
          </button>
          {categories.data?.categories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.slug)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                category === item.slug
                  ? "bg-brand-600 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200",
              )}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          {products.loading
            ? "Buscando productos..."
            : `${products.data?.products.length ?? 0} productos encontrados`}
        </p>
        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Limpiar filtros
          </Button>
        ) : null}
      </div>

      {products.error ? (
        <Alert
          variant="error"
          className="mt-4"
          title="No pudimos cargar la tienda"
        >
          <button
            type="button"
            onClick={products.refetch}
            className="font-semibold underline"
          >
            Reintentar
          </button>
        </Alert>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.loading
          ? Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))
          : products.data?.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>

      {!products.loading &&
      !products.error &&
      products.data?.products.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<PackageSearch className="size-6" />}
            title="No encontramos productos con esos filtros"
            description="Prueba con otra categoría, cambia el público o limpia la búsqueda."
            action={
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Ver todos los productos
              </Button>
            }
          />
        </div>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-100 bg-brand-50/60 px-5 py-4 text-sm">
        <p className="text-stone-600">
          ¿No encuentras lo que buscas? Te ayudamos a elegir el producto
          adecuado para tu mascota.
        </p>
        <Link
          href="/citas"
          className="font-semibold text-brand-700 hover:text-brand-800"
        >
          Consultar con un veterinario →
        </Link>
      </div>
    </div>
  );
}
