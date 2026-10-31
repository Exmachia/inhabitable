import datos from "@/data/vivienda.json";
import resumenMun from "@/data/municipios_resumen.json";

export type Estado = (typeof datos.estados)[number] & { frontera?: "toda" | "parte"; anios30Frontera?: number };
/** Municipio tal como viene en /data/municipios.json (claves cortas para que pese poco). */
export type MunicipioCrudo = {
  g: string; n: string; ent: string; b: number[]; c: number;
  p?: number; a?: number; f?: 1; t?: 1;
};

export const D = datos;
export const MUN = resumenMun;
export const ESTADOS = datos.estados as Estado[];
export const NAC = datos.nacional;
export const PEOR = ESTADOS[0];
export const AHORRO = datos.ahorro;
export const AHORRO_PCT = Math.round(AHORRO * 100);
export const SM = datos.fuentes.salario.general;
export const SM_FRONTERA = datos.fuentes.salario.frontera;
export const POR_CVE = new Map(ESTADOS.map((e) => [e.cve, e]));
export const POR_SLUG = new Map(ESTADOS.map((e) => [e.slug, e]));

/** Edad a la que se empieza a trabajar y a ahorrar en los ejemplos. */
export const EDAD_INICIO = 18;
/** Esperanza de vida al nacer en México (CONAPO). */
export const EV_MX = NAC.ev;
/** Una vida laboral: de los 18 a los 65 años (edad de pensión por vejez en el IMSS). */
export const VIDA_LABORAL = 65 - 18;

/* ---------- Formatos ---------- */

const nf = (dec: number) => new Intl.NumberFormat("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec });
export const fmt = (n: number, dec = 0) => nf(dec).format(n);
export const pesos = (n: number) => `$${fmt(n)}`;
export const millones = (n: number) => `$${fmt(n / 1e6, 1)} millones`;
/** "$2.4 millones", "$600 mil". */
export const dinero = (n: number) => (n >= 999_500 ? `$${fmt(n / 1e6, 1)} millones` : `$${fmt(Math.round(n / 1e3))} mil`);
export const anios = (n: number) => fmt(Math.round(n));
/** Tope de la estimación municipal: arriba de esto solo se sabe que son "más de". */
export const TOPE_ANIOS = 150;
/** "96" o, si la estimación tocó el tope, "150+". */
export const aniosTxt = (n: number, tope?: boolean) => (tope ? `${TOPE_ANIOS}+` : anios(n));
/** "menos de 1 año", "1 año", "87 años": con sueldos altos la cuenta llega a cero y no debe leerse como error. */
export const conAnios = (n: number) => (Math.round(n) < 1 ? "menos de 1 año" : Math.round(n) === 1 ? "1 año" : `${anios(n)} años`);

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const fechaCorta = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]} ${y}`;
};
/** "2025-08" → "agosto 2025" */
export const mesAnio = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${MESES_LARGOS[m - 1]} ${y}`;
};

/** "la Ciudad de México", "el Estado de México", "Jalisco": para frases como "En … se vive". */
export const conArticulo = (nombre: string) =>
  nombre === "Ciudad de México" ? "la Ciudad de México" : nombre === "Estado de México" ? "el Estado de México" : nombre;

/** "de la CDMX", "del Estado de México", "de Jalisco": para frases como "Una casa barata …". */
export const deLugar = (nombre: string) =>
  nombre === "Ciudad de México" ? "de la CDMX" : nombre === "Estado de México" ? "del Estado de México" : `de ${nombre}`;

/* ---------- Escala de color (años ahorrando el 30 %) ---------- */

export const RANGOS = [
  { hasta: 30, color: "var(--a-1)", hex: "#ecd9b4", label: "menos de 30" },
  { hasta: 40, color: "var(--a-2)", hex: "#e19a5e", label: "30 a 40" },
  { hasta: 60, color: "var(--a-3)", hex: "#c2502b", label: "40 a 60" },
  { hasta: Infinity, color: "var(--a-4)", hex: "#7a2614", label: "60 o más" },
] as const;
export const rango = (a: number) => RANGOS.find((r) => a < r.hasta)!;
export const SIN_DATO = "#d9d3c7";

/* ---------- Cálculos ---------- */

