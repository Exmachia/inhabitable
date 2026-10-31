/**
 * Barras horizontales con textura de tabique, en escala común, con una línea de referencia opcional.
 * Para "Caro y barato" (años) y "Con crédito" (pesos). El valor va escrito al lado: no depende del color.
 */

export type Barra = { id: string; etiqueta: React.ReactNode; valor: number; texto: string; tono: "tabique" | "claro" | "neutro" };

const FONDO = {
  tabique: { fill: "var(--tabique)", junta: "rgba(255,255,255,0.55)" },
  claro: { fill: "var(--a-2)", junta: "rgba(255,255,255,0.6)" },
  neutro: { fill: "var(--neutro)", junta: "rgba(255,255,255,0.28)" },
  // En la banda oscura el neutro se aclara: el carbón sobre carbón no se vería.
  neutroOscuro: { fill: "#a99f90", junta: "rgba(28,26,23,0.25)" },
};

/** Patrón de tabiques para el relleno de una barra (juntas claras sobre el color). */
function Textura({ id, tono }: { id: string; tono: keyof typeof FONDO }) {
  const f = FONDO[tono];
  return (
    <pattern id={id} width="24" height="16" patternUnits="userSpaceOnUse">
      <rect width="24" height="16" fill={f.fill} />
      <path d="M0 8H24M0 0.5H24M12 0.5V8M0 8V16M24 8V16" stroke={f.junta} strokeWidth="1.2" fill="none" />
    </pattern>
  );
}

export default function Barras({ id, barras, tope, referencia, oscuro }: {
  id: string;
  barras: Barra[];
  tope: number;
  referencia?: { valor: number; texto: string };
  oscuro?: boolean;
}) {
  const pct = (v: number) => `${Math.min(v / tope, 1) * 100}%`;
  return (
    <div className="relative">
      <ul className="grid gap-3.5">
        {barras.map((b) => (
          <li key={b.id}>
            <div className={`mb-1 flex items-baseline justify-between gap-3 text-[14px] ${oscuro ? "text-[#c9c1b3]" : "text-ink-2"}`}>
              <span className="min-w-0">{b.etiqueta}</span>
              <span className={`num shrink-0 font-bold ${oscuro ? "text-[#f4f0e8]" : "text-ink"}`}>{b.texto}</span>
            </div>
            <svg className="block h-5 w-full overflow-visible" aria-hidden>
              <defs><Textura id={`${id}-${b.id}`} tono={oscuro && b.tono === "neutro" ? "neutroOscuro" : b.tono} /></defs>
              <rect x="0" y="0" height="100%" width="100%" rx="4" fill={oscuro ? "rgba(244,240,232,0.08)" : "var(--raised)"} />
              <rect x="0" y="0" height="100%" width={pct(b.valor)} rx="4" fill={`url(#${id}-${b.id})`} className="transition-[width] duration-500" />
              {referencia && (
                <rect x={pct(referencia.valor)} y="-5" width="2.5" height="30" rx="1.25" transform="translate(-1.25 0)" fill={oscuro ? "#f4f0e8" : "var(--ink)"} />
              )}
            </svg>
          </li>
        ))}
      </ul>
      {referencia?.texto && (
        <p className={`mt-3 flex items-center gap-2 text-[13px] ${oscuro ? "text-[#c9c1b3]" : "text-ink-2"}`}>
          <span aria-hidden className={`h-3.5 w-[2.5px] rounded-full ${oscuro ? "bg-[#f4f0e8]" : "bg-ink"}`} />
          {referencia.texto}
        </p>
      )}
    </div>
  );
}


/**
 * Las dos barras de la tarjeta del lugar, la misma comparación que viaja en la imagen para compartir: la corta (el plazo
 * oficial, o el crédito en pesos) en neutro y la larga en tabique, a la misma escala, con el valor en una columna fija.
 */
