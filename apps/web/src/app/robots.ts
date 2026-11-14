import type { MetadataRoute } from "next";

const BASE_URL = "https://chanlievet.pe";

/** El panel, el login y el carrito no aportan nada a los buscadores. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/veterinario", "/login", "/carrito"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
