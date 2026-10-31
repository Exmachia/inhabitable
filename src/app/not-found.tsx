import Link from "next/link";
import Marca from "@/components/Marca";

export default function NoEncontrado() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-xl place-items-center px-4 text-center">
      <div>
        <Marca className="text-3xl" />
        <h1 className="mt-8 font-display text-[clamp(2rem,6vw,3rem)] leading-none font-extrabold tracking-[-0.035em]">No encontramos ese lugar</h1>
        <p className="mt-4 text-[1.1rem] text-ink-2">Revisa cómo se escribe o búscalo desde el inicio.</p>
        <Link href="/" className="mt-8 inline-flex min-h-11 items-center rounded-full border-2 border-ink bg-obra px-5 font-bold shadow-[0_3px_0_0_var(--ink)]">
          ¿Y dónde vives?
        </Link>
      </div>
    </main>
  );
}
