import type { Metadata } from "next";
import MapaCompleto from "@/components/mapa/MapaCompleto";

export const metadata: Metadata = {
  title: "El mapa · Inhabitable",
  description: "Cuántos años de salario mínimo cuesta una casa en cada estado y municipio de México. Toca tu estado y elige tu municipio.",
  alternates: { canonical: "/mapa" },
};

/** El mapa a pantalla completa (la selección vive en ?e=estado&m=municipio y se lee en el navegador). */
export default function PaginaMapa() {
  return <MapaCompleto />;
}
