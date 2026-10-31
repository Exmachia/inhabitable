import { ImageResponse } from "next/og";
import { PAIS } from "@/lib/datos";
import { CACHE, OG, TarjetaOG, fuentes } from "@/og/tarjeta";

export const alt = "Años de salario mínimo para juntar una casa en México, contra los 20 que el gobierno llama alcanzables";
export const size = OG;
export const contentType = "image/png";

export default async function Imagen() {
  return new ImageResponse(<TarjetaOG l={PAIS} />, { ...OG, fonts: await fuentes(), headers: CACHE });
}
