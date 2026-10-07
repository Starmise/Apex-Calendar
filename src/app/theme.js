// Aplica los ajustes de apariencia: modo claro/oscuro/automático, paleta y colores propios.
// La paleta se inyecta como una hoja de estilo con la misma estructura que themes.css,
// así el modo automático sigue respondiendo a la preferencia del sistema.

import { readableText } from '../core/colors.js';
import { CUSTOM_COLORS, getPalette } from '../data/palettes.js';

function block(selector, vars) {
  const body = Object.entries(vars).map(([k, v]) => `  --${k}: ${v};`).join('\n');
  return `${selector} {\n${body}\n}`;
}

/** Variables de un modo con los colores propios aplicados (el texto se calcula para que se lea). */
export function themeVars(settings, mode) {
  const vars = { ...getPalette(settings.palette)[mode] };
  for (const { key, bg, fg } of CUSTOM_COLORS) {
    const color = settings.colors?.[key];
    if (!color) continue;
    vars[bg] = color;
    vars[fg] = readableText(color);
  }
  if (!vars.focus && vars.accent) vars.focus = vars.accent;
  return vars;
}

/** Hoja de estilo de la paleta. Pura, para poder probarla. */
export function buildThemeCSS(settings) {
  const light = themeVars(settings, 'light');
  const dark = themeVars(settings, 'dark');
  return [
    // `html:root` gana en especificidad a themes.css sin importar el orden de las hojas.
    block('html:root', light),
    `@media (prefers-color-scheme: dark) {\n${block('html:root:not([data-theme="light"])', dark)}\n}`,
    block('html:root[data-theme="dark"]', dark),
  ].join('\n');
}

/** Aplica los ajustes a la página. */
export function applyTheme(settings, doc = document) {
  const root = doc.documentElement;
  if (settings.theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', settings.theme);

  let style = doc.getElementById('apex-theme');
  if (!style) {
    style = doc.createElement('style');
    style.id = 'apex-theme';
    doc.head.append(style);
  }
  style.textContent = buildThemeCSS(settings);

  // Color de la barra del navegador en celular.
  const meta = doc.querySelector('meta[name="theme-color"]');
  if (meta) {
    const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
    if (bg) meta.setAttribute('content', bg);
  }
}
