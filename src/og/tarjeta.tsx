/**
 * Tarjetas para compartir de un lugar, para ImageResponse de next/og: Open Graph (1200×630) e historia (1080×1920).
 * Satori solo entiende flexbox y estilos en línea: nada de clases de Tailwind ni variables de CSS aquí.
 * Solo usan datos del build y el salario mínimo del lugar: no hay nada personal que filtrar.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { COLOR_TRAMO, H, W, barda } from "@/lib/barda";
import { AHORRO_PCT, ALCANZABLE, D, EDAD_INICIO, TOPE_ANIOS, aniosTxt, cuentas, nombreCompleto, type Lugar } from "@/lib/datos";
import { SITIO } from "@/lib/sitio";

export const OG = { width: 1200, height: 630 };
export const HISTORIA = { width: 1080, height: 1920 };

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
    /** Municipio sin dato propio: la tarjeta lleva el nombre del estado y lo dice. */
    nota: l.prestado ? `Cifra de ${l.nombre}: ${l.prestado.municipio} no tiene dato propio.` : null,
  };
}

/** La barda de vida, en SVG plano (sin patrones: la trama se dibuja como contorno). */
function Barda({ l, ancho }: { l: Lugar; ancho: number }) {
  const c = cuentas(l);
  const b = barda(c.terminas, l.ev, !!l.tope);
  const alto = (ancho * (b.alto + 8)) / (b.ancho + 8);
  return (
    <svg width={ancho} height={alto} viewBox={`-4 -4 ${b.ancho + 8} ${b.alto + 8}`}>
      {b.tabiques.map((t, i) => {
        const col = COLOR_TRAMO[t.tramo];
        return <rect key={i} x={t.x} y={t.y} width={W} height={H} rx={1.5} fill={col.fill} stroke={col.stroke} strokeWidth={t.tramo === "fuera" ? 1.4 : 0.6} />;
      })}
      {b.linea && <path d={b.linea} fill="none" stroke={CARBON} strokeWidth={2.4} />}
    </svg>
  );
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

/** "Casi 5 veces el plazo oficial.": la cifra del lugar contra los 20 años que CONAVI llama alcanzables. */
export function remate(n: number, tope: boolean) {
  if (tope) return `Más de ${Math.floor(TOPE_ANIOS / ALCANZABLE)} veces el plazo oficial.`;
  // Provisional: en los municipios de 20 años o menos no se compara con el plazo oficial (su regla espera el ok del usuario).
  if (Math.round(n) <= ALCANZABLE) return null;
  const r = n / ALCANZABLE;
  if (r < 1.7) return Math.round(n - ALCANZABLE) === 1 ? "1 año más que el plazo oficial." : `${Math.round(n - ALCANZABLE)} años más que el plazo oficial.`;
  const f = Math.floor(r);
  if (r - f >= 0.7) return f + 1 === 2 ? "Casi el doble del plazo oficial." : `Casi ${f + 1} veces el plazo oficial.`;
  return f === 2 ? "Más del doble del plazo oficial." : `Más de ${f} veces el plazo oficial.`;
}

/** Título-hallazgo con el número en tabique oscuro: "Con el mínimo, 96 años para juntar una casa." */
function Titulo({ d, tam }: { d: ReturnType<typeof datos>; tam: number }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", fontFamily: "Bricolage", fontSize: tam, lineHeight: 1.02, letterSpacing: -tam * 0.03 }}>
      <span>Con el mínimo,&nbsp;</span>
      <span style={{ color: TABIQUE_OSCURO }}>{d.tope ? `más de ${TOPE_ANIOS}` : d.cifra} años</span>
      <span>&nbsp;para juntar una casa.</span>
    </div>
  );
}

