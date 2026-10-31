"use client";

import { useState } from "react";
import { D, fmt } from "@/lib/datos";
import { useAncho } from "./useAncho";

type Punto = { y: number; real: number };
const SERIES = [
  { id: "peor", nombre: D.historia.peor.nombre, color: "var(--tabique)", datos: D.historia.peor.serie as Punto[] },
  { id: "mx", nombre: "Todo México", color: "var(--neutro)", datos: D.historia.nacional as Punto[] },
];
const ANIOS = SERIES[1].datos.map((p) => p.y);
const MAX = Math.max(...SERIES.flatMap((s) => s.datos.map((p) => p.real)));
const TOPE = Math.ceil(MAX / 1e6) * 1e6;
const mdp = (n: number) => `${fmt(n / 1e6, 1)} mdp`;

/** Precio típico de una casa, en pesos de hoy (sin inflación), cada año desde 2005. Línea + cruz con globo al pasar. */
export default function HistoriaChart() {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const [i, setI] = useState<number | null>(null);
  const alto = ancho < 500 ? 280 : 340;
  const m = { t: 16, r: ancho < 500 ? 76 : 120, b: 32, l: 44 };
  const w = Math.max(ancho - m.l - m.r, 10);
  const h = alto - m.t - m.b;
  const x = (k: number) => m.l + (k / (ANIOS.length - 1)) * w;
  const y = (v: number) => m.t + h - (v / TOPE) * h;
  const marcas = Array.from({ length: TOPE / 1e6 + 1 }, (_, k) => k * 1e6);

  function mover(ev: React.PointerEvent<SVGRectElement>) {
    const r = ev.currentTarget.getBoundingClientRect();
    const k = Math.round(((ev.clientX - r.left) / r.width) * (ANIOS.length - 1));
    setI(Math.min(Math.max(k, 0), ANIOS.length - 1));
  }

  return (
    <figure>
      <figcaption className="mb-4">
        <p className="font-semibold">Precio típico de una casa, sin inflación</p>
        <p className="text-[13px] text-ink-3">Millones de pesos de {ANIOS.at(-1)} · enero–junio de cada año</p>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-2">
          {SERIES.map((s) => (
            <li key={s.id} className="inline-flex items-center gap-2">
              <span aria-hidden className="h-0.5 w-5 rounded-full" style={{ background: s.color }} />{s.nombre}
            </li>
          ))}
        </ul>
      </figcaption>
      <div ref={ref} className="relative">
        {ancho > 0 && (
          <svg width={ancho} height={alto} role="img" className="block overflow-visible"
            aria-label={SERIES.map((s) => `${s.nombre}: de ${mdp(s.datos[0].real)} en ${ANIOS[0]} a ${mdp(s.datos.at(-1)!.real)} en ${ANIOS.at(-1)}`).join(". ")}>
            {marcas.map((v) => (
              <g key={v}>
                <line x1={m.l} x2={m.l + w} y1={y(v)} y2={y(v)} stroke="var(--line)" />
                <text x={m.l - 8} y={y(v)} dy="0.32em" textAnchor="end" className="num fill-ink-3 text-[12px]">{v / 1e6}</text>
              </g>
            ))}
            {ANIOS.filter((a) => (a % 5 === 0 && ANIOS.at(-1)! - a >= 3) || a === ANIOS.at(-1)).map((a) => (
              <text key={a} x={x(ANIOS.indexOf(a))} y={alto - 8} textAnchor="middle" className="num fill-ink-3 text-[12px]">{a}</text>
            ))}
            {SERIES.map((s) => (
              <g key={s.id}>
                <path d={s.datos.map((p, k) => `${k ? "L" : "M"}${x(k)},${y(p.real)}`).join("")} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
                {/* Etiqueta directa al final de cada línea */}
                <circle cx={x(s.datos.length - 1)} cy={y(s.datos.at(-1)!.real)} r={4} fill={s.color} stroke="var(--bg)" strokeWidth={2} />
                <text x={x(s.datos.length - 1) + 10} y={y(s.datos.at(-1)!.real)} dy="0.32em" className="num fill-ink text-[13px] font-semibold">
                  {mdp(s.datos.at(-1)!.real)}
                </text>
                <circle cx={x(0)} cy={y(s.datos[0].real)} r={3} fill={s.color} />
              </g>
            ))}
            {i !== null && (
              <g pointerEvents="none">
                <line x1={x(i)} x2={x(i)} y1={m.t} y2={m.t + h} stroke="var(--ink-3)" strokeDasharray="3 3" />
                {SERIES.map((s) => <circle key={s.id} cx={x(i)} cy={y(s.datos[i].real)} r={5} fill={s.color} stroke="var(--bg)" strokeWidth={2} />)}
              </g>
            )}
            <rect x={m.l} y={m.t} width={w} height={h} fill="transparent" onPointerMove={mover} onPointerDown={mover} onPointerLeave={() => setI(null)} style={{ touchAction: "pan-y" }} />
          </svg>
        )}
        {i !== null && ancho > 0 && (
          <div className="pointer-events-none absolute top-0 z-10 rounded-lg bg-surface px-3 py-2 text-[13px] shadow-[0_6px_24px_rgba(25,23,20,0.16)] ring-1 ring-black/5"
            style={{ left: Math.min(Math.max(x(i) - 80, 0), ancho - 170), width: 170 }}>
            <p className="num font-semibold">{ANIOS[i]}</p>
            {SERIES.map((s) => (
              <p key={s.id} className="flex items-center gap-2">
                <span aria-hidden className="size-2 rounded-full" style={{ background: s.color }} />
                <span className="flex-1 truncate text-ink-2">{s.nombre}</span>
                <span className="num font-semibold">{mdp(s.datos[i].real)}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}
