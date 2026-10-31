import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";
import Script from "next/script";
import { SITIO, TITULO } from "@/lib/sitio";
import { NAC, PEOR, anios } from "@/lib/datos";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

// Titulares y cifras: grotesca con carácter (tamaño óptico), lejos del tono de periódico.
const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  axes: ["opsz"],
  subsets: ["latin"],
  display: "swap",
});

// Texto e interfaz: sans clara y neutra, muy legible en celular.
const sans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: "swap",
});

const UMAMI = process.env.NEXT_PUBLIC_UMAMI_ID;

const DESCRIPCION = `Con el salario mínimo, una casa en la ${PEOR.nombre} cuesta ${anios(PEOR.anios30)} años de ahorro; en todo México, ${anios(NAC.anios30)}. Busca tu estado.`;

export const metadata: Metadata = {
  // URL absoluta del sitio (las redes sociales necesitan rutas completas para las imágenes).
  metadataBase: new URL(SITIO),
  twitter: { card: "summary_large_image" },
  title: TITULO,
  description: DESCRIPCION,
  openGraph: {
    title: TITULO,
    siteName: "Inavitable",
    description: DESCRIPCION,
    locale: "es_MX",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f0e8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" data-scroll-behavior="smooth" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh">
        {children}
        {/* Umami (sin cookies), solo si hay sitio configurado. Los eventos nunca llevan el salario: ver src/lib/analytics.ts. */}
        {UMAMI && <Script src="https://cloud.umami.is/script.js" data-website-id={UMAMI} data-do-not-track="true" strategy="afterInteractive" />}
      </body>
    </html>
  );
}
