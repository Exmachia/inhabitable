import { notFound } from "next/navigation";
import { Suspense } from "react";
import Pagina from "@/components/Pagina";
import Espera from "@/components/Espera";
import { ESTADOS } from "@/lib/datos";
import { metadatosDe } from "@/lib/metadatos";
import { lugarDeRuta } from "@/lib/municipios";

export function generateStaticParams() {
  return ESTADOS.map((e) => ({ estado: e.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[estado]">) {
  const { estado } = await params;
  const l = lugarDeRuta(estado);
  return l ? metadatosDe(l) : { title: "No encontramos ese lugar · Inavitable", robots: { index: false } };
}

/** /jalisco: la misma página, con el estado ya elegido (el H1 llega del servidor con su cifra). */
export default function PaginaEstado({ params }: PageProps<"/[estado]">) {
  return (
    <Suspense fallback={<Espera />}>
      <ConLugar params={params} />
    </Suspense>
  );
}

async function ConLugar({ params }: Pick<PageProps<"/[estado]">, "params">) {
  const { estado } = await params;
  const l = lugarDeRuta(estado);
  if (!l) notFound();
  return <Pagina inicial={l} />;
}
