"use client";

import * as maplibregl from "maplibre-gl";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BASE, TINTA, agregarEtiquetasEstados, configurarMapLibre, filtrarEtiquetasEstados, prepararBase } from "@/lib/mapa";
import {
  DATO_MUN, DATO_PRECIOS, EDAD_INICIO, ESTADOS, POR_CVE, POR_SLUG, RANGOS, SIN_DATO, TOPE_ANIOS, anios, aniosTxt, conArticulo, cuentas, dinero,
  lugarEstado, lugarMunicipio, rango, rutaDe, slugMunicipio, type Estado, type MunicipioCrudo,
} from "@/lib/datos";
import { registrar } from "@/lib/analytics";
import { useMunicipios } from "@/lib/lugar";
import Marca from "../Marca";
import PanelMapa, { visibleMovil, type Nivel } from "./PanelMapa";

const MEXICO: [number, number, number, number] = [-117.2, 14.4, -86.7, 32.8];
const normaliza = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Lo elegido en el mapa: nada (todo México), un estado o un municipio de ese estado. */
type Sel = { estado: Estado | null; mun: MunicipioCrudo | null };
const NADA: Sel = { estado: null, mun: null };

/** /mapa?e=jalisco&m=guadalajara */
function urlDe(s: Sel) {
  if (!s.estado) return "/mapa";
  const p = new URLSearchParams({ e: s.estado.slug });
  if (s.mun) p.set("m", slugMunicipio(s.mun));
  return `/mapa?${p}`;
}
function selDeUrl(municipios: MunicipioCrudo[] | null): Sel {
  const p = new URLSearchParams(window.location.search);
  const estado = POR_SLUG.get(p.get("e") ?? "") ?? null;
  if (!estado) return NADA;
  const m = p.get("m");
  const mun = m && municipios ? municipios.find((x) => x.ent === estado.cve && slugMunicipio(x) === m) ?? null : null;
  return { estado, mun };
}

/**
 * El mapa a pantalla completa. Tres niveles: México → estado (con sus municipios) → municipio.
 * Tocar fuera de lo abierto regresa: fuera del estado, a todo México; el mismo municipio otra vez, a su estado. Esc sube un nivel.
 */
