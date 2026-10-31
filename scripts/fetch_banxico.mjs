// Baja series del SIE de Banxico en CSV a través de Chrome (el sitio no acepta scripts sueltos).
// Uso: node scripts/fetch_banxico.mjs <archivo> <serie> [<serie>...]
//   SP1     INPC general (INEGI), mensual, base 2Q jul 2018
//   SL11298 salario mínimo general, pesos por día
import { chromium } from "playwright-core";
import { writeFile, mkdir } from "node:fs/promises";

const [archivo, ...series] = process.argv.slice(2);
await mkdir("data/raw/banxico", { recursive: true });
const navegador = await chromium.launch({ channel: "chrome", headless: false, args: ["--window-position=-2000,0"] });
const pagina = await navegador.newPage();
await pagina.goto("https://www.banxico.org.mx/SieInternet/consultarDirectorioInternetAction.do?sector=8&accion=consultarCuadro&idCuadro=CP154&locale=es", { waitUntil: "domcontentloaded" });
await pagina.waitForTimeout(5000);
const form = new URLSearchParams({ idCuadro: "CP154", sector: "8", version: "3", locale: "es", anoInicial: "2005", anoFinal: "2026", tipoInformacion: "2,1", "formatoCSV.x": "10", "formatoCSV.y": "10" });
for (const s of series) form.append("series", s);
const r = await pagina.request.post("https://www.banxico.org.mx/SieInternet/consultarDirectorioInternetAction.do?accion=consultarSeries", {
  headers: { "content-type": "application/x-www-form-urlencoded" },
  data: form.toString(),
});
const texto = new TextDecoder("latin1").decode(await r.body());
if (!r.ok() || series.some((s) => !texto.includes(s))) throw new Error(`${r.status()} ${texto.slice(0, 300)}`);
await writeFile(`data/raw/banxico/${archivo}`, texto);
console.log("ok", archivo, texto.length);
await navegador.close();
