"use client";

import { useState } from "react";
import { ALCANZABLE, AHORRO_PCT, D, fmt } from "@/lib/datos";
import { useAncho } from "./useAncho";

type Punto = { y: number; anios: number };
const SERIE = D.serieAnios as Punto[];
const TOPE = 80;
const PICO = SERIE.reduce((a, b) => (b.anios > a.anios ? b : a));
const SUBE = 2019; // el mínimo empieza a subir en serio

/**
 * Años ahorrando el 30 % del mínimo para la casa típica nacional, 2005–hoy, contra la vara oficial (20 años, CONAVI).
 * El área entre la línea y la vara va con trama de tabique: es lo que falta. Cruz con globo al pasar o tocar.
 */
export default function AniosChart() {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const [i, setI] = useState<number | null>(null);
  const angosto = ancho < 500;
  const alto = angosto ? 280 : 340;
  const m = { t: 24, r: angosto ? 44 : 64, b: 32, l: 36 };
  const w = Math.max(ancho - m.l - m.r, 10);
  const h = alto - m.t - m.b;
  const x = (k: number) => m.l + (k / (SERIE.length - 1)) * w;
  const y = (v: number) => m.t + h - (v / TOPE) * h;
  const linea = SERIE.map((p, k) => `${k ? "L" : "M"}${x(k)},${y(p.anios)}`).join("");
  const area = `${linea}L${x(SERIE.length - 1)},${y(ALCANZABLE)}L${x(0)},${y(ALCANZABLE)}Z`;
  const kPico = SERIE.indexOf(PICO);
  const kSube = SERIE.findIndex((p) => p.y === SUBE);
  const hoy = SERIE.at(-1)!;

  function mover(ev: React.PointerEvent<SVGRectElement>) {
    const r = ev.currentTarget.getBoundingClientRect();
    const k = Math.round(((ev.clientX - r.left) / r.width) * (SERIE.length - 1));
    setI(Math.min(Math.max(k, 0), SERIE.length - 1));
  }

  return (
    <figure>
      <figcaption className="mb-4">
        <p className="font-semibold">Años para juntar una casa típica con el salario mínimo</p>
        <p className="text-[13px] text-ink-3">Ahorrando el {AHORRO_PCT}% · todo México · precio y salario de cada año</p>
      </figcaption>
      <div ref={ref} className="relative">
        {ancho > 0 && (
          <svg width={ancho} height={alto} role="img" className="block overflow-visible"
            aria-label={`De ${fmt(SERIE[0].anios)} años en ${SERIE[0].y} a ${fmt(PICO.anios)} en ${PICO.y} y ${fmt(hoy.anios)} en ${hoy.y}. El gobierno considera alcanzables ${ALCANZABLE}.`}>
            <defs>
              <pattern id="trama-falta" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="#f6dccf" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--tabique)" strokeWidth="1.6" />
              </pattern>
            </defs>
            {[0, 20, 40, 60, 80].map((v) => (
              <g key={v}>
                <line x1={m.l} x2={m.l + w} y1={y(v)} y2={y(v)} stroke="var(--line)" />
                <text x={m.l - 8} y={y(v)} dy="0.32em" textAnchor="end" className="num fill-ink-3 text-[12px]">{v}</text>
              </g>
            ))}
            {SERIE.filter((p) => (p.y % 5 === 0 && hoy.y - p.y >= 3) || p.y === hoy.y).map((p) => (
              <text key={p.y} x={x(SERIE.indexOf(p))} y={alto - 8} textAnchor="middle" className="num fill-ink-3 text-[12px]">{p.y}</text>
            ))}
            <path d={area} fill="url(#trama-falta)" />
            <line x1={m.l} x2={m.l + w} y1={y(ALCANZABLE)} y2={y(ALCANZABLE)} stroke="var(--ink)" strokeWidth={2} strokeDasharray="6 4" />
            <text x={m.l + 6} y={y(ALCANZABLE) + 16} className="fill-ink text-[12px] font-semibold">Alcanzable según el gobierno: {ALCANZABLE}</text>
            <path d={linea} fill="none" stroke="var(--tabique)" strokeWidth={3} strokeLinejoin="round" />
            {/* Anotaciones */}
            <circle cx={x(kPico)} cy={y(PICO.anios)} r={4.5} fill="var(--tabique)" stroke="var(--surface)" strokeWidth={2} />
            <text x={x(kPico)} y={y(PICO.anios) - 12} textAnchor="middle" className="num fill-ink text-[13px] font-bold">{PICO.y}: {fmt(PICO.anios)} años</text>
            {/* 2019: arriba y a la derecha del punto, donde la línea ya va de bajada y no hay trama */}
            <circle cx={x(kSube)} cy={y(SERIE[kSube].anios)} r={3.5} fill="var(--ink)" />
            <text x={x(kSube) + 8} y={y(SERIE[kSube].anios) - 6} className="fill-ink-2 text-[12px]">
              <tspan>{SUBE}: el mínimo</tspan>
              <tspan x={x(kSube) + 8} dy="1.15em">empieza a subir</tspan>
            </text>
            <circle cx={x(SERIE.length - 1)} cy={y(hoy.anios)} r={5} fill="var(--tabique)" stroke="var(--surface)" strokeWidth={2} />
            <text x={x(SERIE.length - 1) + 9} y={y(hoy.anios)} dy="0.32em" className="num fill-ink text-[14px] font-bold">{fmt(hoy.anios)}</text>
            {i !== null && (
              <g pointerEvents="none">
                <line x1={x(i)} x2={x(i)} y1={m.t} y2={m.t + h} stroke="var(--ink-3)" strokeDasharray="3 3" />
                <circle cx={x(i)} cy={y(SERIE[i].anios)} r={5} fill="var(--tabique)" stroke="var(--surface)" strokeWidth={2} />
              </g>
            )}
            <rect x={m.l} y={m.t} width={w} height={h} fill="transparent" onPointerMove={mover} onPointerDown={mover} onPointerLeave={() => setI(null)} style={{ touchAction: "pan-y" }} />
          </svg>
        )}
        {i !== null && ancho > 0 && (
          <div className="pointer-events-none absolute top-0 z-10 rounded-lg bg-surface px-3 py-2 text-[13px] shadow-[0_6px_24px_rgba(25,23,20,0.16)] ring-1 ring-black/5"
            style={{ left: Math.min(Math.max(x(i) - 70, 0), ancho - 140), width: 140 }}>
            <p className="num font-semibold">{SERIE[i].y}</p>
            <p className="num">{fmt(SERIE[i].anios)} años</p>
          </div>
        )}
      </div>
    </figure>
  );
}
