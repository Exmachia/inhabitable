/**
 * URL pública del sitio. Mientras no haya dominio propio, en producción es la dirección que da Vercel
 * (`VERCEL_PROJECT_PRODUCTION_URL`); con dominio, se pone en `NEXT_PUBLIC_SITE_URL`. En vistas previas y en local, la que toque.
 */
const vercel = process.env.VERCEL_ENV === "production" ? process.env.VERCEL_PROJECT_PRODUCTION_URL : process.env.VERCEL_URL;
export const SITIO = process.env.NEXT_PUBLIC_SITE_URL ?? (vercel ? `https://${vercel}` : "http://localhost:3200");

/** Título de la portada (y de la pestaña cuando no hay lugar elegido). */
export const TITULO = "Inavitable — una casa cuesta toda una vida de salario mínimo";

/** Para quien tenga datos, sepa del tema o quiera ayudar. */
export const CONTACTO = "https://www.linkedin.com/in/eduardo-chacon-171367275/";
