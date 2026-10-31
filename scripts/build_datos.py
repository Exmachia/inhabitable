"""Cuántos años de salario mínimo cuesta una vivienda, por estado, y cuánto ha subido su precio real desde 2005.

Entradas:
  data/fuentes/shf_precios_2026_s1.csv   precio promedio, cuartiles y mediana de avalúo por estado (SHF, Tabla 2)
  data/fuentes/parametros.json           salario mínimo, tasa hipotecaria, ENOE (con fuente y fecha)
  data/fuentes/estados_base.json         clave, nombre, slug y encuadre de cada estado
  data/raw/shf/Indice_SHF_datos_abiertos_*.xlsx   Índice SHF trimestral 2005–hoy (base 2017 = 100)
  data/raw/banxico/inpc.csv              INPC mensual (INEGI), base 2Q jul 2018
  data/raw/banxico/salario.csv           salario mínimo general por año (CONASAMI)
Salida:
  src/data/vivienda.json
"""

import csv
import glob
import json
import math
import re
import zipfile

AQUI = "data/fuentes/"
P = json.load(open(AQUI + "parametros.json", encoding="utf-8"))
BASE = json.load(open(AQUI + "estados_base.json", encoding="utf-8"))
EV = json.load(open(AQUI + "esperanza_vida.json", encoding="utf-8"))
POR_NOMBRE = {v["nombre"]: k for k, v in BASE.items()}
POR_NOMBRE["México"] = "15"  # la SHF le dice "México" al Estado de México

SM = P["salario"]["general"]
SM_FRONTERA = P["salario"]["frontera"]
TASA = P["credito"]["tasa"] / 100 / 12
PLAZO = P["credito"]["anios"] * 12
ENGANCHE = P["credito"]["enganche"]
AHORRO = 0.30  # escenario realista: ahorrar el 30 % del salario
INFO = P["infonavit"]
INFO_TASA = INFO["tasa"] / 100 / 12
INFO_PLAZO = INFO["anios"] * 12


def media(xs):
    xs = list(xs)
    return math.fsum(xs) / len(xs)


def anual(diario):
    return diario * 365


def mensualidad(precio):
    """Pago fijo mensual de una hipoteca por el 90 % del precio, a la tasa promedio y 20 años."""
    monto = precio * (1 - ENGANCHE)
    return monto * TASA / (1 - (1 + TASA) ** -PLAZO)


def mensualidad_infonavit(monto):
    """Pago fijo mensual del crédito del INFONAVIT para quien gana el mínimo (tasa más baja, 30 años)."""
    return monto * INFO_TASA / (1 - (1 + INFO_TASA) ** -INFO_PLAZO)


# ---------- Índice SHF (xlsx sin dependencias) ----------

def leer_indice():
    ruta = sorted(glob.glob("data/raw/shf/Indice_SHF_datos_abiertos_*.xlsx"))[-1]
    z = zipfile.ZipFile(ruta)
    textos = [re.sub(r"<[^>]+>", "", s) for s in re.findall(r"<si>(.*?)</si>", z.read("xl/sharedStrings.xml").decode(), re.S)]
    hoja = z.read("xl/worksheets/sheet1.xml").decode()
    indice = {}
    for fila in re.findall(r"<row [^>]*>(.*?)</row>", hoja, re.S):
        c = {}
        for col, attrs, v in re.findall(r'<c r="([A-Z]+)\d+"([^>]*)>(?:<f>.*?</f>)?<v>(.*?)</v>', fila):
            c[col] = textos[int(v)] if 't="s"' in attrs else v
        if not c.get("A", "").isdigit():
            continue
        # Columnas: Consecutivo, Global, Estado, Municipio, Trimestre, Año, Índice. Solo una de B/C/D trae valor.
        if c.get("D"):
            continue  # municipios: no se usan por ahora
        nombre = c.get("B") or c.get("C")
        indice[(nombre, int(c["F"]), int(c["E"]))] = float(c["G"])
    return indice


def leer_banxico(ruta):
    serie = {}
    for linea in open(ruta, encoding="latin-1"):
        m = re.match(r"(\d\d)/(\d\d)/(\d{4}),([\d.]+)", linea)
        if m:
            serie[(int(m[3]), int(m[2]))] = float(m[4])
    return serie


indice = leer_indice()
inpc = leer_banxico("data/raw/banxico/inpc.csv")
salarios = {a: v for (a, mes), v in leer_banxico("data/raw/banxico/salario.csv").items() if mes == 1}

# Año del índice SHF (último semestre completo) y año del salario van por separado: el mínimo cambia el 1 de enero
# y el índice del primer semestre sale hasta agosto. Entre enero y agosto se compara el precio del año pasado con el salario nuevo.
ULTIMO = max(a for (_, a, t) in indice if t == 2 and (("Nacional", a, 1) in indice))
ANIO_SM = P["salario"]["anio"]
if ANIO_SM < ULTIMO:
    raise SystemExit(f"parametros.json trae el salario de {ANIO_SM}, pero el índice SHF ya llega a {ULTIMO}: actualiza el salario")
if salarios.get(ANIO_SM) != SM:
    raise SystemExit(f"El salario de parametros.json ({SM}, {ANIO_SM}) no coincide con Banxico ({salarios.get(ANIO_SM)}): corre `npm run data:bajar`")


