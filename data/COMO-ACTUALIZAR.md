# Cómo actualizar los datos

`npm run data` rehace `src/data/*.json` desde `data/fuentes/` y `data/raw/`. `npm run data:bajar` baja de Banxico el salario mínimo y el INPC (abre Chrome).

## Cada 1 de enero: salario mínimo nuevo (antes de diciembre, dejarlo listo)

El índice SHF del primer semestre sale hasta agosto. Entre enero y agosto el sitio compara **el precio del año pasado con el salario nuevo**: el script ya lo permite porque el año del salario (`salario.anio`) va aparte del año del índice.

1. En `data/fuentes/parametros.json`, cambiar `salario.anio`, `salario.general` y `salario.frontera` con la resolución de la CONASAMI (DOF de diciembre).
2. `npm run data:bajar` para que Banxico traiga el mínimo nuevo (el script se detiene si no coincide).
3. Actualizar a la vez el monto del INFONAVIT (`infonavit.monto`, `infonavit.anioSalario`): el crédito sube con el salario. Si solo se cambia uno, el script avisa.
4. `npm run data` y revisar el H2 de crédito: con el salario 2027, Durango y Tlaxcala pueden pasar a "sí alcanza" (el margen hoy es de ~5 %).
5. Revisar el titular de los municipios: con el salario nuevo bajan los "más de 100 años".

## Cada agosto: índice SHF nuevo

`node scripts/fetch_shf.mjs <url del boletín>`, cambiar `precios` en `parametros.json` y el CSV de la Tabla 2 (`shf_precios_<año>_s1.csv`, y su nombre en `scripts/build_datos.py`), y `npm run data`.

## Subcuenta de vivienda (`infonavit.subcuenta`)

El INFONAVIT suma al crédito el saldo de la subcuenta ("capacidad de compra"). No hay cifra oficial para quien gana el mínimo, así que es **cálculo propio**: el 5 % del salario mínimo de cada año que pone el patrón, 15 años seguidos sin huecos (2012–2026), con 7 % de rendimiento anual (promedio 2000–2025 citado por prensa; en 2025 fue 5 %). Da unos $50–57 mil; con 10 años, unos $40–43 mil. Se usa el techo (57,000) para quedar del lado generoso: si la frase de crédito aguanta con eso, aguanta con menos. Rehacer la cuenta cada enero con el mínimo nuevo.
