"use client";

import { useEffect, useRef, useState } from "react";
import {
  AHORRO_PCT, ALCANZABLE, D, DATO_MUN, DATO_PRECIOS, EDAD_INICIO, INFO, NAC, PAGO_INFO, SM, TOPE_ANIOS, aniosTxt, conArticulo, cuentas, deLugar,
  diarioDeMensual, dinero, fmt, INFO_TXT, millones, pesos, PODER_INFO, PODER_TXT, type Lugar,
} from "@/lib/datos";
import { registrar } from "@/lib/analytics";
import Barras from "./Barras";
import Compartir from "./Compartir";
import TuVida from "./TuVida";
import { Ayuda } from "./ui";

type Escenario = "ahorro" | "infonavit" | "todo";
const ESCENARIOS: [Escenario, string][] = [
  ["ahorro", `Ahorrando ${AHORRO_PCT}%`],
  ["infonavit", "Con INFONAVIT"],
  ["todo", "Sin gastar nada"],
];

const donde = (l: Lugar) => (l.tipo === "pais" ? "México" : conArticulo(l.tipo === "estado" ? l.nombre : l.en!));

/**
 * Tarjeta de respuesta: cuántos años cuesta una casa en el lugar elegido. Con el salario mínimo por defecto; si la persona
 * escribe lo que le llega al mes (`mensual`), se recalcula todo aquí, en el navegador. Ese monto nunca sale de este estado
 * de React: no va en la URL, ni en lo que se comparte, ni en almacenamiento, ni en analytics.
 */
export default function Resultado({ l, mensual, setMensual, onVolver }: {
  l: Lugar;
  mensual: number | null;
  setMensual: (n: number | null) => void;
  onVolver?: () => void;
}) {
  const [esc, setEsc] = useState<Escenario>("ahorro");
  const propio = mensual != null && mensual > 0;
  const c = cuentas(l, propio ? diarioDeMensual(mensual) : l.salario);
  const mas = !!l.tope;
  const ahorrando = esc === "ahorro";
  const terminas = ahorrando ? c.terminas : EDAD_INICIO + Math.round(c.completo);

  return (
    <article aria-labelledby="resultado-t" className="relative overflow-hidden rounded-[28px] border-2 border-ink bg-surface shadow-[0_8px_0_0_var(--ink)]">
      <header className="border-b-2 border-ink bg-obra px-5 py-4 sm:px-7">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] font-bold tracking-[0.08em] text-ink uppercase">
              {l.tipo === "pais" ? "País" : l.tipo === "estado" ? "Estado" : `Municipio · ${l.en}`}
            </p>
            <h2 id="resultado-t" className="truncate font-display text-[1.7rem] leading-tight font-bold tracking-[-0.02em] sm:text-[2rem]">{l.nombre}</h2>
          </div>
          <AyudaResultado l={l} />
        </div>
        <p className="mt-2 inline-flex items-center rounded-full border-2 border-ink bg-surface px-3 py-0.5 text-[13px] font-bold">
          {propio ? "Con lo que te llega" : "Con el salario mínimo"}
        </p>
      </header>

      {l.prestado && (
        <p className="border-b border-line bg-raised px-5 py-2.5 text-[13px] text-ink-2 sm:px-7">
          En {l.prestado.municipio} hubo muy pocos créditos de vivienda para calcularlo ({fmt(l.prestado.creditos)} en un año). Te mostramos {l.nombre}.
        </p>
      )}

      <div role="tablist" aria-label="Escenario" className="mx-5 mt-5 grid grid-cols-3 gap-1 rounded-full bg-raised p-1 sm:mx-7">
        {ESCENARIOS.map(([v, t]) => (
          <button key={v} type="button" role="tab" aria-selected={esc === v} onClick={() => setEsc(v)}
            className={`min-h-11 cursor-pointer rounded-full px-1.5 text-[13px] leading-tight font-semibold transition-colors sm:text-[14px] ${
              esc === v ? "bg-ink text-white" : "text-ink-2 hover:text-ink"
            }`}>
            {t}
          </button>
        ))}
      </div>

      <div className="px-5 pt-6 pb-6 sm:px-7 sm:pb-7" aria-live="polite">
        {esc === "infonavit" ? (
          <ConInfonavit l={l} c={c} propio={propio} />
        ) : (
          <>
            <p className="flex items-baseline gap-3">
              <span className="cifra text-[clamp(4.5rem,15vw,7.5rem)] leading-[0.85] font-extrabold">
                {ahorrando ? (!mas && Math.round(c.ahorrando) < 1 ? "<1" : aniosTxt(c.ahorrando, mas)) : fmt(c.completo, 1)}
              </span>
              <span className="font-display text-[1.6rem] font-bold">{ahorrando && !mas && Math.round(c.ahorrando) <= 1 ? "año" : "años"}</span>
            </p>
            <Frase l={l} terminas={terminas} mas={mas && ahorrando} todo={!ahorrando} />
            <div className="mt-6">
              <TuVida terminas={terminas} ev={l.ev} mas={mas && ahorrando} donde={donde(l)} clave={`${l.id}-${esc}`} />
            </div>
            <p className="mt-5 border-t border-line pt-4 text-[14px] text-ink-2">
              El gobierno considera alcanzable pagar una casa en <strong className="font-bold text-ink">{ALCANZABLE} años</strong> (CONAVI).
            </p>
          </>
        )}

        <CampoSalario mensual={mensual} setMensual={setMensual} />
      </div>

      <Compartir l={l} propio={propio} />

      <footer className="border-t border-line px-5 py-3.5 text-[13px] text-ink-3 sm:px-7">
        Casa de precio típico: <strong className="font-semibold text-ink">{mas ? "más de " : ""}{millones(l.precio)}</strong>
        {" · "}salario mínimo de {pesos(l.salario)} al día
        <span className="block">{l.estimado ? DATO_MUN : DATO_PRECIOS}</span>
        {onVolver && (
          <button type="button" onClick={onVolver} className="mt-2 inline-flex min-h-11 cursor-pointer items-center gap-1 font-semibold text-ink-2 underline underline-offset-4 hover:text-ink">
            ← Ver los más caros
          </button>
        )}
      </footer>
    </article>
  );
}