export default function MapaCompleto() {
  const caja = useRef<HTMLDivElement>(null);
  const cuerpo = useRef<HTMLDivElement>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const [listo, setListo] = useState(false);
  const municipios = useMunicipios();
  const porG = useMemo(() => new Map((municipios ?? []).map((m) => [m.g, m])), [municipios]);
  const [sel, setSel] = useState<Sel>(NADA);
  const [escritorio, setEscritorio] = useState(true);
  const [abierto, setAbierto] = useState(true);
  const [nivel, setNivel] = useState<Nivel>("bajo");
  const [altoMapa, setAltoMapa] = useState(0);

  // Referencias para los manejadores del mapa (se crean una sola vez).
  const selRef = useRef(sel);
  const porGRef = useRef(porG);
  useEffect(() => {
    selRef.current = sel;
    porGRef.current = porG;
  });

  /** Cambia la selección y la dirección (atrás/adelante del navegador recorren los niveles). */
  const ir = useCallback((s: Sel) => {
    setSel(s);
    const url = urlDe(s);
    if (url !== window.location.pathname + window.location.search) window.history.pushState(null, "", url);
    if (s.estado) registrar({ nombre: "tocar_mapa", lugar: rutaDe(s.mun ? lugarMunicipio(s.mun) : lugarEstado(s.estado)).slice(1) });
    // En celular, al abrir algo la hoja sube a la mitad para mostrarlo; al volver a México, baja.
    setNivel(s.estado ? "medio" : "bajo");
    cuerpo.current?.scrollTo({ top: 0 });
  }, []);
  const subir = useCallback(() => {
    const s = selRef.current;
    if (s.mun) ir({ estado: s.estado, mun: null });
    else if (s.estado) ir(NADA);
  }, [ir]);

  // Dirección → selección (al cargar, cuando llegan los municipios y con atrás/adelante).
  useEffect(() => {
    const leer = () => {
      const s = selDeUrl(municipios);
      setSel(s);
      if (s.estado) setNivel("medio"); // si llega con un lugar (enlace compartido), la hoja muestra su ficha
    };
    leer();
    window.addEventListener("popstate", leer);
    return () => window.removeEventListener("popstate", leer);
  }, [municipios]);

  // Escritorio o celular, y alto del mapa (para la hoja inferior).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const f = () => setEscritorio(mq.matches);
    f();
    mq.addEventListener("change", f);
    const ro = new ResizeObserver(([e]) => setAltoMapa(Math.round(e.contentRect.height)));
    if (caja.current) ro.observe(caja.current);
    return () => {
      mq.removeEventListener("change", f);
      ro.disconnect();
    };
  }, []);

  // Esc sube un nivel.
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || document.querySelector("dialog[open]")) return;
      if ((e.target as HTMLElement)?.tagName === "INPUT" && (e.target as HTMLInputElement).value) return;
      subir();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [subir]);

  // Mapa: se crea una vez.
  useEffect(() => {
    if (!caja.current) return;
    configurarMapLibre(maplibregl);
    const map = new maplibregl.Map({
      container: caja.current,
      style: BASE,
      bounds: MEXICO,
      fitBoundsOptions: { padding: 24 },
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
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
        paint: { "line-color": TINTA, "line-width": ["case", ["boolean", ["feature-state", "abierto"], false], 3, ["boolean", ["feature-state", "encima"], false], 1.5, 0] },
      });
      map.addLayer({
        id: "mun-activo", type: "line", source: "mun",
        paint: { "line-color": TINTA, "line-width": ["case", ["boolean", ["feature-state", "elegido"], false], 4, ["boolean", ["feature-state", "encima"], false], 1.5, 0] },
      });
      agregarEtiquetasEstados(map);
      setListo(true);
    });

    // Globo al pasar el mouse: dice qué es y qué pasa si lo tocas (en celular no: se quedaría pegado).
    const conMouse = window.matchMedia("(hover: hover)").matches;
    const globo = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 14, className: "globo" });
    let encima: { fuente: string; id: string } | null = null;
    const quitarEncima = () => {
      if (encima) map.setFeatureState({ source: encima.fuente, id: encima.id }, { encima: false });
      encima = null;
    };
    const mostrar = (html: string, ll: maplibregl.LngLat) => {
      map.getCanvas().style.cursor = "pointer";
      if (conMouse) globo.setLngLat(ll).setHTML(html).addTo(map);
    };
    const resaltar = (fuente: string, id: string) => {
      if (encima?.id === id) return;
      quitarEncima();
      encima = { fuente, id };
      map.setFeatureState({ source: fuente, id }, { encima: true });
    };

    map.on("mousemove", (ev) => {
      const s = selRef.current;
      const mun = map.queryRenderedFeatures(ev.point, { layers: ["mun-relleno"] })[0];
      const m = mun ? porGRef.current.get(mun.properties?.CVEGEO as string) : undefined;
      if (m) {
        resaltar("mun", m.g);
        const dato = m.a != null ? `${aniosTxt(m.a, !!m.t)} años` : "pocos datos";
        return mostrar(`<strong>${m.n}</strong><br>${dato}${s.mun?.g === m.g ? " · toca para volver al estado" : ""}`, ev.lngLat);
      }
      quitarEncima();
      if (s.estado) {
        // Fuera del estado abierto: tocar regresa a todo México.
        map.getCanvas().style.cursor = "pointer";
        if (conMouse) globo.setLngLat(ev.lngLat).setHTML("Toca para volver a todo México").addTo(map);
        return;
      }
      const est = map.queryRenderedFeatures(ev.point, { layers: ["estados-relleno"] })[0];
      const e = est ? POR_CVE.get(est.properties?.CVE_ENT as string) : undefined;
      if (e) {
        resaltar("estados", e.cve);
        return mostrar(`<strong>${e.nombre}</strong><br>${anios(e.anios30)} años · toca para ver sus municipios`, ev.lngLat);
      }
      globo.remove();
      map.getCanvas().style.cursor = "";
    });
    map.on("mouseout", () => {
      quitarEncima();
      globo.remove();
    });

    map.on("click", (ev) => {
      const s = selRef.current;
      const mun = map.queryRenderedFeatures(ev.point, { layers: ["mun-relleno"] })[0];
      const m = mun ? porGRef.current.get(mun.properties?.CVEGEO as string) : undefined;
      if (s.estado) {
        if (!m) return ir(NADA); // fuera del estado: todo México
        if (s.mun?.g === m.g) return ir({ estado: s.estado, mun: null }); // el mismo municipio: su estado
        return ir({ estado: s.estado, mun: m });
      }
      const est = map.queryRenderedFeatures(ev.point, { layers: ["estados-relleno"] })[0];
      const e = est ? POR_CVE.get(est.properties?.CVE_ENT as string) : undefined;
      if (e) ir({ estado: e, mun: null });
    });

    return () => map.remove();
  }, [ir]);

  // Estado abierto → sus municipios; los demás estados, atenuados.
  const cve = sel.estado?.cve ?? null;
  useEffect(() => {
    const map = mapa.current;
    if (!map || !listo) return;
    for (const e of ESTADOS) map.setFeatureState({ source: "estados", id: e.cve }, { abierto: e.cve === cve });
    filtrarEtiquetasEstados(map, cve);
    map.setPaintProperty("estados-relleno", "fill-opacity", cve ? ["case", ["==", ["get", "CVE_ENT"], cve], 0, 0.35] : 0.92);
    (map.getSource("mun") as maplibregl.GeoJSONSource).setData(cve ? `/data/mun/${cve}.json` : { type: "FeatureCollection", features: [] });
  }, [cve, listo]);

  // Colores de los municipios del estado abierto.
  useEffect(() => {
    const map = mapa.current;
    if (!map || !listo || !municipios || !cve) return;
    const con = municipios.filter((m) => m.ent === cve && m.a != null);
    map.setPaintProperty("mun-relleno", "fill-color", con.length
      ? (["match", ["get", "CVEGEO"], ...con.flatMap((m) => [m.g, rango(m.a!).hex]), SIN_DATO] as unknown as maplibregl.ExpressionSpecification)
      : SIN_DATO);
  }, [municipios, cve, listo]);

  // Municipio elegido → contorno grueso.
  const g = sel.mun?.g ?? null;
  useEffect(() => {
    const map = mapa.current;
    if (!map || !listo || !municipios || !cve) return;
    for (const m of municipios) if (m.ent === cve) map.setFeatureState({ source: "mun", id: m.g }, { elegido: m.g === g });
  }, [g, cve, municipios, listo]);

  // Encuadre en el espacio que deja libre el panel.
  const libreAbajo = escritorio ? 0 : visibleMovil(nivel, altoMapa);
  useEffect(() => {
    const map = mapa.current;
    if (!map || !listo) return;
    const b = (sel.mun?.b ?? sel.estado?.b ?? MEXICO) as [number, number, number, number];
    const padding = escritorio
      ? { top: 48, right: 72, bottom: 48, left: abierto ? 470 : 48 }
      : { top: 64, right: 24, bottom: libreAbajo + 24, left: 24 };
    map.fitBounds(b, { padding, duration: 800, maxZoom: sel.mun ? 9.5 : 8 });
  }, [sel, listo, escritorio, abierto, libreAbajo]);

  return (
    <div className="fixed inset-0 flex flex-col bg-bg">
      {/* Barra superior */}
      <header className="z-40 flex h-14 shrink-0 items-center gap-3 border-b-2 border-ink bg-bg px-3 sm:px-5">
        <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-[14px] font-semibold text-ink-2 hover:bg-raised hover:text-ink">
          <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg>
          <span className="max-sm:sr-only">Volver</span>
        </Link>
        <Link href="/" aria-label="Inhabitable, inicio" className="text-[1.25rem]"><Marca /></Link>
        <span aria-hidden className="h-5 w-0.5 bg-ink/20" />
        <h1 className="font-display text-[1.05rem] font-extrabold tracking-[-0.02em]">El mapa</h1>
        <span className="ml-auto hidden text-[13px] text-ink-3 md:block">Años ahorrando el 30% del salario mínimo</span>
      </header>

      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0"><div ref={caja} className="h-full w-full" role="region" aria-label="Mapa de México. Toca un estado para ver sus municipios; toca fuera para regresar." /></div>
        <Leyenda escritorio={escritorio} />
        <PanelMapa escritorio={escritorio} abierto={abierto} onAbierto={setAbierto} nivel={nivel} onNivel={setNivel}
          etiqueta="Datos del lugar elegido" cuerpoRef={cuerpo} encabezado={<Migas sel={sel} ir={ir} />}>
          <Contenido sel={sel} municipios={municipios} ir={ir} />
        </PanelMapa>
      </div>
    </div>
  );
}

