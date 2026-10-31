"use client";

import { useState } from "react";
import { NAC, PODER_INFO, PODER_TXT, conArticulo, dinero } from "@/lib/datos";
import { useLugar } from "@/lib/lugar";
import Barras from "../Barras";
import AniosChart from "./AniosChart";
import HistoriaChart from "./HistoriaChart";

/** "Con crédito": lo que presta el INFONAVIT contra la casa barata y la típica (todo México, o el estado del lugar elegido). */
export function CreditoBarras() {
  const l = useLugar();
  const e = l.estado;
  const barata = e ? e.p25 : NAC.p25;
  const tipica = e ? e.mediana : NAC.mediana;
  const donde = e ? (e.nombre === "Ciudad de México" ? "en la CDMX" : `en ${conArticulo(e.nombre)}`) : "en México";
  return (
    <div>
      <p className="mb-4 text-[14px] font-semibold text-[#c9c1b3]">{e ? e.nombre : "Todo México"}</p>
      <Barras id="credito" oscuro tope={tipica}
        barras={[
          { id: "presta", etiqueta: "Crédito + tu ahorro del INFONAVIT", valor: PODER_INFO, texto: PODER_TXT(), tono: "neutro" },
          { id: "barata", etiqueta: `Una casa barata ${donde}`, valor: barata, texto: dinero(barata), tono: "claro" },
          { id: "tipica", etiqueta: `La casa típica ${donde}`, valor: tipica, texto: dinero(tipica), tono: "tabique" },
        ]} />
      <ul className="mt-5 grid gap-1.5 text-[15px] text-[#f4f0e8]">
        <li className="flex items-center gap-2.5">
          <span aria-hidden className="h-3.5 w-1 rounded-full bg-[#e19a5e]" />
          Para la casa barata te faltan <strong className="font-bold text-[#e19a5e]">{dinero(barata - PODER_INFO)}</strong>
        </li>
        <li className="flex items-center gap-2.5">
          <span aria-hidden className="h-3.5 w-1 rounded-full bg-[#e19a5e]" />
          Para la típica te faltan <strong className="font-bold text-[#e19a5e]">{dinero(tipica - PODER_INFO)}</strong>
        </li>
      </ul>
    </div>
  );
}

/** "Antes y ahora": por defecto, los años de salario; en la segunda pestaña, el precio sin inflación. */
export function AntesPestanas() {
  const [vista, setVista] = useState<"anios" | "precio">("anios");
  return (
    <div>
      <div role="tablist" aria-label="Qué ver" className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-raised p-1">
        {([["anios", "Años de salario"], ["precio", "Lo que cuesta la casa"]] as const).map(([v, t]) => (
          <button key={v} type="button" role="tab" aria-selected={vista === v} onClick={() => setVista(v)}
            className={`min-h-11 cursor-pointer rounded-full px-2 text-[14px] font-semibold transition-colors ${vista === v ? "bg-ink text-white" : "text-ink-2 hover:text-ink"}`}>
            {t}
          </button>
        ))}
      </div>
      {vista === "anios" ? <AniosChart /> : <HistoriaChart />}
    </div>
  );
}
