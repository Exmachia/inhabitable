import { ALCANZABLE, CAROS, DATO_MUN, DATO_PRECIOS, TOPE_ANIOS, VIDA_LABORAL, anios, deLugar } from "@/lib/datos";
import Barras from "./Barras";
import { Ayuda } from "./ui";

const casaBarataDe = (nombre: string) => `Una casa barata ${deLugar(nombre)}`;

/**
 * Portada sin lugar: los municipios más caros junto a la casa barata de su mismo estado. Hasta lo barato rebasa lo que el
 * gobierno considera alcanzable; lo caro no cabe en una vida de trabajo.
 */
export default function CaroBarato() {
  return (
    <article className="overflow-hidden rounded-[28px] border-2 border-ink bg-surface shadow-[0_8px_0_0_var(--ink)]">
      <header className="flex items-start justify-between gap-3 border-b-2 border-ink px-5 py-4 sm:px-7">
        <div>
          <p className="text-[12px] font-bold tracking-[0.08em] uppercase">Con el salario mínimo, ahorrando el 30 %</p>
          <h2 className="font-display text-[1.7rem] leading-tight font-extrabold tracking-[-0.02em] sm:text-[2rem]">Caro y barato, lado a lado</h2>
        </div>
        <AyudaCaroBarato />
      </header>
      <div className="px-5 py-6 sm:px-7">
        <div className="grid gap-7">
          {CAROS.map((c) => (
            <section key={c.g} aria-label={`${c.n} y ${c.estado.nombre}`}>
              <h3 className="mb-2.5 text-[15px] font-bold">{c.n} <span className="font-medium text-ink-3">· {c.estado.nombre}</span></h3>
              <Barras id={`cb-${c.g}`} tope={TOPE_ANIOS} referencia={{ valor: VIDA_LABORAL, texto: "" }}
                barras={[
                  { id: "caro", etiqueta: `Una casa típica en ${c.n}`, valor: c.a, texto: `${TOPE_ANIOS}+ años`, tono: "tabique" },
                  { id: "barata", etiqueta: casaBarataDe(c.estado.nombre), valor: c.estado.anios30Barata, texto: `${anios(c.estado.anios30Barata)} años`, tono: "claro" },
                ]} />
            </section>
          ))}
        </div>
        <ReferenciaVida />
        <p className="mt-6 rounded-2xl bg-raised px-4 py-3 text-[15px] leading-snug text-ink-2">
          <strong className="font-bold text-ink">Hasta lo barato tarda más de {ALCANZABLE} años,</strong> el plazo que el gobierno considera alcanzable.
        </p>
      </div>
      <footer className="border-t border-line px-5 py-3.5 text-[13px] text-ink-3 sm:px-7">
        Caro: {DATO_MUN} · Barato: {DATO_PRECIOS}
      </footer>
    </article>
  );
}

/** La vara de la gráfica: una vida de trabajo (18 a 65), en la misma escala de 0 a 150 años. */
function ReferenciaVida() {
  return (
    <div className="mt-5">
      <div aria-hidden className="relative h-6 text-[12px] text-ink-3">
        {[0, 50, 100, TOPE_ANIOS].map((v) => (
          <span key={v} className="num absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full" style={{ left: `${(v / TOPE_ANIOS) * 100}%` }}>{v}</span>
        ))}
      </div>
      <p className="flex items-center gap-2 text-[13px] text-ink-2">
        <span aria-hidden className="h-3.5 w-[2.5px] rounded-full bg-ink" />
        Una vida de trabajo: de los 18 a los 65 ({VIDA_LABORAL} años)
      </p>
    </div>
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