def semestre(nombre, anio):
    """Índice del primer semestre (enero–junio), igual que el periodo de los precios de la SHF."""
    return media(indice[(nombre, anio, t)] for t in (1, 2))


def inpc_semestre(anio):
    return media(inpc[(anio, m)] for m in range(1, 7))


def historia(nombre, mediana_hoy):
    """Mediana de cada año en pesos de hoy: se mueve con el Índice SHF y se le quita la inflación (INPC)."""
    hoy_i, hoy_p = semestre(nombre, ULTIMO), inpc_semestre(ULTIMO)
    serie = []
    for anio in range(2005, ULTIMO + 1):
        nominal = mediana_hoy * semestre(nombre, anio) / hoy_i
        serie.append({"y": anio, "real": round(nominal * hoy_p / inpc_semestre(anio)), "nominal": round(nominal)})
    return serie


# ---------- Por estado ----------

def ficha(fila, salario):
    mediana, p25, promedio = int(fila["mediana"]), int(fila["p25"]), int(fila["promedio"])
    a = anual(salario)
    return {
        "mediana": mediana,
        "p25": p25,
        "promedio": promedio,
        "anios": round(mediana / a, 1),
        "anios30": round(mediana / a / AHORRO, 1),
        "anios30Barata": round(p25 / a / AHORRO, 1),
        "aniosPromedio30": round(promedio / a / AHORRO, 1),
        "mensualidad": round(mensualidad(mediana)),
        "pctSalario": round(mensualidad(mediana) / (a / 12) * 100),
    }


filas = list(csv.DictReader(open(AQUI + "shf_precios_2026_s1.csv", encoding="utf-8")))
nacional = next(f for f in filas if f["entidad"] == "Nacional")
estados = []
for f in filas:
    if f["entidad"] == "Nacional":
        continue
    cve = POR_NOMBRE[f["entidad"]]
    toda_frontera = cve in P["frontera"]["toda"]
    e = {"cve": cve, "nombre": BASE[cve]["nombre"], "slug": BASE[cve]["slug"], "b": BASE[cve]["b"], "ev": EV["ev"][cve]}
    e.update(ficha(f, SM_FRONTERA if toda_frontera else SM))
    if toda_frontera:
        e["frontera"] = "toda"
    elif cve in P["frontera"]["parte"]:
        e["frontera"] = "parte"
        e["anios30Frontera"] = round(int(f["mediana"]) / anual(SM_FRONTERA) / AHORRO, 1)
    real = semestre(f["entidad"], ULTIMO) / semestre(f["entidad"], 2005) / (inpc_semestre(ULTIMO) / inpc_semestre(2005))
    e["subidaReal"] = round((real - 1) * 100)
    estados.append(e)
estados.sort(key=lambda e: -e["anios30"])

nac = ficha(nacional, SM)
nac["ev"] = EV["ev"]["00"]
real_nac = semestre("Nacional", ULTIMO) / semestre("Nacional", 2005) / (inpc_semestre(ULTIMO) / inpc_semestre(2005))
nac["subidaReal"] = round((real_nac - 1) * 100)

peor = estados[0]
salario_real = [
    {"y": a, "real": round(salarios[a] * inpc_semestre(ULTIMO) / inpc_semestre(a), 2), "nominal": salarios[a]}
    for a in range(2005, ULTIMO + 1)
]

# Años ahorrando el 30 % del mínimo para la casa típica nacional, cada año (precio y salario del mismo año, nominales).
serie_anios = [
    {"y": p["y"], "anios": round(p["nominal"] / anual(salarios[p["y"]]) / AHORRO, 1)}
    for p in historia("Nacional", int(nacional["mediana"]))
]
pago_info = mensualidad_infonavit(INFO["monto"])
if INFO.get("anioSalario", ANIO_SM) != ANIO_SM:
    print(f"OJO: el monto del INFONAVIT es de {INFO['anioSalario']} y el salario de {ANIO_SM}: actualízalos juntos y revisa el H2 de crédito")

salida = {
    "fuentes": {**P, "vida": {"anio": EV["anio"], "fuente": EV["_fuente"]}},
    "anio": ULTIMO,
    "anioSalario": ANIO_SM,
    "inflacion": round((inpc_semestre(ULTIMO) / inpc_semestre(2005) - 1) * 100),
    "ahorro": AHORRO,
    "nacional": nac,
    "estados": estados,
    "pagaMasQueSalario": sum(1 for e in estados if e["pctSalario"] > 100),
    "historia": {
        "nacional": historia("Nacional", int(nacional["mediana"])),
        "peor": {"cve": peor["cve"], "nombre": peor["nombre"],
                 "serie": historia(peor["nombre"], peor["mediana"])},
    },
    "salarioReal": salario_real,
    "serieAnios": serie_anios,
    "infonavit": {
        "mensualidad": round(pago_info),
        "pctSalario": round(pago_info / (anual(SM) / 12) * 100),
        "estadosSinAlcanzarBarata": sum(1 for e in estados if e["p25"] > INFO["monto"] + INFO["subcuenta"]),
    },
}
json.dump(salida, open("src/data/vivienda.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"{len(estados)} estados · nacional {nac['anios']} años ({nac['anios30']} ahorrando 30 %) · "
      f"peor {peor['nombre']} {peor['anios30']} · casas +{nac['subidaReal']} % real desde 2005 · "
      f"{salida['pagaMasQueSalario']} estados con mensualidad > salario")
