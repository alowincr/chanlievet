import { z } from "zod";
import type { ProductDTO } from "../../types/dto";
import type { Prisma } from "../../generated/prisma/client";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

/**
 * URL de imagen opcional. Una cadena vacía se interpreta como `null` para
 * poder quitar la imagen desde el panel, y se valida que sea una URL real.
 */
const optionalImageUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z
    .union([
      z
        .string()
        .trim()
        .url("Ingresa una URL de imagen válida (debe empezar con http:// o https://)")
        .max(500),
      z.null(),
    ])
    .optional(),
);

export const listProductsQuerySchema = z.object({
  category: z.string().trim().max(60).optional(),
  audience: z.enum(["DOG", "CAT", "ALL"]).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(["featured", "price-asc", "price-desc", "name"]).default("featured"),
  limit: z.coerce.number().int().min(1).max(60).optional(),
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre del producto").max(140),
  description: optionalText(600),
  price: z.coerce.number().positive("El precio debe ser mayor a cero").max(100_000),
  stock: z.coerce.number().int().min(0).default(0),
  audience: z.enum(["DOG", "CAT", "ALL"]).default("ALL"),
  categoryId: z.coerce.number().int().positive("Selecciona una categoría"),
  imageUrl: optionalImageUrl,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(2).max(140).optional(),
    description: optionalText(600),
    price: z.coerce.number().positive().max(100_000).optional(),
    stock: z.coerce.number().int().min(0).optional(),
    audience: z.enum(["DOG", "CAT", "ALL"]).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    imageUrl: optionalImageUrl,
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Envía al menos un campo para actualizar",
  });

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const updateStockSchema = z
  .object({
    /** Nuevo stock absoluto. */
    stock: z.coerce.number().int().min(0).optional(),
    /** Variación relativa (+1, -3, etc.). */
    delta: z.coerce.number().int().min(-1000).max(1000).optional(),
  })
  .refine((data) => data.stock !== undefined || data.delta !== undefined, {
    message: "Envía `stock` o `delta`",
  });

export type UpdateStockInput = z.infer<typeof updateStockSchema>;

export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: true };
}>;

export function toProductDTO(product: ProductWithCategory, lowStockThreshold: number): ProductDTO {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price.toNumber(),
    stock: product.stock,
    audience: product.audience,
    imageUrl: product.imageUrl,
    active: product.active,
    lowStock: product.stock <= lowStockThreshold,
    createdAt: product.createdAt.toISOString(),
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
  };
}
