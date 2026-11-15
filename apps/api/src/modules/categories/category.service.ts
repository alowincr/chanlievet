import { prisma } from "../../lib/prisma";
import type { CategoryDTO } from "../../types/dto";

export async function listCategories(): Promise<CategoryDTO[]> {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      // La tienda solo muestra productos activos: el conteo debe coincidir.
      _count: { select: { products: { where: { active: true } } } },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    productCount: category._count.products,
  }));
}
