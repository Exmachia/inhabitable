// Baja archivos de gob.mx a través de Chrome (pasa el reto anti-bots) y los guarda en data/raw/.
// Uso: node scripts/bajar_gobmx.mjs <carpeta> <url> [<url>...]
import { chromium } from "playwright-core";
import { writeFile, mkdir } from "node:fs/promises";
import { basename } from "node:path";

const [carpeta, ...urls] = process.argv.slice(2);
const destino = `data/raw/${carpeta}`;
await mkdir(destino, { recursive: true });
const navegador = await chromium.launch({ channel: "chrome", headless: false, args: ["--window-position=-2000,0"] });
const contexto = await navegador.newContext();
const pagina = await contexto.newPage();
await pagina.goto("https://www.gob.mx/shf", { waitUntil: "domcontentloaded" });
await pagina.waitForTimeout(8000);
for (const url of urls) {
  const r = await contexto.request.get(url);
  const cuerpo = await r.body();
  const tipo = r.headers()["content-type"] ?? "";
  if (!r.ok() || tipo.includes("text/html")) throw new Error(`${url}: ${r.status()} ${tipo}`);
  await writeFile(`${destino}/${basename(new URL(url).pathname)}`, cuerpo);
  console.log("ok", basename(url), cuerpo.length, tipo);
}
await navegador.close();
