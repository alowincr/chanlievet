import type { MetadataRoute } from "next";

const BASE_URL = "https://chanlievet.pe";
const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
).replace(/\/$/, "");

const PUBLIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/tienda", changeFrequency: "daily", priority: 0.9 },
  { path: "/citas", changeFrequency: "monthly", priority: 0.8 },
  { path: "/sala-espera", changeFrequency: "daily", priority: 0.6 },
  { path: "/seguimiento", changeFrequency: "monthly", priority: 0.6 },
  { path: "/emergencia", changeFrequency: "monthly", priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const response = await fetch(`${API_URL}/api/products?limit=60`, {
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const payload = (await response.json()) as {
        products?: Array<{ slug: string; active?: boolean }>;
      };

      for (const product of payload.products ?? []) {
        if (!product.slug || product.active === false) continue;

        routes.push({
          url: `${BASE_URL}/producto/${product.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  } catch {
    // Si el API no está disponible al construir, el sitemap conserva las
    // rutas públicas principales.
  }

  return routes;
}
