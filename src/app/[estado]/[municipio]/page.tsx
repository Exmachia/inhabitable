import { notFound } from "next/navigation";
import { Suspense } from "react";
import Pagina from "@/components/Pagina";
import Espera from "@/components/Espera";
import { POR_CVE, slugMunicipio } from "@/lib/datos";
import { metadatosDe } from "@/lib/metadatos";
import { MUNICIPIOS_CON_DATO, lugarDeRuta } from "@/lib/municipios";

/** Al compilar: los municipios con estimación propia. Los demás (sin créditos suficientes) se generan la primera vez que alguien entra. */
export function generateStaticParams() {
  return MUNICIPIOS_CON_DATO.map((m) => ({ estado: POR_CVE.get(m.ent)!.slug, municipio: slugMunicipio(m) }));
}

export async function generateMetadata({ params }: PageProps<"/[estado]/[municipio]">) {
  const { estado, municipio } = await params;
  const l = lugarDeRuta(estado, municipio);
  return l ? metadatosDe(l) : { title: "No encontramos ese lugar · Inavitable", robots: { index: false } };
}

/** /jalisco/guadalajara: la misma página, con el municipio ya elegido. */
export default function PaginaMunicipio({ params }: PageProps<"/[estado]/[municipio]">) {
  return (
    <Suspense fallback={<Espera />}>
      <ConLugar params={params} />
    </Suspense>
  );
}

async function ConLugar({ params }: Pick<PageProps<"/[estado]/[municipio]">, "params">) {
  const { estado, municipio } = await params;
  const l = lugarDeRuta(estado, municipio);
  if (!l) notFound();
  return <Pagina inicial={l} />;
}
