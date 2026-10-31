"""Precio típico estimado de la vivienda por municipio, con los créditos para comprar casa del SNIIV.

El SNIIV no da el precio de cada casa, sino cuántos créditos hubo en cada rango de precio (económica, popular,
tradicional, media, residencial, residencial plus; límites en UMA mensuales). Con esa distribución se estima la
mediana por interpolación dentro del rango donde cae la mitad de los créditos (mediana agrupada).

Validación: el mismo cálculo por estado da entre 0.5 y 1.04 veces la mediana oficial de la SHF (casi siempre por debajo),
así que la estimación es conservadora: los años que salen son "al menos".

Entradas: data/raw/sniiv/fin_XX.json (scripts/fetch_sniiv.py), src/data/vivienda.json (salario, estados),
          data/fuentes/municipios_base.json (nombres y encuadres), data/fuentes/frontera_norte.json
Salida:   public/data/municipios.json, src/data/municipios_resumen.json
"""

import json
import math
import re
import unicodedata
from collections import Counter, defaultdict

MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
# Rangos de precio del SNIIV, en UMA mensuales. El último no tiene tope: se usa su límite inferior (conservador).
RANGOS = [("Económica", 0, 118), ("Popular", 118, 200), ("Tradicional", 200, 350), ("Media", 350, 750),
          ("Residencial", 750, 1500), ("Residencial plus", 1500, 1500)]
# UMA mensual: cambia cada febrero (DOF). Enero usa la del año anterior.
UMA = {2024: 3300.53, 2025: 3439.46, 2026: 3566.22}
MINIMO = 50  # con menos créditos en 12 meses no se publica estimación

V = json.load(open("src/data/vivienda.json", encoding="utf-8"))
SM = V["fuentes"]["salario"]["general"]
SM_FRONTERA = V["fuentes"]["salario"]["frontera"]
AHORRO = V["ahorro"]
BASE = json.load(open("data/fuentes/municipios_base.json", encoding="utf-8"))
FRONTERA = set(json.load(open("data/fuentes/frontera_norte.json", encoding="utf-8"))["municipios"])


def uma(anio, mes):
    return UMA[anio - 1] if mes == 1 else UMA[anio]


# ---------- ventana: los 12 meses más recientes con datos ----------
filas = []
for n in range(1, 33):
    cve = f"{n:02d}"
    for x in json.load(open(f"data/raw/sniiv/fin_{cve}.json", encoding="utf-8")):
        if x["modalidad"] not in ("Viviendas nuevas", "Viviendas existentes"):
            continue
        if x["valor_vivienda"] not in {r[0] for r in RANGOS} or not x["acciones"]:
            continue
        anio = x.get("anio") or x.get("año")
        filas.append((cve + x["clave_municipio"], anio, MESES.index(x["mes"]) + 1, x["valor_vivienda"], x["acciones"]))

por_mes = Counter()
for _, a, m, _, k in filas:
    por_mes[(a, m)] += k
meses = sorted(por_mes)
ultimo = meses[-1]
# Un mes con muy pocos créditos frente a los demás está incompleto: se descarta.
tipico = sorted(por_mes.values())[len(por_mes) // 2]
while por_mes[ultimo] < 0.6 * tipico:
    meses.pop()
    ultimo = meses[-1]
ventana = set(meses[-12:])
desde, hasta = min(ventana), max(ventana)


# ---------- mediana agrupada por municipio, en pesos ----------
# Cada crédito se pasa a pesos con la UMA de su mes: se acumula la distribución en "pesos de límite" por rango.
dist = defaultdict(lambda: defaultdict(float))  # mun -> rango -> créditos
umas = defaultdict(list)  # mun -> [(uma, créditos)] para la UMA promedio ponderada
for mun, a, m, rango, k in filas:
    if (a, m) not in ventana:
        continue
    dist[mun][rango] += k
    umas[mun].append((uma(a, m), k))


def mediana(d, u):
    total = math.fsum(d.values())
    acum = 0.0
    for nombre, a, b in RANGOS:
        k = d.get(nombre, 0.0)
        if k and acum + k >= total / 2:
            # En el rango sin tope la mitad cae "de ahí para arriba": se marca para decir "más de".
            return (a + (total / 2 - acum) / k * (b - a)) * u, a == b
        acum += k
    return None, False


municipios = []
sin_datos = 0
for cvegeo, info in sorted(BASE.items()):
    d = dist.get(cvegeo)
    creditos = int(math.fsum(d.values())) if d else 0
    m = {"g": cvegeo, "n": info["n"], "ent": cvegeo[:2], "b": info["b"], "c": creditos}
    if cvegeo[:2] == "02" or cvegeo in FRONTERA:
        m["f"] = 1
    if creditos >= MINIMO:
        u = math.fsum(x * k for x, k in umas[cvegeo]) / math.fsum(k for _, k in umas[cvegeo])
        precio, tope = mediana(d, u)
        if tope:
            m["t"] = 1
        salario = SM_FRONTERA if m.get("f") else SM
        m["p"] = round(precio, -3)
        m["a"] = round(precio / (salario * 365) / AHORRO, 1)
    else:
        sin_datos += 1
    municipios.append(m)

desconocidos = set(dist) - set(BASE)
json.dump(municipios, open("public/data/municipios.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

def slug(nombre):
    """Igual que slug() en src/lib/datos.ts: sin acentos, minúsculas y guiones."""
    s = "".join(c for c in unicodedata.normalize("NFD", nombre) if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


# Nombres repetidos dentro de un estado: su dirección lleva la clave del municipio al final.
repetidos = sorted(k for k, v in Counter(f"{m['ent']}/{slug(m['n'])}" for m in municipios).items() if v > 1)

con = [m for m in municipios if "a" in m]
peores = sorted(con, key=lambda m: -m["a"])[:5]
resumen = {
    "desde": f"{desde[0]}-{desde[1]:02d}",
    "hasta": f"{hasta[0]}-{hasta[1]:02d}",
    "conDatos": len(con),
    "total": len(municipios),
    "minimo": MINIMO,
    "mas100": sum(1 for m in con if m["a"] >= 100),
    "mas60": sum(1 for m in con if m["a"] >= 60),
    "peores": [{"g": m["g"], "n": m["n"], "ent": m["ent"], "a": m["a"]} for m in peores],
    "slugsRepetidos": repetidos,
}
json.dump(resumen, open("src/data/municipios_resumen.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{len(con)} municipios con estimación, {sin_datos} sin datos suficientes · ventana {resumen['desde']} a {resumen['hasta']}")
print("claves del SNIIV sin municipio en el catálogo:", sorted(desconocidos)[:10], len(desconocidos))
for m in peores:
    print(" ", m["n"], m["ent"], m["a"], m["p"], m["c"])
