import { CONTACTO } from "@/lib/sitio";
import {
  AHORRO_PCT, ALCANZABLE, D, DATO_MUN, DATO_PRECIOS, INFO, MAS_BARATO, MUN, NAC, PODER_INFO, SM, TITULAR_CAROS, aniosTxt, fechaCorta, fmt, mesAnio, pesos, titularDe,
  type Lugar,
} from "@/lib/datos";
import { LugarInicial } from "@/lib/lugar";
import Buscador from "./Buscador";
import CaroBarato from "./CaroBarato";
import ColumnaLugar from "./ColumnaLugar";
import MapaMexico from "./MapaMexico";
import Marca from "./Marca";
import { Ayuda } from "./ui";
import Aparecer from "./landing/Aparecer";
import Atajos from "./landing/Atajos";
import Barra from "./landing/Barra";
import { AntesPestanas, CreditoBarras } from "./landing/Secciones";

const ENOE = D.fuentes.enoe;
const TEND = D.fuentes.enoeTendencia;
const INFORMAL = D.fuentes.informalidad;
const H2 = "font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[1] font-extrabold tracking-[-0.035em] text-balance";

/** La página entera. `inicial`: el lugar de la dirección (null en la portada). */
export default function Pagina({ inicial }: { inicial: Lugar | null }) {
  return (
    <LugarInicial lugar={inicial}>
      <Barra />
      <main id="inicio">
        <Portada inicial={inicial} />
        <Mapa conLugar={!!inicial} />
        <ConCredito />
        <AntesYAhora />
        <QuienGana />
        <Metodo />
      </main>
      <Pie />
    </LugarInicial>
  );
}

/* ---------- 1. Portada ---------- */

function Portada({ inicial }: { inicial: Lugar | null }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-24 pb-16 sm:px-8 lg:pt-32 lg:pb-24">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28">
          <p className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-surface px-3 py-1 text-[13px] font-bold">
            <span aria-hidden className="size-2 rounded-full bg-tabique" />
            Salario mínimo {D.fuentes.salario.anio}: {pesos(SM)} al día
          </p>
          <h1 className="mt-6 font-display text-[clamp(2.5rem,5.6vw,4.6rem)] leading-[0.95] font-extrabold tracking-[-0.045em] text-balance">
            {inicial ? titularDe(inicial) : TITULAR_CAROS}
          </h1>
          <div className="mt-6 flex max-w-[44ch] items-start gap-2">
            <p className="text-[1.15rem] leading-relaxed text-ink-2">
              Ahorrando el {AHORRO_PCT}% de lo que ganas. En todo México son {aniosTxt(NAC.anios30)}.
            </p>
            <div className="pt-0.5"><AyudaTitular /></div>
          </div>
          <p className="mt-8 text-[15px] font-bold">¿Y dónde vives tú?</p>
          <div className="mt-3 max-w-xl">
            <Buscador grande />
          </div>
          <div className="mt-5 max-w-xl">
            <Atajos />
          </div>
        </div>
        <ColumnaLugar caros={<CaroBarato />} />
      </div>
    </section>
  );
}

function AyudaTitular() {
  return (
    <Ayuda titulo="De dónde sale">
      <p>
        Precio típico de una casa entre lo que se junta en un año ahorrando el {AHORRO_PCT}% del salario mínimo ({pesos(SM)} al día). Sin intereses ni aumentos.
      </p>
      <p>
        <strong>Los {MUN.mas100} municipios</strong> salen de la estimación por municipio con los créditos de vivienda del SNIIV (SEDATU). Solo {MUN.conDatos} de {fmt(MUN.total)} municipios
        tienen créditos suficientes para calcularlo. <strong>Todo México</strong> usa la cifra oficial de la Sociedad Hipotecaria Federal.
      </p>
      <p className="text-[13px] text-ink-3">{DATO_PRECIOS} · {DATO_MUN}</p>
    </Ayuda>
  );
}

/* ---------- 2. Mapa ---------- */

function Mapa({ conLugar }: { conLugar: boolean }) {
  return (
    <section id="mapa" className="scroll-mt-16">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8 lg:py-28">
        <Aparecer>
          <p className="text-[14px] font-bold text-tabique-oscuro">Por estado y por municipio</p>
          <h2 className={`mt-3 max-w-[22ch] ${H2}`}>
            {conLugar ? TITULAR_CAROS : `En ningún estado baja de ${aniosTxt(Math.floor(MAS_BARATO.anios30))} años`}
          </h2>
          <p className="mt-5 max-w-[52ch] text-[1.1rem] leading-relaxed text-ink-2">Toca tu estado y luego tu municipio.</p>
        </Aparecer>
        <div className="mt-10">
          <MapaMexico />
        </div>
      </div>
    </section>
  );
}

