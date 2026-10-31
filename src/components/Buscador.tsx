"use client";

import { useId, useMemo, useRef, useState } from "react";
import { ESTADOS, PAIS, POR_CVE, anios, aniosTxt, cuentas, lugarEstado, lugarMunicipio, rango, rutaDe, type Lugar } from "@/lib/datos";
import { registrar } from "@/lib/analytics";
import { elegirLugar, mostrarResultado, useMunicipios } from "@/lib/lugar";

type Opcion = { key: string; tipo: string; label: string; sub: string; color?: string; lugar: () => Lugar };

const normaliza = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const BASE: Opcion[] = [
  { key: "todo mexico", tipo: "País", label: "Todo México", sub: `${anios(cuentas(PAIS).ahorrando)} años`, lugar: () => PAIS },
  ...ESTADOS.map((e) => ({
    key: normaliza(e.nombre), tipo: "Estado", label: e.nombre, sub: `${anios(e.anios30)} años`,
    color: rango(e.anios30).color, lugar: () => lugarEstado(e),
  })),
];

/**
 * Combobox accesible (↑ ↓ Enter Esc): busca entre el país, los 32 estados y los 2,475 municipios.
 * Orden: coincidencia exacta → inicio de palabra → contiene; los estados antes que los municipios.
 */
export default function Buscador({ grande, onElegido }: { grande?: boolean; onElegido?: (l: Lugar) => void }) {
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const municipios = useMunicipios();

  const opciones = useMemo(() => {
    if (!municipios) return BASE;
    return [
      ...BASE,
      ...municipios.map((m) => {
        const e = POR_CVE.get(m.ent)!;
        return {
          key: normaliza(m.n), tipo: "Municipio", label: m.n,
          sub: m.a != null ? `${e.nombre} · ${aniosTxt(m.a, !!m.t)} años` : `${e.nombre} · pocos datos`,
          color: m.a != null ? rango(m.a).color : undefined,
          lugar: () => lugarMunicipio(m),
        };
      }),
    ];
  }, [municipios]);

  const resultados = useMemo(() => {
    const t = normaliza(q);
    if (t.length < 2) return [];
    const exacto: Opcion[] = [], inicio: Opcion[] = [], contiene: Opcion[] = [];
    for (const o of opciones) {
      if (o.key === t) exacto.push(o);
      else if (o.key.startsWith(t) || o.key.split(/[\s-]/).some((w) => w.startsWith(t))) inicio.push(o);
      else if (o.key.includes(t)) contiene.push(o);
    }
    return [...exacto, ...inicio, ...contiene].slice(0, 8);
  }, [q, opciones]);

  function elegir(o: Opcion) {
    const l = o.lugar();
    elegirLugar(l);
    registrar({ nombre: "buscar_lugar", lugar: rutaDe(l).slice(1) || "mexico" });
    if (grande) mostrarResultado();
    onElegido?.(l);
    setQ("");
    setAbierto(false);
    input.current?.blur();
  }

  function teclas(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") return setAbierto(false);
    if (!resultados.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAbierto(true);
      setActivo((i) => (i + 1) % resultados.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => (i - 1 + resultados.length) % resultados.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      elegir(resultados[activo]);
    }
  }

  const desplegado = abierto && normaliza(q).length >= 2;

  return (
    <div className="relative">
      <label htmlFor={`${id}-in`} className="sr-only">Busca tu estado o municipio</label>
      <div className="relative">
        <svg aria-hidden viewBox="0 0 24 24" className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-2 ${grande ? "left-5 size-6" : "left-4 size-5"}`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={input}
          id={`${id}-in`}
          type="search"
          autoComplete="off"
          spellCheck={false}
          placeholder="Escribe tu municipio o estado"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAbierto(true);
            setActivo(0);
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setTimeout(() => setAbierto(false), 120)}
          onKeyDown={teclas}
          role="combobox"
          aria-expanded={desplegado}
          aria-controls={`${id}-lista`}
          aria-autocomplete="list"
          aria-activedescendant={desplegado && resultados[activo] ? `${id}-${activo}` : undefined}
          className={`w-full rounded-full border-2 border-ink bg-surface text-ink shadow-[0_4px_0_0_var(--ink)] outline-none focus-visible:outline-none placeholder:text-ink-3 focus:shadow-[0_4px_0_0_var(--ink),0_0_0_4px_rgba(31,111,199,0.25)] ${
            grande ? "h-16 pr-5 pl-14 text-[18px]" : "h-13 pr-4 pl-12 text-[16px]"
          }`}
        />
      </div>

      {desplegado && (
        <ul id={`${id}-lista`} role="listbox"
          className="absolute inset-x-0 top-full z-40 mt-3 max-h-[24rem] overflow-y-auto rounded-3xl border-2 border-ink bg-surface p-1.5 shadow-[0_18px_40px_rgba(28,26,23,0.18)]">
          {resultados.length === 0 && (
            <li className="px-4 py-3 text-[15px] text-ink-2">
              {municipios ? `No encontramos “${q}”. Revisa cómo se escribe o busca tu estado.` : "Cargando municipios…"}
            </li>
          )}
          {resultados.map((r, i) => (
            <li key={`${r.tipo}-${r.label}-${r.sub}`} id={`${id}-${i}`} role="option" aria-selected={i === activo}
              onMouseDown={(e) => e.preventDefault()} onClick={() => elegir(r)} onMouseEnter={() => setActivo(i)}
              className={`flex min-h-13 cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-2 ${i === activo ? "bg-raised" : ""}`}>
              <span aria-hidden className="size-3 shrink-0 rounded-[3px] ring-1 ring-black/15" style={{ background: r.color ?? "var(--sin-dato)" }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-semibold">{r.label}</span>
                <span className="block truncate text-[13px] text-ink-3">{r.tipo === "Municipio" ? r.sub : `${r.tipo} · ${r.sub}`}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