/* ---------- Encabezado del panel: dónde estás (cada paso se puede tocar) ---------- */

function Migas({ sel, ir }: { sel: Sel; ir: (s: Sel) => void }) {
  const paso = "min-h-10 shrink-0 cursor-pointer rounded-full px-2.5 text-[14px] font-semibold text-ink-2 hover:bg-raised hover:text-ink";
  const sep = <svg aria-hidden viewBox="0 0 24 24" className="size-3.5 shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="m9 6 6 6-6 6" /></svg>;
  const actual = "min-w-0 truncate px-2.5 text-[15px] font-bold";
  return (
    <nav aria-label="Dónde estás" className="flex min-w-0 items-center gap-0.5">
      {sel.estado ? <button type="button" className={paso} onClick={() => ir(NADA)}>México</button> : <span className={actual}>Todo México</span>}
      {sel.estado && sep}
      {sel.estado && (sel.mun
        ? <button type="button" className={`${paso} min-w-0 truncate`} onClick={() => ir({ estado: sel.estado, mun: null })}>{sel.estado.nombre}</button>
        : <span className={actual}>{sel.estado.nombre}</span>)}
      {sel.mun && sep}
      {sel.mun && <span className={actual}>{sel.mun.n}</span>}
    </nav>
  );
}

/* ---------- Cuerpo del panel ---------- */

