import type { Metadata } from "next";
import { AHORRO_PCT, aniosTxt, cuentas, nombreCompleto, rutaDe, titularDe, type Lugar } from "./datos";

/** Título, descripción y canónica de la página de un lugar. La imagen la pone opengraph-image.tsx de cada segmento. */
export function metadatosDe(l: Lugar): Metadata {
  const titulo = `${titularDe(l)} · Inavitable`;
  const c = cuentas(l);
  const descripcion = `${nombreCompleto(l)}: ${aniosTxt(c.ahorrando, !!l.tope)} años ahorrando el ${AHORRO_PCT}% del salario mínimo para una casa típica. ¿Y dónde vives tú?`;
  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: rutaDe(l) },
    openGraph: { title: titulo, description: descripcion, url: rutaDe(l), siteName: "Inavitable", locale: "es_MX", type: "website" },
    twitter: { card: "summary_large_image", title: titulo, description: descripcion },
  };
}