/* ---------- 3. Con crédito (INFONAVIT) ---------- */

function ConCredito() {
  const inf = D.infonavit;
  return (
    <section id="credito" aria-labelledby="credito-t" className="scroll-mt-16 border-y-2 border-ink bg-ink text-[#f4f0e8]">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:py-24">
        <div>
          <p className="text-[14px] font-bold text-[#e19a5e]">Con crédito</p>
          <div className="mt-3 flex items-start gap-3">
            <h2 id="credito-t" className={`max-w-[18ch] ${H2}`}>Ni con el crédito del INFONAVIT y tu ahorro de vivienda te alcanza para 1 de cada 4 casas</h2>
            <div className="pt-2"><AyudaCredito /></div>
          </div>
          <p className="mt-6 max-w-[48ch] text-[1.15rem] leading-relaxed text-[#c9c1b3]">
            Y {fmt(Math.round(INFORMAL.pct))} de cada 100 trabajan sin seguro social: ni a ese crédito llegan.
          </p>
          <p className="mt-6 text-[13px] text-[#a99f90]">
            INFONAVIT (monto citado por prensa con su simulador) · SHF, {D.fuentes.precios.periodo} · INEGI, ENOE ({INFORMAL.periodo}, vía prensa)
          </p>
          <p className="sr-only">En los {inf.estadosSinAlcanzarBarata} estados, el crédito queda debajo de la casa barata.</p>
        </div>
        <CreditoBarras />
      </div>
    </section>
  );
}

function AyudaCredito() {
  const inf = D.infonavit;
  return (
    <Ayuda titulo="Con INFONAVIT" claro>
      <p>
        A quien gana el salario mínimo, el INFONAVIT le presta unos <strong>{pesos(INFO.monto)}</strong> a {INFO.anios} años, con la tasa más baja: <strong>{INFO.tasa}%</strong>. La
        mensualidad sería de {pesos(inf.mensualidad)}: el {inf.pctSalario}% del sueldo.
      </p>
      <p>
        A eso el INFONAVIT le suma lo que juntaste en la <strong>subcuenta de vivienda</strong> (el 5 % de tu sueldo que pone el patrón). Con 15 años ganando el mínimo
        serían unos <strong>{pesos(INFO.subcuenta)}</strong> (cálculo nuestro, del lado generoso: sin huecos y con 7 % de rendimiento): en total, {pesos(PODER_INFO)}. Y todavía faltan los gastos de escrituración. El crédito también baja con la edad: a los 50
        años, unos $470 mil.
      </p>
      <p>
        Aun sumando las dos cosas, queda debajo de la casa barata (la cuarta parte más barata de las que se venden con crédito) en los <strong>{inf.estadosSinAlcanzarBarata} estados</strong>.
      </p>
      <p>
        <strong>Por qué no usamos la tasa de los bancos</strong> ({D.fuentes.credito.tasa}%): quien gana el mínimo no saca crédito en un banco; si tiene empleo formal, va al INFONAVIT.
      </p>
      <p>
        <strong>Vivienda para el Bienestar</strong> ofrece casas de unos $600 mil, pero es un programa con oferta limitada: no es el mercado.
      </p>
      <p className="text-[13px] text-ink-3">
        Ojo: el monto y la tasa vienen de prensa que cita al instituto (
        <a className="underline" href={INFO.montoUrl} target="_blank" rel="noopener noreferrer">UnoTV, 10 feb 2026</a>;{" "}
        <a className="underline" href={INFO.tasaUrl} target="_blank" rel="noopener noreferrer">Expansión, 6 oct 2026</a>). El monto exacto solo sale en Mi Cuenta Infonavit, con
        tus datos; no encontramos una publicación oficial con estas cifras. Informalidad: {INFORMAL.pct}% ({INFORMAL.periodo}), ENOE vía prensa.
      </p>
    </Ayuda>
  );
}

/* ---------- 4. Antes y ahora ---------- */

