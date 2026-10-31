"""Baja del SNIIV (SEDATU) los créditos para comprar vivienda por municipio, mes y rango de precio.

API pública: https://sniiv.sedatu.gob.mx/api/CuboAPI/GetFinanciamiento/{años}/{estado}/{municipio}/{dimensiones}
Una consulta por estado (la API permite hasta 5 dimensiones). Salida: data/raw/sniiv/fin_{cve}.json
"""

import json
import os
import sys
import time
import urllib.request

ANIOS = sys.argv[1] if len(sys.argv) > 1 else "2025,2026"
DIM = "anio,mes,municipio,modalidad,valor_vivienda"
DESTINO = "data/raw/sniiv"
os.makedirs(DESTINO, exist_ok=True)

fallas = []
for n in range(1, 33):
    cve = f"{n:02d}"
    url = f"https://sniiv.sedatu.gob.mx/api/CuboAPI/GetFinanciamiento/{ANIOS}/{cve}/000/{DIM}"
    for intento in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            datos = json.load(urllib.request.urlopen(req, timeout=180))
            if not isinstance(datos, list) or not datos or "valor_vivienda" not in datos[0]:
                raise ValueError("respuesta inesperada")
            json.dump(datos, open(f"{DESTINO}/fin_{cve}.json", "w", encoding="utf-8"), ensure_ascii=False)
            print(cve, len(datos), "filas")
            break
        except Exception as e:  # noqa: BLE001
            print(cve, "intento", intento + 1, e)
            time.sleep(5)
    else:
        fallas.append(cve)

if fallas:
    raise SystemExit(f"Fallaron: {fallas}")