/** La frase cruda: a qué edad terminas de juntar y cuánta vida te queda. */
function Frase({ l, terminas, mas, todo }: { l: Lugar; terminas: number; mas: boolean; todo: boolean }) {
  const ev = Math.round(l.ev);
  const fin = mas ? `más de ${EDAD_INICIO + TOPE_ANIOS}` : `${terminas}`;
  return (
    <p className="mt-4 max-w-[38ch] text-[17px] leading-snug text-ink-2">
      {todo && <>Sin comer, sin pagar renta, sin transporte. </>}
      Empiezas a trabajar a los {EDAD_INICIO} y terminas de juntar a los <strong className="font-bold text-ink">{fin}</strong>.{" "}
      {terminas <= ev && !mas ? (
        <>En {donde(l)} se vive en promedio {ev} años: {ev - terminas === 1 ? "te quedaría" : "te quedarían"} <strong className="font-bold text-ink">{ev - terminas}</strong> para vivir.</>
      ) : (
        <>En {donde(l)} se vive en promedio {ev} años. <strong className="font-bold text-tabique-oscuro">No te alcanza la vida.</strong></>
      )}
    </p>
  );
}

function ConInfonavit({ l, c, propio }: { l: Lugar; c: ReturnType<typeof cuentas>; propio: boolean }) {
  const barata = l.estado ? l.estado.p25 : NAC.p25;
  const enDonde = l.tipo === "pais" ? "de México" : deLugar(l.estado!.nombre);
  const tope = Math.max(l.precio, barata, PODER_INFO);
  const alcanza = c.faltaInfo === 0;
  return (
    <div>
      {alcanza ? (
        <>
          <p className="cifra text-[clamp(2.5rem,11vw,5.5rem)] leading-[0.9] font-extrabold">Apenas</p>
          <p className="mt-3 max-w-[36ch] text-[17px] leading-snug text-ink-2">
            Aquí el crédito más alto alcanza para el precio estimado, pero es una <strong className="font-bold text-ink">estimación baja</strong>: la casa barata{" "}
            {enDonde} cuesta {dinero(barata)}.
          </p>
        </>
      ) : (
        <>
          <p className="cifra text-[clamp(2.5rem,11vw,5.5rem)] leading-[0.9] font-extrabold">{l.tope ? "+" : ""}{dinero(c.faltaInfo)}</p>
          <p className="mt-3 max-w-[34ch] text-[17px] leading-snug text-ink-2">
            te faltan, <strong className="font-bold text-ink">aunque sumes el crédito y tu ahorro del INFONAVIT.</strong>
          </p>
        </>
      )}
      <div className="mt-6">
        <Barras id={`info-${l.id}`} tope={tope}
          barras={[
            { id: "presta", etiqueta: "Crédito + tu ahorro del INFONAVIT", valor: PODER_INFO, texto: PODER_TXT(), tono: "neutro" },
            { id: "barata", etiqueta: `Una casa barata ${enDonde}`, valor: barata, texto: dinero(barata), tono: "claro" },
            { id: "tipica", etiqueta: "La casa típica aquí", valor: l.precio, texto: `${l.tope ? "+" : ""}${dinero(l.precio)}`, tono: "tabique" },
          ]} />
      </div>
      <p className="mt-5 text-[16px] leading-snug text-ink-2">
        Y la mensualidad se lleva el <strong className="font-bold text-ink">{fmt(c.pctInfo)}% de {propio ? "lo que te llega" : "tu sueldo"}</strong> durante {INFO.anios} años
        {propio ? "" : ` (${pesos(PAGO_INFO)} de ${pesos(c.sueldo)})`}.
      </p>
      {propio && <p className="mt-2 text-[13px] text-ink-3">El monto del crédito es el de quien gana el mínimo; con otro sueldo el INFONAVIT calcula otro.</p>}
      <p className="mt-4 rounded-2xl bg-raised px-4 py-3 text-[15px] leading-snug text-ink-2">
        <strong className="font-bold text-ink">Más de la mitad trabaja sin seguro social:</strong> para ellos no hay INFONAVIT.
      </p>
      <p className="mt-3 text-[13px] text-ink-3">Monto y tasa del INFONAVIT: citados por prensa con su simulador, sin publicación oficial a la vista.</p>
    </div>
  );
}

