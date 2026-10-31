import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/sitio";

/** Todo se puede indexar menos las tarjetas verticales para historias, que son imágenes. Las vistas previas de Vercel ya llevan noindex. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/historia/" },
    sitemap: `${SITIO}/sitemap.xml`,
  };
}
