import Marca from "./Marca";

/** Lo que se ve un instante la primera vez que alguien entra a un municipio que no se generó al compilar. */
export default function Espera() {
  return (
    <div className="mx-auto grid min-h-dvh max-w-7xl place-items-center px-4" aria-busy="true">
      <div className="flex flex-col items-center gap-4 text-ink-2">
        <Marca className="text-3xl text-ink" />
        <p className="text-[15px]">Poniendo los tabiques…</p>
      </div>
    </div>
  );
}