/** Menos de esto al mes no se calcula: no es un sueldo y la cifra deja de tener sentido. */
const MIN_MENSUAL = 1000;
/** Se recalcula al dejar de escribir (o con Enter, o al salir del campo), no en cada tecla: "1500" no pasa por $1. */
const ESPERA_MS = 600;

/** "¿Ganas otra cantidad?": campo plegado. El monto se queda aquí: sin name, fuera de cualquier form, sin autocompletar. */
function CampoSalario({ mensual, setMensual }: { mensual: number | null; setMensual: (n: number | null) => void }) {
  const [abierto, setAbierto] = useState(mensual != null);
  const campo = useRef<HTMLInputElement>(null);
  const enfocar = useRef(false);
  const [texto, setTexto] = useState(mensual != null ? fmt(mensual) : "");
  const [corto, setCorto] = useState(false);
  const espera = useRef<number | undefined>(undefined);
  const minimoMes = (SM * 365) / 12;
  const menos = mensual != null && mensual > 0 && mensual < minimoMes - 1;
  useEffect(() => () => window.clearTimeout(espera.current), []);
  /* Al abrirlo con el botón, el foco pasa al campo (en el teléfono, sin tener que tocar otra vez). */
  useEffect(() => {
    if (abierto && enfocar.current) campo.current?.focus();
    enfocar.current = false;
  }, [abierto]);

  function aplicar(valor: string) {
    window.clearTimeout(espera.current);
    const n = Number(valor.replace(/[^\d]/g, ""));
    setCorto(n > 0 && n < MIN_MENSUAL);
    if (n < MIN_MENSUAL) return setMensual(null);
    if (n !== mensual) {
      setMensual(n);
      registrar({ nombre: "usar_salario" });
    }
  }

  if (!abierto) {
    return (
      <button type="button" onClick={() => { enfocar.current = true; setAbierto(true); }} aria-expanded={false}
        className="mt-6 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-ink px-4 text-[14px] font-bold hover:bg-raised">
        ¿Ganas otra cantidad?
        <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </button>
    );
  }
  return (
    <div className="mt-6 rounded-2xl border-2 border-ink p-4">
      <label htmlFor="lo-que-te-llega" className="block text-[15px] font-bold">Lo que te llega al mes</label>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-40">
          <span aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[17px] font-semibold text-ink-2">$</span>
          <input ref={campo} id="lo-que-te-llega" type="text" inputMode="numeric" autoComplete="off" spellCheck={false} placeholder={fmt(minimoMes)}
            aria-describedby="lo-que-te-llega-nota" value={texto}
            onChange={(e) => {
              const limpio = e.target.value.replace(/[^\d]/g, "").slice(0, 7);
              const nuevo = limpio ? fmt(Number(limpio)) : "";
              setTexto(nuevo);
              window.clearTimeout(espera.current);
              espera.current = window.setTimeout(() => aplicar(nuevo), ESPERA_MS);
            }}
            onKeyDown={(e) => e.key === "Enter" && aplicar(texto)}
            onBlur={() => aplicar(texto)}
            className="h-12 w-full rounded-full border-2 border-ink-3 bg-surface pr-4 pl-8 text-[17px] outline-none focus:border-ink" />
        </div>
        <button type="button" onClick={() => { setTexto(""); aplicar(""); }}
          className="min-h-12 cursor-pointer rounded-full px-3 text-[14px] font-semibold text-ink-2 underline underline-offset-4 hover:text-ink">
          Volver al mínimo
        </button>
      </div>
      <p id="lo-que-te-llega-nota" className="mt-2 text-[13px] text-ink-2">Se calcula en tu teléfono. No se guarda ni se envía.</p>
      {corto && <p role="status" className="mt-2 text-[14px] font-semibold text-tabique-oscuro">Escribe al menos {pesos(MIN_MENSUAL)} al mes.</p>}
      {menos && <p className="mt-2 text-[14px] font-semibold text-tabique-oscuro">Ganas menos que el mínimo, como casi la mitad de quienes trabajan.</p>}
    </div>
  );
}

