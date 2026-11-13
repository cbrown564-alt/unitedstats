/**
 * `next/font/google` for the Astro build. Fonts are loaded by Astro's font API
 * (astro.config.mjs `fonts`, `<Font>` in Document.astro), which sets the same
 * CSS variables on :root, so these return empty class names.
 */
type FontResult = { className: string; variable: string; style: { fontFamily: string } };
const font = (): FontResult => ({ className: "", variable: "", style: { fontFamily: "" } });
export const Archivo = font;
export const IBM_Plex_Mono = font;