function AntesYAhora() {
  return (
    <section id="antes" className="scroll-mt-16 border-b-2 border-ink bg-surface">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:py-28">
        <Aparecer>
          <p className="text-[14px] font-bold text-tabique-oscuro">Antes y ahora</p>
          <div className="mt-3 flex items-start gap-3">
            <h2 className={H2}>Aun con el mayor aumento al mínimo en décadas, faltan {aniosTxt(NAC.anios30)} años</h2>
            <div className="pt-2"><AyudaAntes /></div>
          </div>
          <p className="mt-5 text-[1.1rem] leading-relaxed text-ink-2">Casi el doble de los {ALCANZABLE} que el propio gobierno considera alcanzables.</p>
        </Aparecer>
        <Aparecer retraso={120}>
          <div className="rounded-[28px] border-2 border-ink bg-bg p-5 sm:p-7">
            <AntesPestanas />
          </div>
        </Aparecer>
      </div>
    </section>
  );
}

function AyudaAntes() {
  const s = D.salarioReal;
  const s2005 = s[0], sHoy = s.at(-1)!;
  const serie = D.serieAnios.filter((p) => [2005, 2010, 2015, 2016, 2018, 2019, 2022, D.anio].includes(p.y));
  return (
    <Ayuda titulo="Cómo comparamos con el pasado">
      <p>
        Cada año, el precio típico de una casa entre lo que se junta ahorrando el {AHORRO_PCT}% del salario mínimo de ese año. El precio de cada año sale del{" "}
        <strong>Índice SHF de Precios de la Vivienda</strong>, que sigue casas parecidas desde 2005.
      </p>
      <table className="w-full text-[14px]">
        <tbody>
          {serie.map((p) => (
            <tr key={p.y} className="border-b border-line"><td className="py-1">{p.y}</td><td className="num py-1 text-right font-semibold text-ink">{aniosTxt(p.anios)} años</td></tr>
          ))}
        </tbody>
      </table>
      <p>
        <strong>El mínimo subió:</strong> en pesos de hoy pasó de {pesos(s2005.real)} al día en 2005 a {pesos(sHoy.real)} en {D.anio}, casi todo desde 2019. <strong>Las casas también:</strong>{" "}
        {NAC.subidaReal}% por encima de la inflación desde 2005.
      </p>
      <p className="text-[13px] text-ink-3">
        Fuentes: SHF, Índice SHF (datos abiertos, 2005 al 2.º trimestre de {D.anio}); INEGI, INPC; CONASAMI, salarios mínimos (vía Banxico); CONAVI, Programa Institucional
        2025–2030. Promedio de enero a junio de cada año.
      </p>
    </Ayuda>
  );
}

/* ---------- 5. Quién gana eso ---------- */

