/**
 * URL pública del sitio.
 *
 * Se usa en `metadataBase`, `robots.txt` y `sitemap.xml`. En producción define
 * `NEXT_PUBLIC_SITE_URL` con el dominio real (Vercel, dominio propio, etc.).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://chanlievet.pe"
).replace(/\/$/, "");
