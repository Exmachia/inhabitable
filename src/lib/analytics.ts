"use client";

/**
 * Eventos para medir las dos señales del brief (se comparte, la gente busca su caso), con Umami (sin cookies).
 * Regla: nunca se manda el salario ni nada derivado de él (rangos, "arriba o abajo del mínimo"). `usar_salario` va sin
 * propiedades y una sola vez por visita. Si Umami no está cargado (local, o sin NEXT_PUBLIC_UMAMI_ID), no hace nada.
 */
type Evento =
  | { nombre: "buscar_lugar"; lugar: string }
  | { nombre: "tocar_mapa"; lugar: string }
  | { nombre: "usar_salario" }
  | { nombre: "compartir"; lugar: string; canal: "whatsapp" | "nativo" | "copiar" | "historia" };

declare global {
  interface Window {
    umami?: { track: (nombre: string, datos?: Record<string, string>) => void };
  }
}

let salarioContado = false;

export function registrar(e: Evento) {
  if (e.nombre === "usar_salario") {
    if (salarioContado) return;
    salarioContado = true;
  }
  const { nombre, ...datos } = e;
  try {
    window.umami?.track(nombre, Object.keys(datos).length ? (datos as Record<string, string>) : undefined);
  } catch {
    // Analytics nunca debe romper la página.
  }
}
