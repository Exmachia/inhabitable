import { NextResponse, type NextRequest } from "next/server";
import { slug } from "@/lib/datos";
import { lugarDeRuta } from "@/lib/municipios";

/**
 * Revisa /estado y /estado/municipio antes de que la página empiece a mandarse: ya en streaming, notFound() responde 200.
 * Si la dirección solo cambia en mayúsculas o acentos (/JALISCO, /yucatán/mérida), redirige a la buena; si no existe,
 * la manda a una ruta que no existe para que Next responda 404 con la página de "No encontramos ese lugar".
 */
export function proxy(req: NextRequest) {
  const partes = req.nextUrl.pathname.split("/").filter(Boolean);
  if (!partes.length || partes.length > 2 || partes.at(-1)!.startsWith("opengraph-image")) return;
  const existe = (p: string[]) => {
    try {
      return p.length > 0 && lugarDeRuta(p[0], p[1]) !== null;
    } catch {
      return false; // %mal escrito
    }
  };
  if (existe(partes)) return;
  let limpias: string[] = [];
  try {
    limpias = partes.map((p) => slug(decodeURIComponent(p)));
  } catch {}
  if (existe(limpias)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${limpias.join("/")}`;
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.rewrite(new URL("/no-existe/no-existe/no-existe", req.url));
}

export const config = {
  // Solo direcciones de lugar: fuera los archivos (con punto), lo interno de Next, las historias y los datos.
  matcher: ["/((?!_next|historia|data|maplibre|.*\\.).*)"],
};
