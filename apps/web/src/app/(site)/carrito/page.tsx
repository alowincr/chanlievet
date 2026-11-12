"use client";

import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBasket,
  Trash2,
  Truck,
} from "lucide-react";
import { ProductImagePlaceholder } from "@/components/placeholders";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingBlock } from "@/components/ui/spinner";
import { useCart } from "@/lib/hooks/use-cart";
import { CLINIC } from "@/lib/clinic";
import { formatCurrency } from "@/lib/format";

export default function CartPage() {
  const { items, count, subtotal, ready, updateQuantity, removeItem, clear } =
    useCart();

  if (!ready) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-14">
        <LoadingBlock label="Cargando tu carrito..." />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={<ShoppingBasket className="size-6" />}
          title="Tu carrito está vacío"
          description="Explora la tienda y agrega los productos que necesitas para tu mascota."
          action={
            <ButtonLink href="/tienda" size="sm">
              Ir a la tienda
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const message = [
    "Hola ChanlieVet, quiero coordinar este pedido:",
    ...items.map(
      (item) =>
        `• ${item.quantity} x ${item.name} — ${formatCurrency(item.price * item.quantity)}`,
    ),
    "",
    `Total: ${formatCurrency(subtotal)}`,
    "",
    "¿Me confirman disponibilidad y forma de entrega?",
  ].join("\n");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            Tu carrito
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {count} producto{count === 1 ? "" : "s"} seleccionado
            {count === 1 ? "" : "s"}.
          </p>
        </div>
        <ButtonLink href="/tienda" variant="outline" size="sm">
          <ArrowLeft className="size-4" />
          Seguir comprando
        </ButtonLink>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm shadow-stone-900/5 sm:flex-row sm:items-center"
            >
              <Link href={`/producto/${item.slug}`} className="shrink-0">
                <ProductImagePlaceholder
                  name={item.name}
                  categorySlug={item.categorySlug}
                  imageUrl={item.imageUrl}
                  className="size-24"
                  iconClassName="size-9"
                  showLabel={false}
                />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/producto/${item.slug}`}
                  className="font-semibold text-stone-900 hover:text-brand-700"
                >
                  {item.name}
                </Link>
                <p className="mt-0.5 text-sm text-stone-500">
                  {formatCurrency(item.price)} c/u · Stock {item.stock}
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  Precio referencial. El stock se confirma al coordinar el
                  pedido.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="inline-flex items-center rounded-full border border-stone-300 bg-white">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    className="grid size-8 place-items-center rounded-l-full text-stone-500 hover:text-stone-900"
                    aria-label={`Quitar una unidad de ${item.name}`}
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    disabled={item.quantity >= item.stock}
                    className="grid size-8 place-items-center rounded-r-full text-stone-500 hover:text-stone-900 disabled:opacity-40"
                    aria-label={`Agregar una unidad de ${item.name}`}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>

                <p className="w-20 text-right font-semibold text-stone-900">
                  {formatCurrency(item.price * item.quantity)}
                </p>

                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="grid size-8 place-items-center rounded-full text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Quitar ${item.name} del carrito`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={clear}
            className="text-xs font-medium text-stone-400 underline-offset-2 hover:text-rose-600 hover:underline"
          >
            Vaciar carrito
          </button>
        </div>

        <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/5 lg:sticky lg:top-28">
          <h2 className="font-semibold text-stone-900">Resumen del pedido</h2>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-stone-500">Subtotal</dt>
              <dd className="font-medium text-stone-800">
                {formatCurrency(subtotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-stone-500">Delivery</dt>
              <dd className="text-stone-500">Se coordina</dd>
            </div>
            <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-base">
              <dt className="font-semibold text-stone-900">Total</dt>
              <dd className="font-bold text-stone-900">
                {formatCurrency(subtotal)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-brand-50/60 p-3 text-xs text-stone-600">
            <Truck className="mt-0.5 size-4 shrink-0 text-brand-600" />
            Recojo en clínica o delivery coordinado dentro de San Juan de
            Lurigancho. El pago se realiza al recibir el pedido.
          </div>

          <a
            href={`https://wa.me/${CLINIC.whatsapp}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] text-base font-semibold text-white transition-colors hover:bg-[#1ebe5b]"
          >
            <MessageCircle className="size-5" />
            Coordinar pedido por WhatsApp
          </a>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-stone-400">
            Al enviar el mensaje se compartirá el detalle de tu carrito. No se
            realiza ningún cobro en línea.
          </p>

          <Alert variant="info" className="mt-4">
            Los precios están expresados en soles peruanos. Si un producto se
            agota, te propondremos una alternativa.
          </Alert>
        </aside>
      </div>
    </div>
  );
}
