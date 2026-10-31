"use client";

import { createContext, createElement, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { PAIS, POR_CVE, POR_SLUG, lugarEstado, lugarMunicipio, rutaDe, slugMunicipio, titularDe, type Lugar, type MunicipioCrudo } from "./datos";
import { TITULO } from "./sitio";

/* ---------- Municipios: se piden una sola vez, cuando hacen falta ---------- */

let promesa: Promise<MunicipioCrudo[]> | null = null;
let cargados: MunicipioCrudo[] | null = null;
export function cargarMunicipios() {
  promesa ??= fetch("/data/municipios.json")
    .then((r) => r.json() as Promise<MunicipioCrudo[]>)
    .then((m) => (cargados = m));
  return promesa;
}

/** Lista de municipios (null mientras carga). Se pide al quedar libre el navegador para no competir con la portada. */
export function useMunicipios() {
  const [m, setM] = useState<MunicipioCrudo[] | null>(cargados);
  useEffect(() => {
    if (cargados) return;
    let vivo = true;
    const ir = () => cargarMunicipios().then((x) => vivo && setM(x)).catch(() => {});
    const ocioso = typeof window.requestIdleCallback === "function";
    const id = ocioso ? window.requestIdleCallback(ir, { timeout: 2000 }) : (window.setTimeout(ir, 800) as number);
    return () => {
      vivo = false;
      if (ocioso) window.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, []);
  return m;
}

/*
 * ---------- El lugar elegido vive en la dirección: /jalisco o /jalisco/guadalajara ----------
 * El servidor manda el lugar de la dirección (o null en la portada). Al elegir otro en el navegador se cambia la dirección
 * con pushState, sin recargar; atrás y adelante vuelven al lugar anterior.
 */

const EVENTO = "lugar";
/** undefined: todavía no se elige nada en el navegador (vale el del servidor). null: sin lugar (portada). */
let actual: Lugar | null | undefined;
const Inicial = createContext<Lugar | null>(null);

async function desdeRuta(): Promise<Lugar | null> {
  const [e, m] = window.location.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const est = e ? POR_SLUG.get(e) : undefined;
  if (!est) return null;
  if (!m) return lugarEstado(est);
  const x = (await cargarMunicipios()).find((y) => y.ent === est.cve && slugMunicipio(y) === m);
  return x ? lugarMunicipio(x) : lugarEstado(est);
}

/** Direcciones viejas con hash (#e=jalisco, #m=14039): se pasan a la nueva. */
async function desdeHashViejo(): Promise<Lugar | null | undefined> {
  const p = new URLSearchParams(window.location.hash.slice(1));
  const m = p.get("m");
  if (m) {
    const x = (await cargarMunicipios()).find((y) => y.g === m);
    if (x) return lugarMunicipio(x);
  }
  const e = p.get("e");
  const est = e ? POR_SLUG.get(e) : undefined;
  return est ? lugarEstado(est) : undefined;
}

function avisar(l: Lugar | null) {
  actual = l;
  document.title = l ? `${titularDe(l)} · Inavitable` : TITULO;
  window.dispatchEvent(new Event(EVENTO));
}

function suscribir(cb: () => void) {
  const atras = () => desdeRuta().then(avisar);
  window.addEventListener("popstate", atras);
  window.addEventListener(EVENTO, cb);
  return () => {
    window.removeEventListener("popstate", atras);
    window.removeEventListener(EVENTO, cb);
  };
}

/** Envuelve la página con el lugar que mandó el servidor. */
export function LugarInicial({ lugar, children }: { lugar: Lugar | null; children: React.ReactNode }) {
  useEffect(() => {
    const pasar = () => {
      if (!window.location.hash.includes("=")) return;
      desdeHashViejo().then((l) => {
        if (l === undefined) return;
        window.history.replaceState(null, "", rutaDe(l));
        avisar(l);
      });
    };
    pasar();
    window.addEventListener("hashchange", pasar);
    return () => window.removeEventListener("hashchange", pasar);
  }, []);
  return createElement(Inicial.Provider, { value: lugar }, children);
}

/** Lugar elegido o null si no hay ninguno (portada). Lo comparten el buscador, el resultado y el mapa. */
export function useLugarElegido() {
  const inicial = useContext(Inicial);
  return useSyncExternalStore(suscribir, () => (actual === undefined ? inicial : actual), () => inicial);
}

/** Lugar para los cálculos: si no hay ninguno elegido, todo México. */
export function useLugar() {
  return useLugarElegido() ?? PAIS;
}

/** Elige un lugar (null: vuelve a la portada) y cambia la dirección. */
export function elegirLugar(l: Lugar | null) {
  const ruta = rutaDe(l);
  if (ruta !== window.location.pathname) window.history.pushState(null, "", ruta);
  avisar(l);
}

/** Para los atajos: un estado ("09") o un municipio ("14039"). */
export async function lugarPorClave(id: string): Promise<Lugar | null> {
  if (id === "mx") return PAIS;
  if (id.length === 2) return lugarEstado(POR_CVE.get(id)!);
  const m = (await cargarMunicipios()).find((x) => x.g === id);
  return m ? lugarMunicipio(m) : null;
}

/** En celular, después de elegir un lugar en la portada, baja hasta la tarjeta (sin animación si se pidió movimiento reducido). */
export function mostrarResultado() {
  if (window.innerWidth >= 1024) return;
  requestAnimationFrame(() => {
    const el = document.getElementById("resultado");
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top > 0 && r.top < window.innerHeight * 0.5) return;
    el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  });
}
