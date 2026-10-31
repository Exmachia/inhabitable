"use client";

import { elegirLugar, lugarPorClave, mostrarResultado, useLugarElegido } from "@/lib/lugar";

/** Atajos debajo del buscador: los lugares que más gente busca, a un toque. */
const ATAJOS = [
  { id: "mx", label: "Todo México" },
  { id: "09", label: "CDMX" },
  { id: "14039", label: "Guadalajara" },
  { id: "19039", label: "Monterrey" },
  { id: "31050", label: "Mérida" },
  { id: "23005", label: "Cancún" },
];

export default function Atajos() {
  const lugar = useLugarElegido();
  async function ir(id: string) {
    const l = await lugarPorClave(id);
    if (!l) return;
    elegirLugar(l);
    mostrarResultado();
  }
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Lugares frecuentes">
      {ATAJOS.map((a) => {
        const activo = lugar?.id === a.id;
        return (
          <li key={a.id}>
            <button type="button" onClick={() => ir(a.id)} aria-pressed={activo}
              className={`min-h-10 cursor-pointer rounded-full border-2 px-3.5 text-[14px] font-semibold transition-colors ${
                activo ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-ink hover:border-ink"
              }`}>
              {a.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
