import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

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
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
