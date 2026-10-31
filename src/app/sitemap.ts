import type { MetadataRoute } from "next";
import { ESTADOS, POR_CVE, slugMunicipio } from "@/lib/datos";
import { MUNICIPIOS_CON_DATO } from "@/lib/municipios";
import { SITIO } from "@/lib/sitio";

/** La portada, los 32 estados y los municipios con estimación propia (los demás muestran la cifra de su estado). */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITIO, priority: 1 },
    ...ESTADOS.map((e) => ({ url: `${SITIO}/${e.slug}`, priority: 0.8 })),
    ...MUNICIPIOS_CON_DATO.map((m) => ({ url: `${SITIO}/${POR_CVE.get(m.ent)!.slug}/${slugMunicipio(m)}`, priority: 0.6 })),
  ];
}