function QuienGana() {
  const grupos = [
    { id: "uno", label: "Gana un salario mínimo o menos", pct: ENOE.pctHastaUnSM, color: "var(--tabique)" },
    { id: "no", label: "Trabaja sin recibir pago", pct: ENOE.pctNoRecibe, color: "var(--a-4)" },
    { id: "mas", label: "Gana más", pct: ENOE.pctMasDeUnSM, color: "var(--line-strong)" },
    { id: "ns", label: "No dijo cuánto", pct: ENOE.pctNoEspecificado, color: "var(--raised)" },
  ];
  // Método del mayor residuo: siempre suman 100.
  const total = grupos.reduce((s, g) => s + g.pct, 0);
  const exactos = grupos.map((g) => (g.pct / total) * 100);
  const cuadros = exactos.map(Math.floor);
  const orden = exactos.map((x, i) => [x - Math.floor(x), i] as const).sort((a, b) => b[0] - a[0]);
  for (let k = 0; k < 100 - cuadros.reduce((s, x) => s + x, 0); k++) cuadros[orden[k][1]]++;
  const personas = grupos.flatMap((g, i) => Array.from({ length: cuadros[i] }, () => g));

  return (
    <section id="quien" className="scroll-mt-16">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
        <Aparecer>
          <p className="text-[14px] font-bold text-tabique-oscuro">Quién gana eso</p>
          <div className="mt-3 flex items-start gap-3">
            <h2 className={H2}>Casi 1 de cada 2 personas que trabajan gana el mínimo o menos</h2>
            <div className="pt-2"><AyudaQuien /></div>
          </div>
          <p className="mt-5 text-[1.1rem] leading-relaxed text-ink-2">
            {fmt(ENOE.personasHastaUnSM / 1e6, 1)} millones. A inicios de 2025 eran {Math.round(TEND.antes.pct)} de cada 100; a inicios de 2026, {Math.round(TEND.ahora.pct)}.
          </p>
          <p className="mt-2 text-[13px] text-ink-3">INEGI, ENOE, {ENOE.periodo} · publicado el {fechaCorta(ENOE.publicado)} · tendencia: 1.er trim. contra 1.er trim., vía prensa</p>
        </Aparecer>
        <Aparecer retraso={120}>
          <figure className="rounded-[28px] border-2 border-ink bg-surface p-5 sm:p-7">
            <div className="grid grid-cols-10 gap-x-1.5 gap-y-2" role="img"
              aria-label={`De cada 100 personas que trabajan: ${grupos.map((g, i) => `${g.label}, ${cuadros[i]}`).join("; ")}.`}>
              {personas.map((g, i) => (
                <svg key={i} viewBox="0 0 20 36" className="h-auto w-full" aria-hidden>
                  <circle cx="10" cy="5.5" r="5" fill={g.color} stroke={g.id === "ns" ? "var(--line-strong)" : "none"} />
                  <path d="M2 16a8 8 0 0 1 16 0v9h-3v11H5V25H2Z" fill={g.color} stroke={g.id === "ns" ? "var(--line-strong)" : "none"} />
                </svg>
              ))}
            </div>
            <figcaption>
              <ul className="mt-6 grid gap-2 text-[15px]">
                {grupos.map((g, i) => (
                  <li key={g.id} className="flex items-center gap-3">
                    <span aria-hidden className="size-3.5 shrink-0 rounded-full ring-1 ring-black/15" style={{ background: g.color }} />
                    <span className="min-w-0 flex-1">{g.label}</span>
                    <span className="num font-bold">{cuadros[i]}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13px] text-ink-3">De cada 100 personas que trabajan</p>
            </figcaption>
          </figure>
        </Aparecer>
      </div>
    </section>
  );
}

function AyudaQuien() {
  return (
    <Ayuda titulo="Por qué crece">
      <p>
        Cuando el mínimo sube más rápido que los demás sueldos, más gente queda debajo de la línea. Por eso decimos “el mínimo <strong>o menos</strong>”.
      </p>
      <p>
        La ENOE pregunta cuánto gana cada persona: es lo que la gente <strong>declara</strong>, y casi {Math.round(ENOE.pctNoEspecificado)} de cada 100 no dicen cuánto.
      </p>
      <p className="text-[13px] text-ink-3">
        {TEND.antes.pct}% en el {TEND.antes.periodo} y {TEND.ahora.pct}% en el {TEND.ahora.periodo}: {TEND.fuente}. Dato principal: {ENOE.fuente}.
      </p>
    </Ayuda>
  );
}

/* ---------- 6. Cómo lo calculamos ---------- */

function Metodo() {
  const inf = D.infonavit;
  const bloques: [string, string][] = [
    ["Precio por estado", `Precio típico (mediana) de avalúo de las casas compradas con crédito hipotecario, ${D.fuentes.precios.periodo}. Fuente: Sociedad Hipotecaria Federal (SHF), publicado el ${fechaCorta(D.fuentes.precios.publicado)}. “Una casa barata” es el cuartil inferior: la cuarta parte más barata.`],
    ["Precio por municipio", `Estimado con los créditos para comprar casa nueva o usada que registró el SNIIV (SEDATU) de ${mesAnio(MUN.desde)} a ${mesAnio(MUN.hasta)}, según su rango de precio. Solo municipios con ${MUN.minimo} créditos o más (${MUN.conDatos} de ${fmt(MUN.total)}). Comparado con la SHF en cada estado, casi siempre se queda corto: los años reales pueden ser más. Cuando un municipio sale por debajo de la casa barata de su estado, lo marcamos como “estimación baja”.`],
    ["Años para comprar", `Precio entre lo que se junta en un año con el salario mínimo de ${D.fuentes.salario.anio} (${pesos(SM)} al día; ${pesos(D.fuentes.salario.frontera)} en la frontera norte), ahorrando el ${AHORRO_PCT}%. Sin intereses ni aumentos. La CONAVI considera alcanzable pagar la casa con el 30 % del ingreso en ${ALCANZABLE} años: es la misma cuenta.`],
    ["Con INFONAVIT", `Lo que el INFONAVIT le presta a quien gana el mínimo: unos ${pesos(INFO.monto)} a ${INFO.anios} años con la tasa más baja (${INFO.tasa}%); mensualidad de ${pesos(inf.mensualidad)}, el ${inf.pctSalario}% del mínimo. El monto y la tasa vienen de prensa que cita el simulador del instituto (UnoTV, 10 feb 2026; Expansión, 6 oct 2026): el portal del INFONAVIT no publica una tabla que pudiéramos consultar y el monto exacto se ve solo en Mi Cuenta Infonavit. Si cambian, cambian esta sección y la pestaña.`],
    ["Por qué otras notas dan otra cifra", "Usamos el avalúo de la SHF (casas vendidas con crédito), que suele ser más bajo que los precios de anuncios que usan otros medios. Y usamos el salario mínimo, no el promedio."],
    ["Lo que este cálculo no incluye", "Intereses, escrituración, aumentos de precio o de salario, aguinaldo (con él serían ~4 % menos años) y la vivienda que la gente construye por su cuenta, que es mucha."],
    ["Esperanza de vida", `Años que se espera que viva en promedio una persona al nacer, por estado, ${D.fuentes.vida.anio}. Fuente: CONAPO, proyecciones de la población 2020–2070. Quien ya llegó a los 50 o 60 suele vivir algunos años más que ese promedio.`],
    ["Antes y ahora", "Precio de cada año con el Índice SHF de Precios de la Vivienda (2005 a hoy) y salario mínimo de cada año (CONASAMI). En la pestaña del precio, sin inflación (INPC del INEGI). Primer semestre de cada año."],
    ["Quién gana eso", `Encuesta Nacional de Ocupación y Empleo (ENOE) del INEGI, ${ENOE.periodo}: personas ocupadas por nivel de ingreso. La tendencia (${TEND.antes.pct}% → ${TEND.ahora.pct}%) es de prensa con datos de la ENOE.`],
    ["Tu sueldo no se guarda", "Lo que escribes en “Lo que te llega al mes” se calcula en tu teléfono o computadora. No va en la dirección, ni en lo que compartes, ni se guarda, ni se envía. Solo contamos que alguien usó el campo, sin el monto. También contamos qué lugar se busca o se comparte, sin cookies."],
  ];
  return (
    <section id="metodo" className="scroll-mt-16 border-t-2 border-ink bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8 lg:py-24">
        <h2 className="font-display text-[clamp(1.9rem,3.6vw,2.8rem)] font-extrabold tracking-[-0.03em]">Cómo lo calculamos</h2>
        <p className="mt-2 text-[13px] text-ink-3">
          Datos al {fechaCorta(D.fuentes.precios.publicado)} (SHF) · salario mínimo {D.fuentes.salario.anio} · ENOE, {fechaCorta(ENOE.publicado)} · SNIIV hasta {mesAnio(MUN.hasta)} ·
          INFONAVIT revisado el {fechaCorta(INFO.verificado)}
        </p>
        <div className="mt-8 grid gap-x-10 md:grid-cols-2">
          {bloques.map(([t, d]) => (
            <details key={t} className="group border-t-2 border-line">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-bold">
                {t}
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-ink text-[18px] leading-none transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pb-5 leading-relaxed text-ink-2">{d}</p>
            </details>
          ))}
        </div>
        <p className="mt-10 max-w-[72ch] text-[14px] leading-relaxed text-ink-3">
          Lo que estos datos no dicen: solo cuentan casas compradas con crédito; no incluyen la vivienda que la gente construye por su cuenta. {DATO_MUN}. Mapa base: ©
          OpenStreetMap, OpenFreeMap.
        </p>
      </div>
    </section>
  );
}

function Pie() {
  return (
    <footer className="border-t-2 border-ink bg-obra">
      <div className="mx-auto max-w-7xl px-4 py-10 text-[14px] text-ink sm:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Marca className="text-2xl" />
          <span className="font-medium">Datos públicos oficiales: SHF, SEDATU, CONASAMI, INEGI, CONAPO y Banxico. Datos al {fechaCorta(D.fuentes.precios.publicado)} (SHF).</span>
        </div>
        <p className="mt-4 max-w-[72ch]">
          Proyecto ciudadano independiente, sin fines de lucro. No está afiliado al Instituto del Fondo Nacional de la Vivienda para los Trabajadores (INFONAVIT) ni a ninguna
          dependencia de gobierno; el nombre es una parodia.
        </p>
        <p className="mt-6 text-[15px]">
          ¿Tienes datos, sabes del tema o quieres ayudar?{" "}
          <a href={CONTACTO} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-4">Escríbeme en LinkedIn</a>
        </p>
      </div>
    </footer>
  );
}
