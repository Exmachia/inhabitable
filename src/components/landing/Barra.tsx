"use client";

import { useEffect, useState } from "react";
import Marca from "../Marca";

const SECCIONES = [
  { id: "mapa", label: "Mapa" },
  { id: "credito", label: "Con crédito" },
  { id: "antes", label: "Antes y ahora" },
  { id: "quien", label: "Quién gana eso" },
  { id: "metodo", label: "Cómo lo calculamos" },
] as const;

/** Barra superior fija: marca, secciones y una sola acción principal (buscar dónde vives). */
export default function Barra() {
  const [bajo, setBajo] = useState(false);
  const [lejos, setLejos] = useState(false);
  useEffect(() => {
    const f = () => {
      setBajo(window.scrollY > 8);
      setLejos(window.scrollY > window.innerHeight * 1.5);
    };
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  const buscar = () => {
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    setTimeout(() => document.querySelector<HTMLInputElement>("#inicio input[type=search]")?.focus({ preventScroll: true }), 450);
  };

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 border-b-2 transition-colors ${bajo ? "border-ink bg-bg/95 backdrop-blur-md" : "border-transparent bg-bg"}`}>
        <nav aria-label="Principal" className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-8">
          <a href="#inicio" aria-label="Inavitable, arriba" className="mr-auto text-[1.45rem]"><Marca /></a>
          <ul className="hidden items-center lg:flex">
            {SECCIONES.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="inline-flex min-h-10 items-center rounded-full px-3.5 text-[14px] font-medium text-ink-2 transition-colors hover:bg-raised hover:text-ink">{s.label}</a>
              </li>
            ))}
          </ul>
          <button type="button" onClick={buscar}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-ink bg-obra px-4 text-[14px] font-bold whitespace-nowrap shadow-[0_3px_0_0_var(--ink)] transition-transform active:translate-y-[3px] active:shadow-none">
            <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            ¿Y dónde vives?
          </button>
        </nav>
      </header>
      {lejos && (
        <button type="button" aria-label="Volver arriba" onClick={buscar}
          className="fixed right-4 bottom-5 z-50 grid size-13 cursor-pointer place-items-center rounded-full border-2 border-ink bg-surface shadow-[0_4px_0_0_var(--ink)]">
          <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
        </button>
      )}
    </>
  );
}
