"use client";

import Link from "next/link";
import { useLugarElegido } from "@/lib/lugar";

/** Botón al mapa completo. Si ya hay un lugar elegido, el mapa abre ahí mismo. */
export default function AbrirMapa() {
  const l = useLugarElegido();
  let href = "/mapa";
  if (l?.estado) {
    const p = new URLSearchParams({ e: l.estado.slug });
    const mun = l.tipo === "municipio" ? l.slugMun : l.prestado?.slug;
    if (mun) p.set("m", mun);
    href = `/mapa?${p}`;
  }
  const nombre = l && l.tipo !== "pais" ? (l.prestado ? l.prestado.municipio : l.nombre) : null;
  return (
    <Link href={href}
      className="inline-flex min-h-14 items-center gap-2.5 rounded-full border-2 border-ink bg-obra px-6 text-[16px] font-bold shadow-[0_4px_0_0_var(--ink)] transition-transform active:translate-y-[4px] active:shadow-none">
      <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14M15 6v14" /></svg>
      {nombre ? `Ver ${nombre} en el mapa` : "Abrir el mapa"}
    </Link>
  );
}
