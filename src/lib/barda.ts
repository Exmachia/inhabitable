import { EDAD_INICIO, TOPE_ANIOS } from "./datos";

/**
 * "Tu vida en tabiques": cada tabique es un año de vida, puestos como en una barda (de abajo hacia arriba, cuatrapeados).
 * La geometría se comparte entre la página (SVG en el DOM) y las tarjetas para redes (next/og).
 */

export const POR_FILA = 10;
export const W = 20; // tabique
export const H = 9;
export const G = 2; // junta

/** Lo más que se dibuja: hasta el tope de la estimación (150 años juntando). Lo que pase de ahí se cuenta, no se dibuja. */
export const MAX_TABIQUES = EDAD_INICIO + TOPE_ANIOS;

export type Tramo = "ninez" | "juntando" | "queda" | "fuera";
export type Tabique = { x: number; y: number; tramo: Tramo; anio: number };

/** `terminas`: edad a la que terminas de juntar. `ev`: esperanza de vida del lugar. `mas`: la estimación tocó el tope. */
export function barda(terminas: number, ev: number, mas = false) {
  const fin = mas ? EDAD_INICIO + TOPE_ANIOS : terminas;
  const vida = Math.round(ev);
  const n = Math.min(Math.max(vida, fin), MAX_TABIQUES);
  const filas = Math.ceil(n / POR_FILA);
  const ancho = POR_FILA * (W + G) + W / 2;
  const alto = filas * (H + G);
  const pos = (i: number) => {
    const fila = Math.floor(i / POR_FILA);
    return { x: (i % POR_FILA) * (W + G) + (fila % 2 ? W / 2 : 0), y: alto - (fila + 1) * (H + G) + G };
  };
  const tabiques: Tabique[] = Array.from({ length: n }, (_, i) => {
    const tramo: Tramo = i < EDAD_INICIO ? "ninez" : i >= vida ? "fuera" : i < fin ? "juntando" : "queda";
    return { ...pos(i), tramo, anio: i };
  });

  // Línea escalonada donde se acaba la vida promedio: entre el tabique vida-1 y el vida (solo si juntar la rebasa).
  let linea: string | null = null;
  if (fin > vida) {
    const fila = Math.floor(vida / POR_FILA);
    const col = vida % POR_FILA;
    const off = fila % 2 ? W / 2 : 0;
    const yBase = alto - fila * (H + G) + G / 2; // debajo de la fila
    const yTop = yBase - (H + G);
    const xCorte = col * (W + G) + off - G / 2;
    linea = col === 0
      ? `M${-4},${yBase}H${ancho + 4}`
      : `M${-4},${yTop}H${xCorte}V${yBase}H${ancho + 4}`;
  }

  return {
    tabiques,
    ancho,
    alto,
    linea,
    juntando: fin - EDAD_INICIO,
    queda: Math.max(vida - fin, 0),
    fuera: Math.max(fin - vida, 0),
    vida,
    alcanza: fin <= vida,
    /** Años que no caben en la barda (solo con montos muy chicos). */
    sinDibujar: Math.max(fin - n, 0),
  };
}

/** Colores de cada tramo (hex para que sirvan también en next/og, que no entiende variables de CSS). */
export const COLOR_TRAMO: Record<Tramo, { fill: string; stroke: string }> = {
  ninez: { fill: "#ebe5d9", stroke: "#c4bcad" },
  juntando: { fill: "#c2502b", stroke: "#8a3418" },
  queda: { fill: "#f0b429", stroke: "#b5841a" },
  fuera: { fill: "#ffffff", stroke: "#c2502b" },
};
