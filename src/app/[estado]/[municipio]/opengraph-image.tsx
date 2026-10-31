import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { lugarDeRuta } from "@/lib/municipios";
import { CACHE, OG, TarjetaOG, fuentes } from "@/og/tarjeta";

export const alt = "Años de salario mínimo para juntar una casa en este municipio";
export const size = OG;
export const contentType = "image/png";

export default async function Imagen({ params }: { params: Promise<{ estado: string; municipio: string }> }) {
  const { estado, municipio } = await params;
  const l = lugarDeRuta(estado, municipio);
  if (!l) notFound();
  return new ImageResponse(<TarjetaOG l={l} />, { ...OG, fonts: await fuentes(), headers: CACHE });
}
