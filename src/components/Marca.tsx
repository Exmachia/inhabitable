/**
 * Marca "Inhabitable": juego de palabras con INFONAVIT (una casa que no se puede habitar porque no se puede pagar). Nunca usar el logo ni los colores del instituto.
 * Un tabique como isotipo: cada año de ahorro es uno.
 */
export default function Marca({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-extrabold tracking-[-0.03em] ${className}`}>
      <svg aria-hidden viewBox="0 0 28 18" className="h-[0.8em] w-auto">
        <rect x="0" y="10" width="13" height="8" rx="1.5" fill="var(--tabique)" />
        <rect x="15" y="10" width="13" height="8" rx="1.5" fill="var(--tabique)" />
        <rect x="7.5" y="0" width="13" height="8" rx="1.5" fill="var(--ink)" />
      </svg>
      <span>Inhabitable</span>
    </span>
  );
}
