import type { Prisma } from "../../generated/prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errors";
import type { ProductDTO } from "../../types/dto";
import {
  toProductDTO,
  type CreateProductInput,
  type ListProductsQuery,
  type UpdateProductInput,
  type UpdateStockInput,
} from "./product.schema";

function slugify(value: string): string {
  const base = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

  return base || `producto-${Date.now()}`;
}

async function generateUniqueSlug(
  name: string,
  excludeId?: number,
): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) break;

    candidate = `${base}-${suffix}`;
    suffix += 1;

    if (suffix > 50) {
      throw new HttpError(409, "No se pudo generar un identificador único para el producto");
    }
  }

  return candidate;
}

export async function listProducts(
  query: ListProductsQuery,
  includeInactive = false,
): Promise<ProductDTO[]> {
  const where: Prisma.ProductWhereInput = {};

  if (!includeInactive) {
    where.active = true;
  }

  if (query.category) {
    where.category = { slug: query.category };
  }

  if (query.audience && query.audience !== "ALL") {
    where.audience = { in: [query.audience, "ALL"] };
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    query.sort === "price-asc"
      ? { price: "asc" }
      : query.sort === "price-desc"
        ? { price: "desc" }
        : query.sort === "name"
          ? { name: "asc" }
          : { createdAt: "desc" };

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy,
    ...(query.limit !== undefined ? { take: query.limit } : {}),
  });

  return products.map((product) => toProductDTO(product, env.LOW_STOCK_THRESHOLD));
}

export async function getProductBySlug(
  slug: string,
  includeInactive = false,
): Promise<ProductDTO> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!product || (!product.active && !includeInactive)) {
    throw new HttpError(404, "Producto no encontrado");
  }

  return toProductDTO(product, env.LOW_STOCK_THRESHOLD);
}

export async function createProduct(input: CreateProductInput): Promise<ProductDTO> {
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new HttpError(400, "La categoría seleccionada no existe");
  }

  const slug = await generateUniqueSlug(input.name);

  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      price: input.price,
      stock: input.stock,
      audience: input.audience,
      categoryId: input.categoryId,
      imageUrl: input.imageUrl ?? null,
    },
    include: { category: true },
  });

  return toProductDTO(product, env.LOW_STOCK_THRESHOLD);
}

export async function updateProduct(
  id: number,
  input: UpdateProductInput,
): Promise<ProductDTO> {
  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new HttpError(404, "Producto no encontrado");
  }

  if (input.categoryId !== undefined) {
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new HttpError(400, "La categoría seleccionada no existe");
    }
  }

  // Al guardar un nombre, la URL pública se sincroniza con él. Así el slug
  // nunca queda apuntando a un nombre anterior y las ediciones antiguas se
  // corrigen con solo volver a guardar el producto.
  const slug =
    input.name !== undefined
      ? await generateUniqueSlug(input.name, id)
      : undefined;

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.stock !== undefined ? { stock: input.stock } : {}),
      ...(input.audience !== undefined ? { audience: input.audience } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl ?? null } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
    include: { category: true },
  });

  return toProductDTO(product, env.LOW_STOCK_THRESHOLD);
}

export async function adjustProductStock(
  id: number,
  input: UpdateStockInput,
): Promise<ProductDTO> {
  const product = await prisma.$transaction(async (tx) => {
    const current = await tx.product.findUnique({ where: { id } });

    if (!current) {
      throw new HttpError(404, "Producto no encontrado");
    }

    const nextStock = input.stock ?? current.stock + (input.delta ?? 0);

    if (nextStock < 0) {
      throw new HttpError(400, "El stock no puede ser negativo");
    }

    return tx.product.update({
      where: { id },
      data: { stock: nextStock },
      include: { category: true },
    });
  });

  return toProductDTO(product, env.LOW_STOCK_THRESHOLD);
}
