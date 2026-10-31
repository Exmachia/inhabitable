import { ImageResponse } from "next/og";
import { lugarDeRuta } from "@/lib/municipios";
import { CACHE, HISTORIA, TarjetaHistoria, fuentes } from "@/og/tarjeta";

/** Imagen vertical para historias (1080×1920): /historia, /historia/jalisco, /historia/jalisco/guadalajara. */
export async function GET(_: Request, { params }: RouteContext<"/historia/[[...lugar]]">) {
  const [estado, municipio, ...resto] = (await params).lugar ?? [];
  const l = resto.length ? null : lugarDeRuta(estado, municipio);
  if (!l) return new Response("No encontramos ese lugar", { status: 404 });
  return new ImageResponse(<TarjetaHistoria l={l} />, {
    ...HISTORIA,
    fonts: await fuentes(),
    headers: CACHE,
  });
}
