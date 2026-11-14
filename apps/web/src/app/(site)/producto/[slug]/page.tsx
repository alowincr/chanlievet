import type { Metadata } from "next";
import { ProductDetail } from "@/components/product-detail";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
).replace(/\/$/, "");

async function getProduct(slug: string) {
  try {
    const response = await fetch(`${API_URL}/api/products/${slug}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as {
      product?: {
        name: string;
        description: string | null;
        imageUrl: string | null;
      };
    };

    return payload.product ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Producto no encontrado",
      description: "Revisa la tienda para encontrar productos disponibles.",
    };
  }

  const description =
    product.description?.slice(0, 160) ??
    `${product.name} disponible en la tienda de ChanlieVet.`;

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      ...(product.imageUrl ? { images: [{ url: product.imageUrl }] } : {}),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <ProductDetail slug={slug} />;
}
