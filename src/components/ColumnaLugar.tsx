"use client";

import { useState } from "react";
import { elegirLugar, useLugarElegido } from "@/lib/lugar";
import Resultado from "./Resultado";

/**
 * Columna derecha de la portada: sin lugar, "Caro y barato" (llega del servidor como `caros`); con lugar, la tarjeta de
 * resultado. Aquí vive lo que te llega al mes, para que no se borre al cambiar de lugar (sí al recargar).
 */
export default function ColumnaLugar({ caros }: { caros: React.ReactNode }) {
  const l = useLugarElegido();
  const [mensual, setMensual] = useState<number | null>(null);
  return (
    <div id="resultado" className="scroll-mt-20">
      {l ? <Resultado l={l} mensual={mensual} setMensual={setMensual} onVolver={() => elegirLugar(null)} /> : caros}
    </div>
  );
}