function Contenido({ sel, municipios, ir }: { sel: Sel; municipios: MunicipioCrudo[] | null; ir: (s: Sel) => void }) {
  if (!sel.estado) return <Pais municipios={municipios} ir={ir} />;
  return <EstadoOMunicipio estado={sel.estado} mun={sel.mun} municipios={municipios} ir={ir} />;
}

const titulo = "font-display text-[1.7rem] leading-[1.05] font-extrabold tracking-[-0.025em] text-balance";
const etiqueta = "text-[12px] font-bold tracking-[0.08em] text-ink-3 uppercase";

function Pais({ municipios, ir }: { municipios: MunicipioCrudo[] | null; ir: (s: Sel) => void }) {
  const [q, setQ] = useState("");
  const t = normaliza(q);
  const estados = ESTADOS.filter((e) => !t || normaliza(e.nombre).includes(t));
  const muns = t.length >= 2 && municipios ? municipios.filter((m) => normaliza(m.n).includes(t)).slice(0, 12) : [];
  return (
    <div className="pb-4">
      <div className="px-5 pt-4">
        <h2 className={titulo}>Toca tu estado en el mapa</h2>
        <p className="mt-2 text-[15px] leading-snug text-ink-2">Verás sus municipios para elegir el tuyo. Para regresar, toca fuera.</p>
        <Filtro valor={q} onCambio={setQ} placeholder="Busca tu estado o municipio" />
      </div>
      {muns.length > 0 && (
        <>
          <p className={`${etiqueta} mt-5 px-5`}>Municipios</p>
          <ol className="mt-1 px-3">
            {muns.map((m) => (
              <Fila key={m.g} nombre={m.n} sub={POR_CVE.get(m.ent)?.nombre} valor={m.a != null ? aniosTxt(m.a, !!m.t) : ""} color={m.a != null ? rango(m.a).color : SIN_DATO}
                onClick={() => ir({ estado: POR_CVE.get(m.ent)!, mun: m })} />
            ))}
          </ol>
        </>
      )}
      <p className={`${etiqueta} mt-5 px-5`}>Estados, del más caro al más barato</p>
      <ol className="mt-1 px-3">
        {estados.map((e) => (
          <Fila key={e.cve} n={ESTADOS.indexOf(e) + 1} nombre={e.nombre} valor={anios(e.anios30)} color={rango(e.anios30).color} flecha onClick={() => ir({ estado: e, mun: null })} />
        ))}
        {estados.length === 0 && muns.length === 0 && <li className="px-2 py-3 text-[14px] text-ink-3">No encontramos “{q}”.</li>}
      </ol>
      <p className="mt-3 px-5 text-[12px] text-ink-3">{DATO_PRECIOS}</p>
    </div>
  );
}