export function DosBarras({ id, corta, larga, tope, etiqueta }: {
  id: string;
  corta: { etiqueta: string; valor: number; texto: string };
  larga: { etiqueta: string; valor: number; cifra: string; unidad?: string };
  /** La larga llega al tope (150+): llena el carril y termina en zigzag. */
  tope?: boolean;
  etiqueta: string;
}) {
  const max = Math.max(corta.valor, larga.valor);
  const pct = (v: number) => `${Math.max(Math.min(v / max, 1) * 100, 2)}%`;
  return (
    <figure role="img" aria-label={etiqueta} className="grid gap-4">
      <div>
        <p className="text-[13px] text-ink-2">{corta.etiqueta}</p>
        <div className="mt-1 grid grid-cols-[minmax(0,1fr)_96px] items-center gap-3">
          <svg className="block h-6 w-full" aria-hidden>
            <defs><Textura id={`${id}-corta`} tono="neutro" /></defs>
            <rect x="0" y="0" height="100%" width={pct(corta.valor)} rx="4" fill={`url(#${id}-corta)`} className="transition-[width] duration-500" />
          </svg>
          <span className="num text-right text-[18px] leading-none font-bold">{corta.texto}</span>
        </div>
      </div>
      <div>
        <p className="text-[13px] text-ink-2">{larga.etiqueta}</p>
        <div className="mt-1 grid grid-cols-[minmax(0,1fr)_96px] items-center gap-3">
          <div className="flex h-10 w-full">
            <svg className="block h-full shrink" style={{ width: tope ? "100%" : pct(larga.valor) }} aria-hidden>
              <defs><Textura id={`${id}-larga`} tono="tabique" /></defs>
              <rect x="0" y="0" height="100%" width="100%" rx={tope ? 0 : 4} fill={`url(#${id}-larga)`} />
            </svg>
            {tope && (
              <svg className="block h-full w-2 shrink-0" viewBox="0 0 8 100" preserveAspectRatio="none" aria-hidden>
                <path d="M0 0H8L2 16.6L8 33.3L2 50L8 66.6L2 83.3L8 100H0Z" fill="var(--tabique)" />
              </svg>
            )}
          </div>
          <span className="text-right leading-none">
            <span className={`cifra font-extrabold ${larga.cifra.length > 5 ? "text-[1.35rem]" : larga.cifra.length > 3 ? "text-[2rem]" : "text-[2.75rem]"}`}>{larga.cifra}</span>
            {larga.unidad && <span className="ml-1 font-display text-[1rem] font-bold">{larga.unidad}</span>}
          </span>
        </div>
      </div>
    </figure>
  );
}

/**
 * Variante compacta para "Caro y barato": sin etiqueta por barra (la lleva una leyenda única), barras de 14 px y el valor
 * en una columna fija a la derecha. La raya de referencia cruza las dos barras.
 */
export function BarrasCompactas({ id, barras, tope, referencia }: { id: string; barras: Barra[]; tope: number; referencia?: number }) {
  const pct = (v: number) => `${Math.min(v / tope, 1) * 100}%`;
  return (
    <div className="relative grid gap-1.5">
      {barras.map((b) => (
        <div key={b.id} className="grid grid-cols-[minmax(0,1fr)_56px] items-center gap-3">
          <svg className="block h-3.5 w-full overflow-visible" aria-hidden>
            <defs><Textura id={`${id}-${b.id}`} tono={b.tono} /></defs>
            <rect x="0" y="0" height="100%" width="100%" rx="3" fill="var(--raised)" />
            <rect x="0" y="0" height="100%" width={pct(b.valor)} rx="3" fill={`url(#${id}-${b.id})`} />
          </svg>
          <span className="num text-right text-[15px] leading-none font-bold">{b.texto}</span>
        </div>
      ))}
      {referencia != null && (
        <div aria-hidden className="pointer-events-none absolute inset-y-[-4px] left-0 right-[68px]">
          <span className="absolute inset-y-0 w-[2.5px] -translate-x-1/2 rounded-full bg-ink" style={{ left: pct(referencia) }} />
        </div>
      )}
    </div>
  );
}
