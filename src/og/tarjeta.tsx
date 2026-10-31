/**
 * Tarjetas para compartir de un lugar, para ImageResponse de next/og: Open Graph (1200×630) e historia (1080×1920).
 * Satori solo entiende flexbox y estilos en línea: nada de clases de Tailwind ni variables de CSS aquí.
 * Solo usan datos del build y el salario mínimo del lugar: no hay nada personal que filtrar.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { AHORRO_PCT, ALCANZABLE, D, EDAD_INICIO, TOPE_ANIOS, aniosTxt, bajoPlazo, cuentas, nombreCompleto, remate, type Lugar } from "@/lib/datos";
import { SITIO } from "@/lib/sitio";

export const OG = { width: 1200, height: 630 };
export const HISTORIA = { width: 1080, height: 1920 };
/** Las tarjetas solo cambian cuando cambian los datos: que Vercel las guarde un día en vez de dibujarlas en cada visita. */
export const CACHE = { "Cache-Control": "public, max-age=86400, immutable" };

const CAL = "#f4f0e8";
const CARBON = "#1c1a17";
const TINTA_2 = "#4f4a42";
const OBRA = "#f0b429";
const TABIQUE = "#c2502b";
const TABIQUE_OSCURO = "#8a3418";

export async function fuentes() {
  const dir = join(process.cwd(), "src/og/fuentes");
  const [display, sans, sansBold] = await Promise.all([
    readFile(join(dir, "Bricolage-ExtraBold.ttf")),
    readFile(join(dir, "InstrumentSans-Medium.ttf")),
    readFile(join(dir, "InstrumentSans-Bold.ttf")),
  ]);
  return [
    { name: "Bricolage", data: display, weight: 800 as const, style: "normal" as const },
    { name: "Instrument", data: sans, weight: 500 as const, style: "normal" as const },
    { name: "Instrument", data: sansBold, weight: 700 as const, style: "normal" as const },
  ];
}

const dominio = () => new URL(SITIO).host.replace(/^www\./, "");

function datos(l: Lugar) {
  const c = cuentas(l);
  return {
    lugar: l.tipo === "pais" ? "Todo México" : nombreCompleto(l),
    cifra: aniosTxt(c.ahorrando, !!l.tope),
    anios: l.tope ? TOPE_ANIOS : c.ahorrando,
    tope: !!l.tope,
    terminas: c.terminas,
    /** 20 años o menos: barras en pesos en lugar del plazo oficial. */
    bajo: bajoPlazo(l),
    /** Municipio sin dato propio: la tarjeta lleva el nombre del estado y lo dice. */
    nota: l.prestado ? `Cifra de ${l.nombre}: ${l.prestado.municipio} no tiene dato propio.` : null,
  };
}

function Marca({ tam }: { tam: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: tam * 0.3, fontFamily: "Bricolage", fontSize: tam, letterSpacing: -tam * 0.03 }}>
      <svg width={tam * 1.1} height={tam * 0.7} viewBox="0 0 28 18">
        <rect x="0" y="10" width="13" height="8" rx="1.5" fill={TABIQUE} />
        <rect x="15" y="10" width="13" height="8" rx="1.5" fill={TABIQUE} />
        <rect x="7.5" y="0" width="13" height="8" rx="1.5" fill={CARBON} />
      </svg>
      <span>Inavitable</span>
    </div>
  );
}

/** Título-hallazgo con el número en tabique oscuro: "Con el mínimo, 96 años para juntar una casa." */
function Titulo({ d, tam }: { d: ReturnType<typeof datos>; tam: number }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", fontFamily: "Bricolage", fontSize: tam, lineHeight: 1.02, letterSpacing: -tam * 0.03 }}>
      <span>Con el mínimo,&nbsp;</span>
      <span style={{ color: TABIQUE_OSCURO }}>{d.tope ? `más de ${TOPE_ANIOS}` : d.cifra} años&nbsp;</span>
      <span>para juntar una casa.</span>
    </div>
  );
}

/** Las dos barras, la corta en neutro y la larga en tabique: contra el plazo oficial, o en pesos si son 20 años o menos. */
function barras(d: ReturnType<typeof datos>) {
  if (d.bajo) {
    const { corta, larga } = d.bajo;
    return { corta: { ...corta, n: corta.valor }, larga: { ...larga, n: larga.valor }, remate: d.bajo.remate, fuentes: d.bajo.fuentes };
  }
  return {
    corta: { etiqueta: "Lo que el gobierno llama alcanzable", txt: `${ALCANZABLE} años`, n: ALCANZABLE },
    larga: { etiqueta: d.lugar, txt: d.cifra, n: d.anios },
    remate: remate(d.anios, d.tope),
    fuentes: "SHF, CONASAMI, CONAVI",
  };
}

