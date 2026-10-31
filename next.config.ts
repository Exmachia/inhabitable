import type { NextConfig } from "next";

/**
 * Qué puede cargar la página: lo propio, Umami (analytics), los mosaicos de OpenFreeMap y el worker de MapLibre
 * (se sirve de /maplibre y crea blobs). Next mete scripts en línea sin nonce en páginas estáticas, por eso 'unsafe-inline'.
 * Solo en producción: en desarrollo Next necesita eval.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cloud.umami.is",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tiles.openfreemap.org",
  "font-src 'self' data:",
  "connect-src 'self' https://cloud.umami.is https://api-gateway.umami.dev https://tiles.openfreemap.org",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  poweredByHeader: false,
  // Las tarjetas para compartir leen sus fuentes con readFile: se incluyen explícitamente en las funciones del servidor.
  outputFileTracingIncludes: {
    "/opengraph-image": ["src/og/fuentes/**/*"],
    "/[estado]/**": ["src/og/fuentes/**/*"],
    "/historia/**": ["src/og/fuentes/**/*"],
  },
  partialPrefetching: true,
  // Encabezados de seguridad básicos: nadie puede meter el sitio en un iframe ajeno, el navegador no adivina tipos
  // de archivo y no se piden permisos de cámara, micrófono ni ubicación.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: CSP }] : []),
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