/** Open Graph, 1200×630 (opción A): el lugar contra lo que el gobierno llama alcanzable, en dos barras a la misma escala. */
export function TarjetaOG({ l }: { l: Lugar }) {
  const d = datos(l);
  // Las dos barras a la misma escala, contra la mayor de las dos cifras.
  const escala = 760 / Math.max(d.anios, ALCANZABLE);
  const corto = Math.round(ALCANZABLE * escala);
  const largo = Math.max(Math.round(d.anios * escala), 8);
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: CAL, fontFamily: "Instrument", color: CARBON }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: OBRA, borderBottom: `4px solid ${CARBON}`, padding: "20px 56px" }}>
        <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: d.lugar.length > 30 ? 34 : 42, letterSpacing: -1 }}>{d.lugar}</div>
        <Marca tam={28} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "30px 56px 0" }}>
        <Titulo d={d} tam={60} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 28 }}>
          {remate(d.anios, d.tope) && (<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 22, color: TINTA_2 }}>Lo que el gobierno llama alcanzable</span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", width: corto, height: 34, background: TINTA_2, borderRadius: 4 }} />
              <span style={{ fontFamily: "Bricolage", fontSize: 34 }}>{ALCANZABLE} años</span>
            </div>
          </div>)}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 22, color: TINTA_2 }}>{d.lugar}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", width: largo, height: 64, background: TABIQUE, borderRadius: 4 }} />
              <span style={{ fontFamily: "Bricolage", fontSize: 64, letterSpacing: -2 }}>{d.cifra}</span>
            </div>
          </div>
        </div>
        {remate(d.anios, d.tope) && <div style={{ display: "flex", marginTop: 20, fontSize: 30, fontWeight: 700 }}>{remate(d.anios, d.tope)}</div>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, padding: "12px 56px 22px", fontSize: 20, color: TINTA_2 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {d.nota && <span style={{ fontWeight: 700, color: CARBON }}>{d.nota}</span>}
          <span>Ahorrando el {AHORRO_PCT} % del salario mínimo · SHF, CONASAMI, CONAVI · {D.anio}</span>
        </div>
        <span style={{ fontWeight: 700, color: CARBON, fontSize: 22 }}>{dominio()}</span>
      </div>
    </div>
  );
}

/** Historia, 1080×1920 (opción A arriba, la barda de vida abajo), con margen arriba y abajo (Instagram tapa ~230 px de cada lado). */
export function TarjetaHistoria({ l }: { l: Lugar }) {
  const d = datos(l);
  const escala = 300 / Math.max(d.anios, ALCANZABLE);
  const bajo = Math.round(ALCANZABLE * escala);
  const alto = Math.max(Math.round(d.anios * escala), 8);
  const barra = (h: number, color: string, etiqueta: string, cifra: string, grande: boolean) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", width: 300 }}>
      <span style={{ fontFamily: "Bricolage", fontSize: grande ? 72 : 44, letterSpacing: -2 }}>{cifra}</span>
      <div style={{ display: "flex", width: 220, height: h, background: color, borderRadius: 6, marginTop: 10 }} />
      <span style={{ display: "flex", textAlign: "center", marginTop: 14, fontSize: 28, lineHeight: 1.15, color: TINTA_2, maxWidth: 300 }}>{etiqueta}</span>
    </div>
  );
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: CAL, fontFamily: "Instrument", color: CARBON, padding: "250px 90px 260px" }}>
      <div style={{ display: "flex", alignSelf: "flex-start", background: OBRA, border: `4px solid ${CARBON}`, borderRadius: 28, padding: "12px 26px", fontFamily: "Bricolage", fontSize: d.lugar.length > 28 ? 40 : 48, letterSpacing: -1.2 }}>
        {d.lugar}
      </div>
      <div style={{ display: "flex", marginTop: 30 }}>
        <Titulo d={d} tam={76} />
      </div>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 60, marginTop: 30 }}>
        {remate(d.anios, d.tope) && barra(bajo, TINTA_2, "Lo que el gobierno llama alcanzable", `${ALCANZABLE} años`, false)}
        {barra(alto, TABIQUE, d.lugar, `${d.cifra} años`, true)}
      </div>
      {remate(d.anios, d.tope) && <div style={{ display: "flex", marginTop: 30, fontSize: 44, fontWeight: 700 }}>{remate(d.anios, d.tope)}</div>}
      {d.nota && <div style={{ display: "flex", marginTop: 12, fontSize: 30, fontWeight: 700 }}>{d.nota}</div>}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", alignItems: "center", marginTop: 20 }}>
        <span style={{ display: "flex", alignSelf: "flex-start", fontSize: 28, color: TINTA_2, marginBottom: 12 }}>Tu vida en tabiques, uno por año. Empiezas a los {EDAD_INICIO}.</span>
        <Barda l={l} ancho={360} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14 }}>
        <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: 60, letterSpacing: -1.6 }}>¿Y dónde vives tú?</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <Marca tam={40} />
          <span style={{ fontSize: 36, fontWeight: 700 }}>{dominio()}</span>
        </div>
      </div>
    </div>
  );
}
