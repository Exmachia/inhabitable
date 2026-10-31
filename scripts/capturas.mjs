// Capturas de verificación (escritorio y celular). Uso: node scripts/capturas.mjs [ruta] [carpeta]
import { chromium } from "playwright-core";
const ruta = process.argv[2] ?? "/";
const out = process.argv[3] ?? "/tmp";
const b = await chromium.launch({ channel: "chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const [nombre, w, h] of [["escritorio", 1366, 900], ["celular", 390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const errores = [];
  p.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  p.on("pageerror", (e) => errores.push(String(e)));
  await p.goto(`http://localhost:3200${ruta}`, { waitUntil: "networkidle" });
  // Forzar que aparezcan las secciones animadas y esperar al mapa.
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 250)); } window.scrollTo(0, 0); });
  await p.waitForTimeout(2500);
  const scrollX = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await p.screenshot({ path: `${out}/${nombre}.png`, fullPage: true });
  console.log(nombre, "scroll horizontal:", scrollX, "errores:", errores.slice(0, 5));
  await p.close();
}
await b.close();
