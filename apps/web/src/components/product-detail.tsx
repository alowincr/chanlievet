"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  MessageCircle,
  Minus,
  PackageSearch,
  Plus,
  ShieldCheck,
  ShoppingBasket,
  Stethoscope,
  Truck,
} from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingBlock } from "@/components/ui/spinner";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import { useCart } from "@/lib/hooks/use-cart";
import { CLINIC } from "@/lib/clinic";
import { AUDIENCE_LABELS, formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/types";

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Producto original",
    text: "Seleccionado y revisado por nuestro equipo veterinario.",
  },
  {
    icon: Stethoscope,
    title: "Asesoría incluida",
    text: "Te orientamos sobre la dosis o el uso adecuado.",
  },
  {
    icon: Truck,
    title: "Entrega coordinada",
    text: "Recojo en clínica o delivery dentro del distrito.",
  },
];

export function ProductDetail({ slug }: { slug: string }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const { data, loading, error, refetch } = useApiQuery<{
    product: Product;
  }>(`/api/products/${slug}`);

  const related = useApiQuery<{ products: Product[] }>(
    data ? `/api/products?category=${data.product.category.slug}&limit=5` : null,
  );

  useEffect(() => {
    if (!data) return;
    setQuantity(1);
  }, [data]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-14">
        <LoadingBlock label="Cargando producto..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          icon={<PackageSearch className="size-6" />}
          title="No encontramos este producto"
          description={error ?? "Puede que ya no esté disponible en la tienda."}
          action={
            <ButtonLink href="/tienda" variant="outline" size="sm">
              <ArrowLeft className="size-4" />
              Volver a la tienda
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const product = data.product;
  const soldOut = product.stock <= 0;
  const maxQuantity = Math.max(1, product.stock);

  function handleAdd() {
    if (soldOut) return;
    addItem(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  const whatsappMessage = `Hola ChanlieVet, quiero consultar por el producto "${product.name}" (${formatCurrency(product.price)}).`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
        <Link href="/" className="hover:text-brand-700">
          Inicio
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href="/tienda" className="hover:text-brand-700">
          Tienda
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`/tienda?categoria=${product.category.slug}`}
          className="hover:text-brand-700"
        >
          {product.category.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-stone-700">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <ProductImage
            name={product.name}
            categorySlug={product.category.slug}
            imageUrl={product.imageUrl}
            className="aspect-square w-full"
            iconClassName="size-24"
            zoomable
          />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { icon: ShieldCheck, label: "Original" },
              { icon: Stethoscope, label: "Asesoría" },
              { icon: Truck, label: "Delivery" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-1 rounded-xl border border-stone-200 bg-white py-2.5 text-[11px] font-medium text-stone-600"
                >
                  <Icon className="size-4 text-brand-600" />
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{product.category.name}</Badge>
            <Badge
              tone={
                product.audience === "CAT"
                  ? "sky"
                  : product.audience === "DOG"
                    ? "amber"
                    : "neutral"
              }
            >
              Para {AUDIENCE_LABELS[product.audience].toLowerCase()}
            </Badge>
            {soldOut ? (
              <Badge tone="rose">Agotado</Badge>
            ) : product.lowStock ? (
              <Badge tone="amber">Últimas {product.stock} unidades</Badge>
            ) : (
              <Badge tone="emerald">Disponible</Badge>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            {product.name}
          </h1>

          <p className="mt-3 text-3xl font-extrabold tracking-tight text-stone-900">
            {formatCurrency(product.price)}
          </p>

          <p className="mt-4 text-sm leading-relaxed text-stone-600 sm:text-base">
            {product.description ??
              "Un producto recomendado por nuestro equipo para el cuidado diario de tu mascota."}
          </p>

          <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50/60 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-full border border-stone-300 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={quantity <= 1 || soldOut}
                  className="grid size-10 place-items-center rounded-l-full text-stone-500 transition-colors hover:text-stone-900 disabled:opacity-40"
                  aria-label="Quitar una unidad"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold tabular-nums text-stone-800">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) => Math.min(maxQuantity, value + 1))
                  }
                  disabled={quantity >= maxQuantity || soldOut}
                  className="grid size-10 place-items-center rounded-r-full text-stone-500 transition-colors hover:text-stone-900 disabled:opacity-40"
                  aria-label="Agregar una unidad"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              <Button
                onClick={handleAdd}
                disabled={soldOut}
                size="lg"
                className="flex-1 sm:flex-none"
              >
                {added ? (
                  <>
                    <Check className="size-4" /> Agregado al carrito
                  </>
                ) : (
                  <>
                    <ShoppingBasket className="size-4" />
                    {soldOut ? "Sin stock" : "Agregar al carrito"}
                  </>
                )}
              </Button>

              <a
                href={`https://wa.me/${CLINIC.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition-colors hover:border-brand-400 hover:text-brand-700"
              >
                <MessageCircle className="size-4" />
                Consultar
              </a>
            </div>

            <p className="mt-3 text-xs text-stone-500">
              {soldOut
                ? "Este producto está agotado. Escríbenos para avisarte cuando llegue."
                : `Stock disponible: ${product.stock} unidades. Coordinamos el pago al recoger o por delivery.`}
            </p>
          </div>

          {added ? (
            <Alert variant="success" className="mt-4">
              Agregamos {quantity} unidad{quantity > 1 ? "es" : ""} al carrito.{" "}
              <Link href="/carrito" className="font-semibold underline">
                Revisar carrito
              </Link>
            </Alert>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="rounded-xl border border-stone-200 bg-white p-3"
                >
                  <Icon className="size-4 text-brand-600" />
                  <p className="mt-2 text-xs font-semibold text-stone-800">
                    {benefit.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">
                    {benefit.text}
                  </p>
                </div>
              );
            })}
          </div>

          {error ? (
            <button
              type="button"
              onClick={refetch}
              className="mt-4 text-sm font-semibold text-brand-700 underline"
            >
              Reintentar
            </button>
          ) : null}
        </div>
      </div>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900">
              También te puede interesar
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Más opciones de {product.category.name.toLowerCase()}.
            </p>
          </div>
          <ButtonLink href="/tienda" variant="ghost" size="sm">
            Ver todo
          </ButtonLink>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {related.loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))
            : related.data?.products
                .filter((item) => item.id !== product.id)
                .slice(0, 4)
                .map((item) => <ProductCard key={item.id} product={item} />)}
        </div>
      </section>
    </div>
  );
}
