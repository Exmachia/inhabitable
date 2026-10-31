"use client";

import * as maplibregl from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { BASE, TINTA, agregarEtiquetasEstados, configurarMapLibre, filtrarEtiquetasEstados, prepararBase } from "@/lib/mapa";
import {
  DATO_MUN, DATO_PRECIOS, ESTADOS, PAIS, POR_CVE, RANGOS, SIN_DATO, anios, aniosTxt, cuentas, lugarEstado, lugarMunicipio, rango, rutaDe,
  type Estado, type Lugar, type MunicipioCrudo,
} from "@/lib/datos";
import { registrar } from "@/lib/analytics";
import { elegirLugar as elegir, useLugar, useMunicipios } from "@/lib/lugar";

/** Elegir desde el mapa o su panel: cambia la dirección y cuenta el toque (solo el lugar). */
function elegirLugar(l: Lugar) {
  elegir(l);
  registrar({ nombre: "tocar_mapa", lugar: rutaDe(l).slice(1) || "mexico" });
}

const MEXICO: [number, number, number, number] = [-117.2, 14.4, -86.7, 32.8];
const normaliza = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * Mapa en dos pasos: México por estado → al tocar un estado, se acerca y muestra sus municipios para elegir el tuyo.
 * Lo elegido aquí cambia la respuesta de todo el sitio (y al revés).
 */