function EstadoOMunicipio({ estado, mun, municipios, ir }: { estado: Estado; mun: MunicipioCrudo | null; municipios: MunicipioCrudo[] | null; ir: (s: Sel) => void }) {
  const [q, setQ] = useState("");
  const [para, setPara] = useState(estado.cve);
  if (para !== estado.cve) {
    setPara(estado.cve);
    setQ("");
  }
  const lista = (municipios ?? []).filter((m) => m.ent === estado.cve);
  const t = normaliza(q);
  const ok = (m: MunicipioCrudo) => !t || normaliza(m.n).includes(t);
  const visibles = [
    ...lista.filter((m) => m.a != null && ok(m)).sort((a, b) => b.a! - a.a!),
    ...lista.filter((m) => m.a == null && ok(m)).sort((a, b) => a.n.localeCompare(b.n, "es")),
  ];
  const conDato = lista.filter((m) => m.a != null).length;

  return (
    <div className="pb-4">
      <div className="px-5 pt-4">
        {mun ? <TarjetaMunicipio mun={mun} estado={estado} /> : <TarjetaEstado estado={estado} />}
      </div>
      <div className="mt-6 border-t-2 border-line px-5 pt-5">
        <p className={etiqueta}>{mun ? `Otros municipios de ${estado.nombre}` : "Elige tu municipio"}</p>
        <p className="mt-1 text-[13px] text-ink-3">
          {municipios ? `${conDato} de ${lista.length} con datos suficientes` : "Cargando municipios…"} · toca uno en el mapa o en la lista
        </p>
        <Filtro valor={q} onCambio={setQ} placeholder={`Busca en ${estado.nombre}`} />
      </div>
      <ol className="mt-2 px-3">
        {visibles.map((m) => (
          <Fila key={m.g} nombre={m.n} activo={m.g === mun?.g} valor={m.a != null ? aniosTxt(m.a, !!m.t) : ""}
            sub={m.a == null ? "pocos créditos para calcularlo" : undefined} color={m.a != null ? rango(m.a).color : SIN_DATO}
            onClick={() => ir({ estado, mun: m.g === mun?.g ? null : m })} />
        ))}
        {municipios && visibles.length === 0 && <li className="px-2 py-3 text-[14px] text-ink-3">No hay un municipio con ese nombre en {estado.nombre}.</li>}
      </ol>
      <p className="mt-3 px-5 text-[12px] text-ink-3">{DATO_MUN} · estimación conservadora</p>
    </div>
  );
}

/** El dato grande y la frase cruda, con el botón a la página del lugar. */
function Ficha({ sobre, nombre, anios: a, tope, frase, precio, href, cta }: {
  sobre: string; nombre: string; anios: number; tope?: boolean; frase: React.ReactNode; precio: string; href: string; cta: string;
}) {
  return (
    <div>
      <p className={etiqueta}>{sobre}</p>
      <h2 className={`${titulo} mt-0.5`}>{nombre}</h2>
      <p className="mt-4 flex items-baseline gap-2">
        <span aria-hidden className="size-4 shrink-0 self-center rounded-[4px] ring-1 ring-black/15" style={{ background: rango(a).color }} />
        <span className="cifra text-[4.2rem] leading-[0.85] font-extrabold">{aniosTxt(a, tope)}</span>
        <span className="font-display text-[1.3rem] font-bold">años</span>
      </p>
      <p className="mt-3 text-[15px] leading-snug text-ink-2">{frase}</p>
      <p className="mt-2 text-[13px] text-ink-3">Casa de precio típico: {precio}</p>
      <Link href={href}
        className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-ink bg-obra px-5 text-[15px] font-bold shadow-[0_4px_0_0_var(--ink)] transition-transform active:translate-y-[4px] active:shadow-none">
        {cta}
        <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </Link>
    </div>
  );
}

function fraseVida(terminas: number, ev: number, donde: string, tope?: boolean) {
  const fin = tope ? `más de ${EDAD_INICIO + TOPE_ANIOS}` : terminas;
  return (
    <>
      Empiezas a trabajar a los {EDAD_INICIO} y terminas de juntar a los <strong className="font-bold text-ink">{fin}</strong>.{" "}
      {!tope && terminas <= ev
        ? <>En {donde} se vive en promedio {Math.round(ev)} años: te quedarían {Math.round(ev) - terminas}.</>
        : <>En {donde} se vive en promedio {Math.round(ev)} años. <strong className="font-bold text-tabique-oscuro">No te alcanza la vida.</strong></>}
    </>
  );
}

