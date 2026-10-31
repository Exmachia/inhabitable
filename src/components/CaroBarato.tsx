import { ALCANZABLE, CAROS, DATO_MUN, DATO_PRECIOS, TOPE_ANIOS, VIDA_LABORAL, anios, deLugar } from "@/lib/datos";
import { BarrasCompactas } from "./Barras";
import { Ayuda } from "./ui";

const casaBarataDe = (nombre: string) => `Una casa barata ${deLugar(nombre)}`;

/**
 * Portada sin lugar: los municipios más caros junto a la casa barata de su mismo estado. Hasta lo barato rebasa lo que el
 * gobierno considera alcanzable; lo caro no cabe en una vida de trabajo.
 */
export default function CaroBarato() {
  return (
    <article className="overflow-hidden rounded-[28px] border-2 border-ink bg-surface shadow-[0_8px_0_0_var(--ink)]">
      <header className="flex items-center justify-between gap-3 border-b-2 border-ink px-5 py-3 sm:px-7">
        <p className="text-[12px] font-bold tracking-[0.08em] uppercase">Con el salario mínimo, ahorrando el 30 %</p>
        <AyudaCaroBarato />
      </header>
      <div className="px-5 py-5 sm:px-7">
        <Leyenda />
        <div className="mt-5 grid gap-5">
          {CAROS.map((c) => (
            <section key={c.g} aria-label={`${c.n}: más de ${TOPE_ANIOS} años. ${casaBarataDe(c.estado.nombre)}: ${anios(c.estado.anios30Barata)} años.`}>
              <h3 className="mb-1.5 text-[15px] font-bold text-balance">{c.n} <span className="font-medium text-ink-3">· {c.estado.nombre}</span></h3>
              <BarrasCompactas id={`cb-${c.g}`} tope={TOPE_ANIOS} referencia={VIDA_LABORAL}
                barras={[
                  { id: "caro", etiqueta: `Casa típica en ${c.n}`, valor: c.a, texto: `${TOPE_ANIOS}+`, tono: "tabique" },
                  { id: "barata", etiqueta: casaBarataDe(c.estado.nombre), valor: c.estado.anios30Barata, texto: `${anios(c.estado.anios30Barata)}`, tono: "claro" },
                ]} />
            </section>
          ))}
        </div>
        <p className="mt-5 text-[15px] leading-snug">
          <strong className="font-bold">Hasta lo barato pasa de {ALCANZABLE} años,</strong> lo que el gobierno llama alcanzable.
        </p>
      </div>
      <footer className="border-t border-line px-5 py-3.5 text-[13px] text-ink-3 sm:px-7">
        Caro: {DATO_MUN} · Barato: {DATO_PRECIOS}
      </footer>
    </article>
  );
}

/** Una sola leyenda para todas las barras: qué es cada color y la raya de una vida de trabajo (18 a 65). */
function Leyenda() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-2">
      <span className="flex items-center gap-1.5"><span aria-hidden className="size-3 rounded-[2px] bg-tabique" />Casa típica del municipio</span>
      <span className="flex items-center gap-1.5"><span aria-hidden className="size-3 rounded-[2px] bg-[var(--a-2)]" />Casa barata del mismo estado</span>
      <span className="flex items-center gap-1.5"><span aria-hidden className="h-3.5 w-[2.5px] rounded-full bg-ink" />Una vida de trabajo ({VIDA_LABORAL} años)</span>
    </p>
  );
}

function AyudaCaroBarato() {
  return (
    <Ayuda titulo="Por qué estos lugares">
      <p>
        <strong>Ahí trabaja gente con el salario mínimo:</strong> trabajo doméstico, construcción, servicios. Ese es el punto: no puede vivir donde trabaja.
      </p>
      <p>
        <strong>Una casa barata</strong> es la cuarta parte más barata de las que se venden con crédito en ese estado, según la Sociedad Hipotecaria Federal (SHF). No es el
        municipio más barato: esa estimación se queda corta y no aguanta.
      </p>
      <p>
        <strong>Por qué los caros dicen “{TOPE_ANIOS}+”:</strong> en estos municipios la mitad de las casas compradas con crédito está en el rango de precio más caro, que no tiene tope. La estimación toca
        el límite: los años reales son más.
      </p>
      <p className="text-[13px] text-ink-3">Caro: créditos del SNIIV (SEDATU), estimación por municipio. Barato: SHF, cuartil inferior del avalúo por estado.</p>
    </Ayuda>
  );
}
