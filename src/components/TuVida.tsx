import { COLOR_TRAMO, H, W, barda } from "@/lib/barda";
import { EDAD_INICIO, conAnios, fmt } from "@/lib/datos";

/**
 * Tu vida en tabiques: un tabique por año, de los 0 hasta la vida promedio o hasta que terminas de juntar (lo que llegue
 * después, con tope: lo que pase de ahí se cuenta arriba). Niñez en cemento, años juntando en tabique, lo que te queda en amarillo obra y, arriba de la línea de carbón,
 * los años que no vas a vivir (solo contorno, con trama). `clave` reinicia la animación cuando cambia el lugar.
 */
export default function TuVida({ terminas, ev, mas, donde, clave }: { terminas: number; ev: number; mas?: boolean; donde: string; clave: string }) {
  const b = barda(terminas, ev, mas);
  const masTxt = mas ? " o más" : "";
  const filas = [
    { tramo: "ninez" as const, texto: `Niñez y escuela: ${EDAD_INICIO} años` },
    { tramo: "juntando" as const, texto: mas ? `Juntando para la casa: ${fmt(b.juntando)} o más años` : `Juntando para la casa: ${conAnios(b.juntando)}` },
    ...(b.alcanza
      ? [{ tramo: "queda" as const, texto: `Lo que te queda: ${conAnios(b.queda)}` }]
      : [{ tramo: "fuera" as const, texto: `Años que no vas a vivir: ${fmt(b.fuera)}${masTxt}` }]),
  ];
  const etiqueta = `Tu vida en tabiques, uno por año. ${filas.map((f) => f.texto).join(". ")}. La vida promedio en ${donde} es de ${b.vida} años.`;

  return (
    <figure className="w-full">
      {b.sinDibujar > 0 && (
        <p aria-hidden className="mb-2 text-right text-[14px] font-bold text-tabique-oscuro">+{fmt(b.sinDibujar)} años más, que ya no caben</p>
      )}
      <svg key={clave} viewBox={`-4 -4 ${b.ancho + 8} ${b.alto + 8}`} className="block w-full overflow-visible" role="img" aria-label={etiqueta}>
        <defs>
          <pattern id="trama-fuera" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="var(--tabique)" strokeWidth="1.2" />
          </pattern>
        </defs>
        {b.tabiques.map((t, i) => {
          const c = COLOR_TRAMO[t.tramo];
          return (
            <rect key={i} x={t.x} y={t.y} width={W} height={H} rx={1.5}
              className="tabique-anim" style={{ animationDelay: `${Math.min(i * 10, 1500)}ms` }}
              fill={t.tramo === "fuera" ? "url(#trama-fuera)" : c.fill} stroke={c.stroke} strokeWidth={t.tramo === "fuera" ? 1.2 : 0.6} />
          );
        })}
        {b.linea && <path d={b.linea} fill="none" stroke="var(--ink)" strokeWidth={2.2} strokeLinejoin="round" />}
      </svg>
      <figcaption className="mt-4 grid gap-1.5 text-[14px] text-ink-2">
        {filas.map((f) => (
          <span key={f.tramo} className="flex items-center gap-2.5">
            <Muestra tramo={f.tramo} />
            {f.texto}
          </span>
        ))}
        {!b.alcanza && (
          <span className="flex items-center gap-2.5">
            <span aria-hidden className="flex h-3 w-5 shrink-0 items-center"><span className="h-[2.5px] w-full rounded-full bg-ink" /></span>
            Aquí se acaba la vida promedio en {donde}: {b.vida}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

function Muestra({ tramo }: { tramo: keyof typeof COLOR_TRAMO }) {
  const c = COLOR_TRAMO[tramo];
  return (
    <span aria-hidden className="h-3 w-5 shrink-0 rounded-[2px] border-[1.5px]"
      style={{
        borderColor: c.stroke,
        background: tramo === "fuera" ? "repeating-linear-gradient(135deg, var(--tabique) 0 1.5px, var(--surface) 1.5px 5px)" : c.fill,
      }} />
  );
}