function TarjetaEstado({ estado }: { estado: Estado }) {
  const l = lugarEstado(estado);
  const c = cuentas(l);
  return (
    <Ficha sobre={`Estado · lugar ${ESTADOS.indexOf(estado) + 1} de 32`} nombre={estado.nombre} anios={c.ahorrando}
      frase={fraseVida(c.terminas, l.ev, conArticulo(estado.nombre))} precio={dinero(l.precio)} href={rutaDe(l)} cta={`Ver tu vida en ${estado.nombre}`} />
  );
}

function TarjetaMunicipio({ mun, estado }: { mun: MunicipioCrudo; estado: Estado }) {
  if (mun.a == null) {
    const c = cuentas(lugarEstado(estado));
    return (
      <div>
        <p className={etiqueta}>Municipio · {estado.nombre}</p>
        <h2 className={`${titulo} mt-0.5`}>{mun.n}</h2>
        <p className="mt-3 rounded-2xl bg-raised px-4 py-3 text-[15px] leading-snug">
          Aquí hubo muy pocos créditos de vivienda en un año para calcularlo. En {conArticulo(estado.nombre)} son <strong className="font-bold">{anios(c.ahorrando)} años</strong>.
        </p>
        <Link href={rutaDe(lugarEstado(estado))} className="mt-4 inline-flex min-h-11 items-center font-bold underline underline-offset-4">Ver {estado.nombre}</Link>
      </div>
    );
  }
  const l = lugarMunicipio(mun);
  const c = cuentas(l);
  return (
    <Ficha sobre={`Municipio · ${estado.nombre}`} nombre={mun.n} anios={c.ahorrando} tope={!!mun.t}
      frase={fraseVida(c.terminas, l.ev, conArticulo(estado.nombre), !!mun.t)} precio={`${mun.t ? "más de " : ""}${dinero(l.precio)} (estimado)`}
      href={rutaDe(l)} cta="Ver tu vida completa" />
  );
}

/* ---------- Piezas ---------- */

function Filtro({ valor, onCambio, placeholder }: { valor: string; onCambio: (v: string) => void; placeholder: string }) {
  return (
    <label className="relative mt-4 block">
      <span className="sr-only">{placeholder}</span>
      <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-2" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input type="search" value={valor} onChange={(e) => onCambio(e.target.value)} placeholder={placeholder}
        className="h-12 w-full rounded-full border-2 border-ink bg-surface pr-4 pl-11 text-[16px] outline-none placeholder:text-ink-3 focus:shadow-[0_0_0_4px_rgba(31,111,199,0.25)]" />
    </label>
  );
}

function Fila({ n, nombre, sub, valor, color, onClick, activo, flecha }: {
  n?: number; nombre: string; sub?: string; valor: string; color: string; onClick: () => void; activo?: boolean; flecha?: boolean;
}) {
  return (
    <li>
      <button type="button" onClick={onClick} aria-current={activo ? "true" : undefined}
        className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors ${activo ? "bg-obra/40 ring-2 ring-ink" : "hover:bg-raised/70"}`}>
        {n != null && <span className="num w-5 shrink-0 text-[12px] font-semibold text-ink-3">{n}</span>}
        <span aria-hidden className="size-3.5 shrink-0 rounded-[4px] ring-1 ring-black/15" style={{ background: color }} />
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[15px] ${activo ? "font-bold" : "font-medium"}`}>{nombre}</span>
          {sub && <span className="block truncate text-[12px] text-ink-3">{sub}</span>}
        </span>
        {valor && <span className="num shrink-0 text-[15px] font-bold">{valor} años</span>}
        {flecha && <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>}
      </button>
    </li>
  );
}

function Leyenda({ escritorio }: { escritorio: boolean }) {
  return (
    <div className={`pointer-events-none absolute z-10 rounded-2xl border-2 border-ink bg-surface/95 px-3 py-2 text-[12px] ${escritorio ? "right-4 bottom-8" : "top-3 left-3 max-w-[calc(100%-5.5rem)]"}`}>
      {escritorio && <p className="mb-1 font-semibold">Años ahorrando el 30%</p>}
      <div className={`gap-x-3 gap-y-0.5 text-ink-2 ${escritorio ? "grid grid-cols-2" : "flex flex-wrap"}`}>
        {RANGOS.map((r) => (
          <span key={r.label} className="inline-flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-[3px] ring-1 ring-black/15" style={{ background: r.color }} />
            {r.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-[3px] ring-1 ring-black/15" style={{ background: SIN_DATO }} />
          pocos datos
        </span>
      </div>
    </div>
  );
}
