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