/** Crédito del INFONAVIT para quien gana el mínimo (monto y tasa citados por prensa: ver parametros.json). */
export const INFO = datos.fuentes.infonavit;
const TASA_INFO = INFO.tasa / 100 / 12;
const PLAZO_INFO = INFO.anios * 12;
/** "~$600 mil": el monto es una cifra de simulador citada por prensa, se redondea. */
export const INFO_TXT = () => `~${dinero(Math.round(INFO.monto / 1e5) * 1e5)}`;
/** Lo que de verdad tienes para comprar con el INFONAVIT: el crédito más tu ahorro de la subcuenta de vivienda. */
export const PODER_INFO = INFO.monto + INFO.subcuenta;
export const PODER_TXT = () => `~${dinero(Math.round(PODER_INFO / 1e4) * 1e4)}`;
export const PAGO_INFO = (INFO.monto * TASA_INFO) / (1 - (1 + TASA_INFO) ** -PLAZO_INFO);
/** Vara oficial: la CONAVI considera alcanzable pagar la casa con el 30 % del ingreso en 20 años. */
export const ALCANZABLE = datos.fuentes.conavi.anios;
export const salarioMensual = (diario: number) => (diario * 365) / 12;
export const diarioDeMensual = (mensual: number) => (mensual * 12) / 365;

/* ---------- Lugar: país, estado o municipio con la misma forma ---------- */

export type Lugar = {
  tipo: "pais" | "estado" | "municipio";
  id: string;
  nombre: string;
  /** Para municipios: "Jalisco". */
  en?: string;
  precio: number;
  salario: number;
  /** El precio es una estimación conservadora (municipios, con créditos del SNIIV). */
  estimado?: boolean;
  /** La estimación tocó el tope del rango más caro: el precio real es mayor. */
  tope?: boolean;
  /** Municipio sin créditos suficientes: se muestra el dato de su estado. */
  prestado?: { g: string; municipio: string; creditos: number; slug: string };
  /** Para municipios: su parte de la dirección (/jalisco/guadalajara). */
  slugMun?: string;
  estado?: Estado;
  creditos?: number;
  /** Esperanza de vida al nacer donde está el lugar (la del estado; en municipios, la de su estado). */
  ev: number;
};

export const PAIS: Lugar = { tipo: "pais", id: "mx", nombre: "Todo México", precio: NAC.mediana, salario: SM, ev: NAC.ev };

export function lugarEstado(e: Estado): Lugar {
  return { tipo: "estado", id: e.cve, nombre: e.nombre, precio: e.mediana, salario: e.frontera === "toda" ? SM_FRONTERA : SM, estado: e, ev: e.ev };
}

export function lugarMunicipio(m: MunicipioCrudo): Lugar {
  const e = POR_CVE.get(m.ent)!;
  if (m.p == null) {
    return { ...lugarEstado(e), prestado: { g: m.g, municipio: m.n, creditos: m.c, slug: slugMunicipio(m) } };
  }
  return {
    tipo: "municipio", id: m.g, nombre: m.n, en: e.nombre, precio: m.p, salario: m.f ? SM_FRONTERA : SM,
    estimado: true, tope: !!m.t, estado: e, creditos: m.c, ev: e.ev, slugMun: slugMunicipio(m),
  };
}

/**
 * Todo lo que la interfaz muestra de un lugar. `diario` reemplaza al salario mínimo cuando la persona escribe lo que le
 * llega: ese monto vive solo en el navegador (nunca en la URL, tarjetas, almacenamiento ni analytics).
 */
export function cuentas(l: Lugar, diario = l.salario) {
  const anual = diario * 365;
  const completo = l.precio / anual;
  const ahorrando = completo / AHORRO;
  const sueldo = salarioMensual(diario);
  const terminas = EDAD_INICIO + Math.round(ahorrando);
  return {
    completo,
    ahorrando,
    terminas,
    /** Años de vida que quedarían después de juntar (negativo: no alcanza la vida). */
    quedan: Math.round(l.ev - terminas),
    sueldo,
    /** Lo que falta después del crédito más alto del INFONAVIT para quien gana el mínimo. */
    faltaInfo: Math.max(l.precio - PODER_INFO, 0),
    pctInfo: (PAGO_INFO / sueldo) * 100,
  };
}

/**
 * Municipios de 20 años o menos: no se comparan con el plazo oficial, porque la barra corta diría "aquí sí se puede".
 * Se comparan en pesos y la barra larga siempre es la del problema: la estimación baja contra la casa barata del estado,
 * o el precio firme contra el crédito más el ahorro del INFONAVIT. Lo usan la tarjeta y el texto para compartir.
 */