/** Open Graph, 1200×630 (opción A): el lugar contra lo que el gobierno llama alcanzable, en dos barras a la misma escala. */
export function TarjetaOG({ l }: { l: Lugar }) {
  const d = datos(l);
  const b = barras(d);
  // Las dos barras a la misma escala, contra la mayor de las dos cifras; más cortas si la cifra en pesos es larga.
  const escala = (b.larga.txt.length > 9 ? 620 : 760) / Math.max(b.larga.n, b.corta.n);
  const corto = Math.round(b.corta.n * escala);
  const largo = Math.max(Math.round(b.larga.n * escala), 8);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: CAL, fontFamily: "Instrument", color: CARBON }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: OBRA, borderBottom: `4px solid ${CARBON}`, padding: "20px 56px" }}>
        <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: d.lugar.length > 30 ? 34 : 42, letterSpacing: -1 }}>{d.lugar}</div>
        <Marca tam={28} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "30px 56px 0" }}>
        <Titulo d={d} tam={60} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 22, color: TINTA_2 }}>{b.corta.etiqueta}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", width: corto, height: 34, background: TINTA_2, borderRadius: 4 }} />
              <span style={{ fontFamily: "Bricolage", fontSize: 34 }}>{b.corta.txt}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 22, color: TINTA_2 }}>{b.larga.etiqueta}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", width: largo, height: 64, background: TABIQUE, borderRadius: 4 }} />
              <span style={{ fontFamily: "Bricolage", fontSize: 64, letterSpacing: -2 }}>{b.larga.txt}</span>
            </div>
          </div>
        </div>
        {b.remate && <div style={{ display: "flex", marginTop: 20, fontSize: d.bajo ? 26 : 30, fontWeight: 700 }}>{b.remate}</div>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, padding: "12px 56px 22px", fontSize: 20, color: TINTA_2 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {d.nota && <span style={{ fontWeight: 700, color: CARBON }}>{d.nota}</span>}
          <span>Ahorrando el {AHORRO_PCT} % del salario mínimo · {b.fuentes} · {D.anio}</span>
        </div>
        <span style={{ fontWeight: 700, color: CARBON, fontSize: 22 }}>{dominio()}</span>
      </div>
    </div>
  );
}

/** Historia, 1080×1920 (opción A en vertical), con margen arriba y abajo (Instagram tapa ~230 px de cada lado). */
export function TarjetaHistoria({ l }: { l: Lugar }) {
  const d = datos(l);
  const b = barras(d);
  const escala = 640 / Math.max(b.larga.n, b.corta.n);
  const bajo = Math.max(Math.round(b.corta.n * escala), 8);
  const alto = Math.max(Math.round(b.larga.n * escala), 8);
  const ev = Math.round(l.ev);
  const noAlcanza = !d.bajo && (d.tope || d.terminas > ev);
  const barra = (h: number, color: string, etiqueta: string, cifra: string, grande: boolean, zigzag: boolean) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", width: 340 }}>
      <span style={{ fontFamily: "Bricolage", fontSize: grande ? 96 : 56, letterSpacing: -2, lineHeight: 1 }}>{cifra}</span>
      {zigzag && (
        <svg width={260} height={14} viewBox="0 0 260 14" style={{ marginTop: 10 }}>
          <path d="M0 14L0 0L21.7 14L43.3 0L65 14L86.7 0L108.3 14L130 0L151.7 14L173.3 0L195 14L216.7 0L238.3 14L260 0L260 14Z" fill={color} />
        </svg>
      )}
      <div style={{ display: "flex", width: 260, height: zigzag ? h - 14 : h, background: color, borderRadius: zigzag ? "0 0 6px 6px" : 6, marginTop: zigzag ? 0 : 10 }} />
      <span style={{ display: "flex", textAlign: "center", marginTop: 14, fontSize: 30, lineHeight: 1.15, color: TINTA_2, maxWidth: 340 }}>{etiqueta}</span>
    </div>
  );
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: CAL, fontFamily: "Instrument", color: CARBON, padding: "250px 90px 260px" }}>
      <div style={{ display: "flex", alignSelf: "flex-start", background: OBRA, border: `4px solid ${CARBON}`, borderRadius: 28, padding: "12px 26px", fontFamily: "Bricolage", fontSize: d.lugar.length > 28 ? 40 : 48, letterSpacing: -1.2 }}>
        {d.lugar}
      </div>
      <div style={{ display: "flex", marginTop: 40 }}>
        <Titulo d={d} tam={84} />
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 80, marginTop: 50 }}>
        {barra(bajo, TINTA_2, b.corta.etiqueta, d.bajo ? b.corta.txt : `${ALCANZABLE} años`, false, false)}
        {barra(alto, TABIQUE, b.larga.etiqueta, d.bajo ? b.larga.txt : d.tope ? `${TOPE_ANIOS}+` : `${d.cifra} años`, true, d.tope)}
      </div>
      {b.remate && <div style={{ display: "flex", marginTop: 56, fontSize: 52, lineHeight: 1.1, fontWeight: 700 }}>{b.remate}</div>}
      {noAlcanza && (
        <div style={{ display: "flex", marginTop: 16, fontSize: 36, lineHeight: 1.2, color: TINTA_2 }}>
          {d.tope ? `Terminarías después de los ${EDAD_INICIO + TOPE_ANIOS}.` : `Terminarías a los ${d.terminas}.`} Aquí se vive en promedio {ev}.
        </div>
      )}
      {d.nota && <div style={{ display: "flex", marginTop: 12, fontSize: 30, fontWeight: 700 }}>{d.nota}</div>}
      <div style={{ display: "flex", flex: 1 }} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14 }}>
        <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: 64, letterSpacing: -1.6 }}>¿Y dónde vives tú?</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <Marca tam={40} />
          <span style={{ fontSize: 36, fontWeight: 700 }}>{dominio()}</span>
        </div>
      </div>
    </div>
  );
}
