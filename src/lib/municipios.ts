/**
 * Solo para el servidor: resuelve una dirección (/jalisco/guadalajara) a su lugar. El navegador pide la misma lista bajo
 * demanda (/data/municipios.json); aquí se importa para que el H1, las metas y las tarjetas lleguen ya con el lugar.
 */
import lista from "../../public/data/municipios.json";
import { PAIS, POR_SLUG, lugarEstado, lugarMunicipio, slugMunicipio, type Lugar, type MunicipioCrudo } from "./datos";

const MUNICIPIOS = lista as MunicipioCrudo[];
const POR_RUTA = new Map(MUNICIPIOS.map((m) => [`${m.ent}/${slugMunicipio(m)}`, m]));

/** Lugar de una dirección, o null si no existe. */
export function lugarDeRuta(estado?: string, municipio?: string): Lugar | null {
  if (!estado) return PAIS;
  const e = POR_SLUG.get(decodeURIComponent(estado));
  if (!e) return null;
  if (!municipio) return lugarEstado(e);
  const m = POR_RUTA.get(`${e.cve}/${decodeURIComponent(municipio)}`);
  return m ? lugarMunicipio(m) : null;
}

/** Municipios con estimación propia: se generan al compilar. Los demás se generan la primera vez que alguien entra. */
export const MUNICIPIOS_CON_DATO = MUNICIPIOS.filter((m) => m.a != null);