export function bajoPlazo(l: Lugar) {
  const c = cuentas(l);
  const e = l.estado;
  if (l.tope || !e || l.tipo !== "municipio" || Math.round(c.ahorrando) > ALCANZABLE) return null;
  if (l.precio < e.p25) {
    const barata = `La casa barata ${deLugar(e.nombre)} cuesta ${dinero(e.p25)}.`;
    return {
      corta: { etiqueta: "Lo que estimamos aquí", valor: l.precio, txt: dinero(l.precio) },
      larga: { etiqueta: `Una casa barata ${deLugar(e.nombre)}`, valor: e.p25, txt: dinero(e.p25) },
      remate: `Estimación baja: ${barata[0].toLowerCase()}${barata.slice(1)}`,
      compartir: `, según una estimación baja. ${barata}`,
      fuentes: "SNIIV, SHF, CONASAMI",
    };
  }
  const falta = `aunque sumes el crédito y tu ahorro del INFONAVIT, te faltan ${dinero(c.faltaInfo)}.`;
  return {
    corta: { etiqueta: "Crédito + tu ahorro del INFONAVIT", valor: PODER_INFO, txt: PODER_TXT() },
    larga: { etiqueta: "La casa típica aquí", valor: l.precio, txt: dinero(l.precio) },
    remate: `A${falta.slice(1)}`,
    compartir: `. Y ${falta}`,
    fuentes: "INFONAVIT según prensa · SNIIV, CONASAMI",
  };
}

/* ---------- Direcciones: /jalisco y /jalisco/guadalajara ---------- */

/** Igual que slug() en scripts/build_municipios.py. */
export const slug = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const REPETIDOS = new Set(resumenMun.slugsRepetidos);
/** Slug de un municipio dentro de su estado (si el nombre se repite en el estado, lleva su clave al final). */
export function slugMunicipio(m: { g: string; n: string; ent: string }) {
  const s = slug(m.n);
  return REPETIDOS.has(`${m.ent}/${s}`) ? `${s}-${m.g.slice(2)}` : s;
}

/** Dirección de un lugar ("/" para todo México). */
export function rutaDe(l: Lugar | null) {
  if (!l || l.tipo === "pais") return "/";
  const e = `/${l.estado!.slug}`;
  if (l.tipo === "municipio") return `${e}/${l.slugMun}`;
  if (l.prestado) return `${e}/${l.prestado.slug}`;
  return e;
}

/**
 * "Guadalajara, Jalisco", "Jalisco", "Todo México". Un municipio sin dato propio lleva el nombre de su estado: la cifra es
 * la del estado y no se le puede poner al municipio.
 */
export const nombreCompleto = (l: Lugar) => (l.tipo === "municipio" ? `${l.nombre}, ${l.en}` : l.nombre);
/** Para compartir un municipio sin dato propio se comparte su estado (dirección, texto y tarjeta). */
export const sinPrestado = (l: Lugar): Lugar => (l.prestado ? { ...l, prestado: undefined } : l);

/* ---------- Portada: lo caro y lo barato del mismo estado ---------- */

/**
 * Los municipios más caros (estimación SNIIV), uno por estado, junto a la casa barata de su estado: la cuarta parte más
 * barata de las que se venden con crédito (cuartil SHF). No se usa el municipio más barato: su estimación es floja.
 */
export const CAROS = (() => {
  const vistos = new Set<string>();
  return resumenMun.peores
    .filter((m) => !vistos.has(m.ent) && vistos.add(m.ent))
    .slice(0, 3)
    .map((m) => ({ ...m, estado: POR_CVE.get(m.ent)! }));
})();
/** Estado donde menos años toma (con el mínimo, ahorrando el 30 %). */
export const MAS_BARATO = ESTADOS.at(-1)!;

/** Titular de un lugar: "En Guadalajara, juntar para una casa con el salario mínimo toma 87 años". */
export function titularDe(l: Lugar) {
  const donde = l.tipo === "pais" ? "todo México" : l.nombre;
  const a = l.tope ? `más de ${TOPE_ANIOS}` : aniosTxt(cuentas(l).ahorrando);
  return `En ${donde}, juntar para una casa con el salario mínimo toma ${a} años`;
}
export const TITULAR_CAROS = `En ${MUN.mas100} municipios, juntar para una casa con el salario mínimo toma más de 100 años`;


export const DATO_PRECIOS = `Precios de ${datos.fuentes.precios.periodo} · SHF, publicado el ${fechaCorta(datos.fuentes.precios.publicado)}`;
export const DATO_MUN = `Créditos de ${mesAnio(resumenMun.desde)} a ${mesAnio(resumenMun.hasta)} · SNIIV (SEDATU)`;
