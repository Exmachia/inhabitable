"use client";

import { useEffect, useRef, useState } from "react";
import { registrar } from "@/lib/analytics";
import { ALCANZABLE, TOPE_ANIOS, aniosTxt, cuentas, nombreCompleto, rutaDe, sinPrestado, slug, type Lugar } from "@/lib/datos";

/**
 * Comparte la página del lugar (con su tarjeta para redes), siempre con el salario mínimo: el texto y la imagen se arman
 * solo con datos del lugar, nunca con lo que la persona escribió. Un municipio sin dato propio comparte su estado.
 */
export default function Compartir({ l: elegido, propio }: { l: Lugar; propio: boolean }) {
  const l = sinPrestado(elegido);
  const [copiado, setCopiado] = useState(false);
  /** Si el navegador no deja copiar (apps con navegador propio, permisos), se muestra el enlace para copiarlo a mano. */
  const [aMano, setAMano] = useState(false);
  const campo = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (aMano) campo.current?.select();
  }, [aMano]);
  const ruta = rutaDe(l);
  const c = cuentas(l); // con el mínimo del lugar, a propósito
  const anios = l.tope ? `más de ${TOPE_ANIOS}` : aniosTxt(c.ahorrando);
  // Provisional: en los municipios de 20 años o menos no se compara con el plazo oficial (su regla espera el ok del usuario).
  const plazo = l.tope || Math.round(c.ahorrando) > ALCANZABLE ? ` El gobierno dice que lo alcanzable son ${ALCANZABLE}.` : "";
  const texto = `Con el salario mínimo, juntar para una casa en ${nombreCompleto(l)} toma ${anios} años.${plazo}`;
  const url = () => `${window.location.origin}${ruta}`;
  const lugar = ruta === "/" ? "mexico" : ruta.slice(1);

  async function nativo() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Inavitable", text: texto, url: url() });
        registrar({ nombre: "compartir", lugar, canal: "nativo" });
        return;
      } catch (e) {
        if ((e as DOMException)?.name === "AbortError") return; // la persona cerró el menú
      }
    }
    try {
      await navigator.clipboard.writeText(url());
    } catch {
      setAMano(true);
      return;
    }
    setAMano(false);
    registrar({ nombre: "compartir", lugar, canal: "copiar" });
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <div className="border-t-2 border-ink px-5 py-5 sm:px-7">
      <div className="flex flex-wrap gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(`${texto} `)}`} target="_blank" rel="noopener noreferrer"
          onClick={(e) => {
            // El enlace lleva el texto; la dirección se agrega aquí porque el servidor no conoce el dominio público.
            e.currentTarget.href = `https://wa.me/?text=${encodeURIComponent(`${texto} ${url()}`)}`;
            registrar({ nombre: "compartir", lugar, canal: "whatsapp" });
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink bg-obra px-4 text-[14px] font-bold shadow-[0_3px_0_0_var(--ink)] transition-transform active:translate-y-[3px] active:shadow-none">
          <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" /></svg>
          WhatsApp
        </a>
        <button type="button" onClick={nativo}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-ink bg-surface px-4 text-[14px] font-bold hover:bg-raised">
          <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" /></svg>
          {copiado ? "Enlace copiado" : "Compartir"}
        </button>
        <a href={`/historia${ruta === "/" ? "" : ruta}`} download={`inavitable-${ruta === "/" ? "mexico" : slug(nombreCompleto(l))}.png`}
          onClick={() => registrar({ nombre: "compartir", lugar, canal: "historia" })}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-ink bg-surface px-4 text-[14px] font-bold hover:bg-raised">
          <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M12 8v6m-3-3 3 3 3-3" /></svg>
          Guardar para historia
        </a>
      </div>
      {aMano && (
        <div className="mt-3">
          <p role="alert" className="text-[14px] font-semibold text-tabique-oscuro">No se pudo copiar. Copia el enlace:</p>
          <input ref={campo} type="text" readOnly value={url()} aria-label="Enlace para compartir" onFocus={(e) => e.currentTarget.select()}
            className="mt-1.5 h-11 w-full rounded-full border-2 border-ink-3 bg-surface px-4 text-[15px] outline-none focus:border-ink" />
        </div>
      )}
      <p className={`mt-3 text-[13px] ${propio ? "font-bold text-tabique-oscuro" : "text-ink-2"}`}>
        Se comparte con el salario mínimo, nunca con tu sueldo.{elegido.prestado ? ` Y con la cifra de ${l.nombre}.` : ""}
      </p>
      <span className="sr-only" role="status">{copiado ? "Enlace copiado al portapapeles" : ""}</span>
    </div>
  );
}
