// Abre las páginas de la SHF en Chrome (gob.mx bloquea curl) y baja los archivos adjuntos del Índice SHF.
import { chromium } from "playwright-core";
import { writeFile, mkdir } from "node:fs/promises";

const destino = "data/raw/shf";
await mkdir(destino, { recursive: true });
const navegador = await chromium.launch({ channel: "chrome", headless: false, args: ["--window-position=-2000,0"] });
const pagina = await navegador.newPage();
const url = process.argv[2] ?? "https://www.gob.mx/shf/prensa/indice-shf-de-precios-de-la-vivienda-en-mexico-segundo-trimestre-de-2026-432219";
await pagina.goto(url, { waitUntil: "domcontentloaded" });
await pagina.waitForTimeout(8000);
const enlaces = await pagina.$$eval("a", (as) => as.map((a) => [a.textContent.trim().slice(0, 80), a.href]));
for (const [t, h] of enlaces) if (/\.(pdf|xlsx?|csv|zip)|documentos|archivo|shf/i.test(h)) console.log(t, "|", h);
await writeFile(`${destino}/pagina.html`, await pagina.content());
console.log((await pagina.innerText("body")).slice(0, 3000));
await navegador.close();