function AyudaResultado({ l }: { l: Lugar }) {
  return (
    <Ayuda titulo="Cómo lo calculamos">
      <p>
        Tomamos el <strong>precio típico</strong> de una casa {l.tipo === "pais" ? "en México" : `en ${l.nombre}`}: la mitad cuesta menos y la otra mitad, más. Lo dividimos
        entre lo que se junta con el <strong>salario mínimo</strong> de {D.anio}: {pesos(l.salario)} al día
        {l.salario !== D.fuentes.salario.general ? " (zona de la frontera norte)" : ""}, ahorrando el {AHORRO_PCT}%, sin intereses ni aumentos.
      </p>
      {l.estimado ? (
        <p>
          <strong>En municipios el precio es una estimación</strong> con los {fmt(l.creditos ?? 0)} créditos para comprar casa que registró el SNIIV (SEDATU) en el último año. Casi
          siempre se queda corta frente a la cifra oficial del estado: los años reales pueden ser más.
          {l.tope ? " Aquí la mitad de las casas está en el rango más caro, que no tiene tope: el precio real es mayor." : ""}
        </p>
      ) : (
        <p>Precio: Sociedad Hipotecaria Federal (SHF), avalúos de casas compradas con crédito, {D.fuentes.precios.periodo}.</p>
      )}
      <p>
        <strong>Por qué otras notas dan otra cifra:</strong> usamos el avalúo de la SHF (casas vendidas con crédito), que suele ser más bajo que los precios de anuncios que usan
        otros medios.
      </p>
      <p>
        <strong>Lo que no incluye:</strong> intereses, escrituración, aumentos, aguinaldo (con él serían ~4 % menos años) y la vivienda que la gente construye por su cuenta.
      </p>
      <p>
        <strong>Con dos sueldos mínimos en casa:</strong> ~{fmt(NAC.anios30 / 2)} años en todo México. Casi el doble de los {ALCANZABLE} que el gobierno considera alcanzables.
      </p>
      <p>
        <strong>Lo que te llega al mes:</strong> el mínimo oficial es antes de descuentos, pero a quien gana el mínimo no se le descuenta ISR ni IMSS. Por eso pedimos lo que te llega.
      </p>
      <p>
        <strong>Tu vida:</strong> empiezas a trabajar a los {EDAD_INICIO} y comparamos con la esperanza de vida al nacer en {donde(l)}: {fmt(l.ev, 1)} años (CONAPO,{" "}
        {D.fuentes.vida.anio}). Quien ya llegó a los 50 o 60 suele vivir algunos años más que ese promedio.
      </p>
      <p>
        <strong>Con INFONAVIT:</strong> a quien gana el mínimo le presta unos {INFO_TXT().slice(1)} a {INFO.anios} años, con la tasa más baja ({INFO.tasa}%). Son cifras que la prensa
        cita del simulador del instituto; no encontramos una publicación oficial con ellas.
      </p>
    </Ayuda>
  );
}