export default function MapaMexico() {
  const caja = useRef<HTMLDivElement>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const [listo, setListo] = useState(false);
  const lugar = useLugar();
  const municipios = useMunicipios();
  const porG = useMemo(() => new Map((municipios ?? []).map((m) => [m.g, m])), [municipios]);
  const porGRef = useRef(porG);
  useEffect(() => {
    porGRef.current = porG;
  }, [porG]);

  // Qué estado y qué municipio están abiertos (un municipio sin datos llega como su estado + "prestado").
  const estado: Estado | null = lugar.estado ?? null;
  const munActivo = lugar.tipo === "municipio" ? lugar.id : lugar.prestado?.g ?? null;

  // Mapa: se crea una vez.
  useEffect(() => {
    if (!caja.current) return;
    configurarMapLibre(maplibregl);
    const map = new maplibregl.Map({
      container: caja.current,
      style: BASE,
      bounds: MEXICO,
      fitBoundsOptions: { padding: 12 },
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      cooperativeGestures: true,
      locale: {
        "CooperativeGesturesHandler.WindowsHelpText": "Usa Ctrl + rueda para acercar",
        "CooperativeGesturesHandler.MacHelpText": "Usa ⌘ + rueda para acercar",
        "CooperativeGesturesHandler.MobileHelpText": "Usa dos dedos para mover el mapa",
      },
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapa.current = map;

    map.on("load", () => {
      const antes = prepararBase(map);
      const color = ["match", ["get", "CVE_ENT"], ...ESTADOS.flatMap((e) => [e.cve, rango(e.anios30).hex]), SIN_DATO] as unknown as maplibregl.ExpressionSpecification;
      map.addSource("estados", { type: "geojson", data: "/data/estados.geojson", promoteId: "CVE_ENT" });
      map.addSource("mun", { type: "geojson", data: { type: "FeatureCollection", features: [] }, promoteId: "CVEGEO" });
      map.addLayer({ id: "estados-relleno", type: "fill", source: "estados", paint: { "fill-color": color, "fill-opacity": 0.92 } }, antes);
      map.addLayer({ id: "mun-relleno", type: "fill", source: "mun", paint: { "fill-color": SIN_DATO, "fill-opacity": 0.95 } }, antes);
      map.addLayer({ id: "mun-linea", type: "line", source: "mun", paint: { "line-color": "#ffffff", "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.4, 9, 1.2] } }, antes);
      map.addLayer({ id: "estados-linea", type: "line", source: "estados", paint: { "line-color": "#ffffff", "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.8, 8, 2] } }, antes);
      map.addLayer({
        id: "estados-activo", type: "line", source: "estados",
        paint: { "line-color": TINTA, "line-width": ["case", ["boolean", ["feature-state", "abierto"], false], 2.5, ["boolean", ["feature-state", "encima"], false], 1.5, 0] },
      });
      map.addLayer({
        id: "mun-activo", type: "line", source: "mun",
        paint: { "line-color": TINTA, "line-width": ["case", ["boolean", ["feature-state", "elegido"], false], 3.5, ["boolean", ["feature-state", "encima"], false], 1.5, 0] },
      });
      agregarEtiquetasEstados(map);
      setListo(true);
    });

    // Globo al pasar el mouse (en celular no: se quedaría pegado).
    const conMouse = window.matchMedia("(hover: hover)").matches;
    const globo = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12, className: "globo" });
    let encima: { fuente: string; id: string } | null = null;
    const quitar = () => {
      if (encima) map.setFeatureState({ source: encima.fuente, id: encima.id }, { encima: false });
      encima = null;
      globo.remove();
      map.getCanvas().style.cursor = "";
    };
    const sobre = (fuente: string, id: string, html: string, ll: maplibregl.LngLat) => {
      if (encima?.id !== id) {
        quitar();
        encima = { fuente, id };
        map.setFeatureState({ source: fuente, id }, { encima: true });
      }
      map.getCanvas().style.cursor = "pointer";
      if (conMouse) globo.setLngLat(ll).setHTML(html).addTo(map);
    };

    // Los municipios van encima de los estados: tienen prioridad.
    map.on("mousemove", (ev) => {
      const mun = map.queryRenderedFeatures(ev.point, { layers: ["mun-relleno"] })[0];
      const m = mun ? porGRef.current.get(mun.properties?.CVEGEO as string) : undefined;
      if (m) return sobre("mun", m.g, `<strong>${m.n}</strong><br>${m.a != null ? `${aniosTxt(m.a, !!m.t)} años` : "pocos datos"}`, ev.lngLat);
      const est = map.queryRenderedFeatures(ev.point, { layers: ["estados-relleno"] })[0];
      const e = est ? POR_CVE.get(est.properties?.CVE_ENT as string) : undefined;
      if (e) return sobre("estados", e.cve, `<strong>${e.nombre}</strong><br>${anios(e.anios30)} años · toca para ver sus municipios`, ev.lngLat);
      quitar();
    });
    map.on("mouseout", quitar);
    map.on("click", (ev) => {
      const mun = map.queryRenderedFeatures(ev.point, { layers: ["mun-relleno"] })[0];
      const m = mun ? porGRef.current.get(mun.properties?.CVEGEO as string) : undefined;
      if (m) return elegirLugar(lugarMunicipio(m));
      const est = map.queryRenderedFeatures(ev.point, { layers: ["estados-relleno"] })[0];
      const e = est ? POR_CVE.get(est.properties?.CVE_ENT as string) : undefined;
      if (e) elegirLugar(lugarEstado(e));
    });

    return () => map.remove();
  }, []);

  // Estado abierto → sus municipios en el mapa; el resto de los estados, atenuado.
  const cveAbierto = estado?.cve ?? null;
  useEffect(() => {
    const map = mapa.current;
    if (!map || !listo) return;
    for (const e of ESTADOS) map.setFeatureState({ source: "estados", id: e.cve }, { abierto: e.cve === cveAbierto });
    filtrarEtiquetasEstados(map, cveAbierto);
    map.setPaintProperty("estados-relleno", "fill-opacity", cveAbierto ? ["case", ["==", ["get", "CVE_ENT"], cveAbierto], 0, 0.4] : 0.92);
    const fuente = map.getSource("mun") as maplibregl.GeoJSONSource;
    fuente.setData(cveAbierto ? `/data/mun/${cveAbierto}.json` : { type: "FeatureCollection", features: [] });
  }, [cveAbierto, listo]);

  // Colores de los municipios del estado abierto.
  useEffect(() => {
    const map = mapa.current;
    if (!map || !listo || !municipios || !cveAbierto) return;
    const deEstado = municipios.filter((m) => m.ent === cveAbierto && m.a != null);
    const color = deEstado.length
      ? (["match", ["get", "CVEGEO"], ...deEstado.flatMap((m) => [m.g, rango(m.a!).hex]), SIN_DATO] as unknown as maplibregl.ExpressionSpecification)
      : SIN_DATO;
    map.setPaintProperty("mun-relleno", "fill-color", color);
  }, [municipios, cveAbierto, listo]);

  // Municipio elegido → contorno.
  useEffect(() => {
    const map = mapa.current;
    if (!map || !listo || !municipios || !cveAbierto) return;
    for (const m of municipios) if (m.ent === cveAbierto) map.setFeatureState({ source: "mun", id: m.g }, { elegido: m.g === munActivo });
  }, [munActivo, cveAbierto, municipios, listo]);

  // Encuadre: país, estado o municipio.
  useEffect(() => {
    const map = mapa.current;
    if (!map || !listo) return;
    const m = munActivo ? porG.get(munActivo) : undefined;
    const b = m?.b ?? estado?.b ?? MEXICO;
    const angosto = window.innerWidth < 1024;
    map.fitBounds(b as [number, number, number, number], {
      padding: angosto ? 20 : { top: 40, right: 60, bottom: 40, left: 440 },
      duration: 800,
      maxZoom: m ? 9.5 : 8,
    });
  }, [munActivo, estado, listo, porG]);

  return (
    <div className="overflow-hidden rounded-[28px] border-2 border-ink bg-surface shadow-[0_8px_0_0_var(--ink)]">
      <div className="relative lg:h-[min(84vh,800px)]">
        <div id="mapa-caja" ref={caja} className="h-[56vh] min-h-[340px] w-full scroll-mt-20 lg:absolute lg:inset-0 lg:h-full" role="region" aria-label="Mapa de México: toca un estado para ver sus municipios" />
        <Leyenda />
        <div className="border-t-2 border-ink lg:absolute lg:top-4 lg:bottom-4 lg:left-4 lg:flex lg:w-[400px] lg:flex-col lg:overflow-hidden lg:rounded-3xl lg:border-2 lg:border-ink lg:bg-surface lg:shadow-[0_6px_0_0_var(--ink)]">
          <Panel estado={estado} munActivo={munActivo} municipios={municipios} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Panel: lista de estados, o de municipios del estado abierto ---------- */

function Panel({ estado, munActivo, municipios }: { estado: Estado | null; munActivo: string | null; municipios: MunicipioCrudo[] | null }) {
  const [q, setQ] = useState("");
  const [todos, setTodos] = useState(false);
  const [abiertoPara, setAbiertoPara] = useState(estado?.cve);
  if (abiertoPara !== estado?.cve) {
    // Al cambiar de estado se limpia el filtro y se vuelve a la lista corta.
    setAbiertoPara(estado?.cve);
    setQ("");
    setTodos(false);
  }
  const subirAlMapa = () => {
    if (window.innerWidth < 1024) document.getElementById("mapa-caja")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!estado) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="px-5 pt-5 pb-3">
          <p className="text-[12px] font-bold tracking-[0.08em] text-ink-3 uppercase">Paso 1 de 2</p>
          <h3 className="font-display text-[1.6rem] leading-tight font-extrabold tracking-[-0.02em]">Toca tu estado</h3>
          <p className="mt-1 text-[13px] text-ink-3">Años ahorrando el 30% del salario mínimo · {DATO_PRECIOS}</p>
        </div>
        <ol className={`min-h-0 flex-1 overflow-y-auto px-3 pb-3 ${todos ? "" : "max-lg:[&>li:nth-child(n+9)]:hidden"}`}>
          {ESTADOS.map((e, i) => (
            <Fila key={e.cve} n={i + 1} nombre={e.nombre} anios={anios(e.anios30)} color={rango(e.anios30).color} flecha
              onClick={() => { elegirLugar(lugarEstado(e)); subirAlMapa(); }} />
          ))}
        </ol>
        {!todos && <VerTodos onClick={() => setTodos(true)} texto="Ver los 32 estados" />}
      </div>
    );
  }

  const lista = (municipios ?? []).filter((m) => m.ent === estado.cve);
  const conDato = lista.filter((m) => m.a != null).sort((a, b) => b.a! - a.a!);
  const sinDato = lista.filter((m) => m.a == null).sort((a, b) => a.n.localeCompare(b.n, "es"));
  const t = normaliza(q);
  const filtrar = (m: MunicipioCrudo) => !t || normaliza(m.n).includes(t);
  const visibles = [...conDato.filter(filtrar), ...sinDato.filter(filtrar)];
  const elegido = munActivo ? lista.find((m) => m.g === munActivo) : undefined;
  const c = cuentas(lugarEstado(estado));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-5 pt-4 pb-3">
        <button type="button" onClick={() => elegirLugar(PAIS)}
          className="-ml-2 inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-full px-2 text-[14px] font-semibold text-ink-2 hover:bg-raised hover:text-ink">
          <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg>
          Todo México
        </button>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h3 className="min-w-0 truncate font-display text-[1.6rem] leading-tight font-extrabold tracking-[-0.02em]">{estado.nombre}</h3>
          <p className="shrink-0 pb-0.5 text-[14px]"><span className="cifra text-[1.8rem] leading-none font-extrabold">{anios(c.ahorrando)}</span> años</p>
        </div>

        {elegido && (
          <a href="#resultado" className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-ink bg-obra px-3.5 py-2.5">
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-bold tracking-[0.06em] uppercase">Tu municipio · Ver tu vida ↑</span>
              <span className="block truncate text-[16px] font-bold">{elegido.n}</span>
            </span>
            <span className="cifra shrink-0 text-[1.8rem] leading-none font-extrabold">{elegido.a != null ? aniosTxt(elegido.a, !!elegido.t) : "—"}</span>
            <span className="shrink-0 text-[13px] font-semibold">{elegido.a != null ? "años" : "pocos datos"}</span>
          </a>
        )}

        <p className="mt-4 text-[12px] font-bold tracking-[0.08em] text-ink-3 uppercase">Paso 2 de 2 · elige tu municipio</p>
        <label className="relative mt-2 block">
          <span className="sr-only">Busca tu municipio en {estado.nombre}</span>
          <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Busca en ${estado.nombre}`}
            className="h-11 w-full rounded-full border-2 border-ink-3 bg-surface pr-3 pl-10 text-[15px] outline-none focus:border-ink" />
        </label>
      </div>
      {!municipios ? (
        <p className="px-5 pb-5 text-[14px] text-ink-3">Cargando municipios…</p>
      ) : (
        <>
          <ol className={`min-h-0 flex-1 overflow-y-auto px-3 pb-3 ${todos || t ? "" : "max-lg:[&>li:nth-child(n+9)]:hidden"}`}>
            {visibles.map((m) => (
              <Fila key={m.g} nombre={m.n} activo={m.g === munActivo}
                anios={m.a != null ? aniosTxt(m.a, !!m.t) : ""} color={m.a != null ? rango(m.a).color : "var(--sin-dato)"}
                sub={m.a == null ? "pocos créditos para calcularlo" : m.p != null && m.p < estado.p25 ? "estimación baja" : undefined}
                onClick={() => { elegirLugar(lugarMunicipio(m)); subirAlMapa(); }} />
            ))}
            {visibles.length === 0 && <li className="px-2 py-3 text-[14px] text-ink-3">No hay un municipio con ese nombre en {estado.nombre}.</li>}
          </ol>
          {!todos && !t && visibles.length > 8 && <VerTodos onClick={() => setTodos(true)} texto={`Ver los ${visibles.length} municipios`} />}
          <p className="border-t border-line px-5 py-2.5 text-[12px] text-ink-3">{DATO_MUN} · estimación conservadora</p>
        </>
      )}
    </div>
  );
}

function Fila({ n, nombre, sub, anios: a, color, onClick, activo, flecha }: {
  n?: number; nombre: string; sub?: string; anios: string; color: string; onClick: () => void; activo?: boolean; flecha?: boolean;
}) {
  return (
    <li>
      <button type="button" onClick={onClick} aria-current={activo ? "true" : undefined}
        className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors ${activo ? "bg-raised" : "hover:bg-raised/70"}`}>
        {n != null && <span className="num w-5 shrink-0 text-[12px] font-semibold text-ink-3">{n}</span>}
        <span aria-hidden className="size-3.5 shrink-0 rounded-[4px] ring-1 ring-black/15" style={{ background: color }} />
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[15px] ${activo ? "font-bold" : "font-medium"}`}>{nombre}</span>
          {sub && <span className="block truncate text-[12px] text-ink-3">{sub}</span>}
        </span>
        {a && <span className="num shrink-0 text-[15px] font-bold">{a} años</span>}
        {flecha && <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>}
      </button>
    </li>
  );
}

function VerTodos({ onClick, texto }: { onClick: () => void; texto: string }) {
  return (
    <div className="px-5 pb-4 lg:hidden">
      <button type="button" onClick={onClick} className="min-h-11 w-full cursor-pointer rounded-full border-2 border-ink text-[14px] font-bold hover:bg-raised">{texto}</button>
    </div>
  );
}

function Leyenda() {
  return (
    <div className="border-t-2 border-ink px-5 py-3 text-[12px] lg:pointer-events-none lg:absolute lg:right-3 lg:bottom-8 lg:rounded-2xl lg:border-2 lg:bg-surface/95 lg:px-3 lg:py-2">
      <p className="mb-1 font-semibold">Años ahorrando el 30%</p>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-ink-2 lg:grid lg:grid-cols-2">
        {RANGOS.map((r) => (
          <span key={r.label} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-[3px] ring-1 ring-black/15" style={{ background: r.color }} />
            {r.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-[3px] ring-1 ring-black/15" style={{ background: "var(--sin-dato)" }} />
          pocos datos
        </span>
      </div>
    </div>
  );
}
