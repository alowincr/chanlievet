"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ExternalLink,
  ImageOff,
  Minus,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";
import { ProductImage } from "@/components/product-image";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { LoadingBlock } from "@/components/ui/spinner";
import { apiFetch, describeApiError } from "@/lib/api";
import { useApiQuery } from "@/lib/hooks/use-api-query";
import { AUDIENCE_LABELS, formatCurrency } from "@/lib/format";
import type { Category, Product, ProductAudience } from "@/lib/types";

function ProductFormDialog({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [stock, setStock] = useState(product ? String(product.stock) : "0");
  const [audience, setAudience] = useState<ProductAudience>(
    product?.audience ?? "ALL",
  );
  const [categoryId, setCategoryId] = useState(
    product ? String(product.category.id) : categories[0] ? String(categories[0].id) : "",
  );
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [active, setActive] = useState(product?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewCategory =
    categories.find((item) => String(item.id) === categoryId) ?? categories[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: Number(price),
        stock: Number(stock),
        audience,
        categoryId: Number(categoryId),
        // `null` quita la imagen; una URL válida se guarda tal cual.
        imageUrl: imageUrl.trim() || null,
      };

      if (product) {
        await apiFetch(`/api/admin/products/${product.id}`, {
          method: "PATCH",
          body: { ...body, active },
        });
        onSaved(`Producto "${name.trim()}" actualizado.`);
      } else {
        await apiFetch("/api/admin/products", { method: "POST", body });
        onSaved(`Producto "${name.trim()}" creado.`);
      }

      onClose();
    } catch (caught) {
      setError(describeApiError(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 p-4 backdrop-blur-sm">
      <div className="mx-auto my-6 w-full max-w-2xl rounded-2xl border border-stone-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              {product ? "Editar producto" : "Nuevo producto"}
            </h2>
            <p className="text-sm text-stone-500">
              {product
                ? "Actualiza los datos del catálogo."
                : "Agrega un producto a la tienda de la clínica."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            aria-label="Cerrar formulario"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <Field
            label="Nombre"
            htmlFor="product-name"
            hint="Si cambias el nombre, la URL pública del producto se actualiza automáticamente."
            required
          >
            <Input
              id="product-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Croquetas Adulto Pollo 3 kg"
              minLength={2}
              maxLength={140}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoría" htmlFor="product-category" required>
              <Select
                id="product-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                required
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Público" htmlFor="product-audience" required>
              <Select
                id="product-audience"
                value={audience}
                onChange={(event) =>
                  setAudience(event.target.value as ProductAudience)
                }
              >
                <option value="ALL">Todos</option>
                <option value="DOG">Perros</option>
                <option value="CAT">Gatos</option>
              </Select>
            </Field>

            <Field label="Precio (S/)" htmlFor="product-price" required>
              <Input
                id="product-price"
                type="number"
                min="0.1"
                step="0.1"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0.00"
                required
              />
            </Field>

            <Field label="Stock" htmlFor="product-stock" required>
              <Input
                id="product-stock"
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                required
              />
            </Field>
          </div>

          <Field
            label="Descripción"
            htmlFor="product-description"
            hint="Visible en la tienda pública."
          >
            <Textarea
              id="product-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Presentación, beneficios, indicaciones de uso..."
              maxLength={600}
            />
          </Field>

          <Field
            label="URL de imagen"
            htmlFor="product-image"
            hint="Copia el enlace directo de la imagen (JPG, PNG o WebP). Vacío = marcador."
          >
            <Input
              id="product-image"
              type="url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://..."
              maxLength={500}
            />
          </Field>

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-stone-50/70 p-3">
            <ProductImage
              name={name.trim() || "Producto"}
              categorySlug={previewCategory?.slug ?? "alimentos"}
              imageUrl={imageUrl.trim() || null}
              className="size-24 shrink-0 bg-white"
              iconClassName="size-7"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-stone-700">
                Vista previa de la imagen
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500">
                Se muestra completa, sin recortes, sobre fondo neutro. Si el
                enlace está roto, verás el marcador de la categoría.
              </p>
              {imageUrl.trim() ? (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 underline underline-offset-2 hover:text-rose-600"
                >
                  <ImageOff className="size-3" />
                  Quitar imagen
                </button>
              ) : null}
            </div>
          </div>

          {product ? (
            <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                className="size-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
              />
              Producto visible en la tienda
            </label>
          ) : null}

          {error ? <Alert variant="error">{error}</Alert> : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Guardando..."
                : product
                  ? "Guardar cambios"
                  : "Crear producto"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProductsPage() {
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const path = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (category !== "all") params.set("category", category);
    const query = params.toString();
    return `/api/admin/products${query ? `?${query}` : ""}`;
  }, [search, category]);

  const products = useApiQuery<{ products: Product[] }>(path);
  const categories = useApiQuery<{ categories: Category[] }>("/api/categories");

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const categoryList = categories.data?.categories ?? [];

  const summary = useMemo(() => {
    const list = products.data?.products ?? [];
    return {
      total: list.length,
      low: list.filter((product) => product.lowStock).length,
      inactive: list.filter((product) => !product.active).length,
    };
  }, [products.data]);

  function openCreate() {
    setEditing(null);
    setActionError(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setActionError(null);
    setFormOpen(true);
  }

  async function adjustStock(product: Product, delta: number) {
    setBusy(product.id);
    setActionError(null);

    try {
      await apiFetch(`/api/admin/products/${product.id}/stock`, {
        method: "PATCH",
        body: { delta },
      });
      products.refetch();
    } catch (caught) {
      setActionError(describeApiError(caught));
    } finally {
      setBusy(null);
    }
  }

  async function toggleActive(product: Product) {
    setBusy(product.id);
    setActionError(null);

    try {
      await apiFetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        body: { active: !product.active },
      });
      setMessage(
        `Producto "${product.name}" ${product.active ? "ocultado de" : "activado en"} la tienda.`,
      );
      products.refetch();
    } catch (caught) {
      setActionError(describeApiError(caught));
    } finally {
      setBusy(null);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchDraft);
  }

  return (
    <div className="space-y-5">
      {formOpen ? (
        <ProductFormDialog
          product={editing}
          categories={categoryList}
          onClose={() => setFormOpen(false)}
          onSaved={(savedMessage) => {
            setMessage(savedMessage);
            products.refetch();
          }}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900">
            Inventario de la tienda
          </h2>
          <p className="text-sm text-stone-500">
            Controla precios, stock y visibilidad de cada producto.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={products.refetch}>
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
          <Button size="sm" onClick={openCreate}>
            <PackagePlus className="size-4" />
            Nuevo producto
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Productos
          </p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{summary.total}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Stock bajo
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{summary.low}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Inactivos
          </p>
          <p className="mt-1 text-2xl font-bold text-stone-500">
            {summary.inactive}
          </p>
        </div>
      </div>

      <Card>
        <div className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
              <Input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Buscar producto por nombre o descripción"
                className="pl-10"
                aria-label="Buscar productos"
              />
            </div>

            <Select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filtrar por categoría"
              className="sm:w-56"
            >
              <option value="all">Todas las categorías</option>
              {categoryList.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </Select>

            <Button type="submit" size="sm">
              <Search className="size-4" />
              Buscar
            </Button>
          </form>
        </div>
      </Card>

      {actionError ? (
        <Alert variant="error" title="No se pudo actualizar el inventario">
          {actionError}
        </Alert>
      ) : null}

      {message ? <Alert variant="success">{message}</Alert> : null}

      {products.loading ? (
        <LoadingBlock label="Cargando inventario..." />
      ) : products.error ? (
        <Alert variant="error" title="No pudimos cargar los productos">
          <p>{products.error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={products.refetch}
          >
            Reintentar
          </Button>
        </Alert>
      ) : products.data && products.data.products.length === 0 ? (
        <EmptyState
          icon={<Package className="size-6" />}
          title="No hay productos con esos filtros"
          description="Prueba con otra búsqueda o crea un nuevo producto para la tienda."
          action={
            <Button size="sm" onClick={openCreate}>
              <PackagePlus className="size-4" />
              Nuevo producto
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <CardHeader
            title="Catálogo"
            description={`${products.data?.products.length ?? 0} producto(s)`}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-left text-[11px] uppercase tracking-wide text-stone-400">
                  <th className="px-4 py-2.5 font-semibold">Producto</th>
                  <th className="px-4 py-2.5 font-semibold">Público</th>
                  <th className="px-4 py-2.5 font-semibold">Precio</th>
                  <th className="px-4 py-2.5 font-semibold">Stock</th>
                  <th className="px-4 py-2.5 font-semibold">Estado</th>
                  <th className="px-4 py-2.5 text-right font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.data?.products.map((product) => (
                  <tr
                    key={product.id}
                    className={product.lowStock ? "bg-amber-50/40" : undefined}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProductImage
                          name={product.name}
                          categorySlug={product.category.slug}
                          imageUrl={product.imageUrl}
                          className="size-14 shrink-0"
                          iconClassName="size-5"
                          showLabel={false}
                        />
                        <div className="flex min-w-0 flex-col items-start gap-0.5">
                          <Link
                            href={`/producto/${product.slug}`}
                            target="_blank"
                            className="max-w-full truncate font-medium text-stone-900 hover:text-brand-700 hover:underline"
                          >
                            {product.name}
                          </Link>
                          <Link
                            href={`/producto/${product.slug}`}
                            target="_blank"
                            className="inline-flex max-w-full items-center gap-1 text-[11px] text-stone-400 hover:text-brand-700"
                            title="Abrir la ficha pública en una pestaña nueva"
                          >
                            <span className="truncate">
                              {product.category.name} · /producto/{product.slug}
                            </span>
                            <ExternalLink className="size-3 shrink-0" />
                          </Link>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          product.audience === "CAT"
                            ? "sky"
                            : product.audience === "DOG"
                              ? "amber"
                              : "neutral"
                        }
                      >
                        {AUDIENCE_LABELS[product.audience]}
                      </Badge>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-stone-800">
                      {formatCurrency(product.price)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center rounded-full border border-stone-200 bg-white">
                          <button
                            type="button"
                            onClick={() => void adjustStock(product, -1)}
                            disabled={busy === product.id || product.stock === 0}
                            className="grid size-7 place-items-center text-stone-500 hover:text-stone-900 disabled:opacity-40"
                            aria-label={`Reducir stock de ${product.name}`}
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold tabular-nums">
                            {product.stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => void adjustStock(product, 1)}
                            disabled={busy === product.id}
                            className="grid size-7 place-items-center text-stone-500 hover:text-stone-900 disabled:opacity-40"
                            aria-label={`Aumentar stock de ${product.name}`}
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        {product.lowStock ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                            <TriangleAlert className="size-3" />
                            Bajo
                          </span>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Badge tone={product.active ? "emerald" : "neutral"}>
                        {product.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(product)}
                          className="px-2.5 text-[11px]"
                        >
                          <Pencil className="size-3" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant={product.active ? "ghost" : "primary"}
                          disabled={busy === product.id}
                          onClick={() => void toggleActive(product)}
                          className="px-2.5 text-[11px]"
                        >
                          {product.active ? "Ocultar" : "Activar"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
