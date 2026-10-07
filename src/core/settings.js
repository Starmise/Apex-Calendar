// Ajustes personales (se guardan en `apex.settings`). Puro: valida y completa con valores por defecto.

import { isHex } from './colors.js';
import { CUSTOM_COLORS, DEFAULT_PALETTE, PALETTES } from '../data/palettes.js';

export const THEMES = ['auto', 'light', 'dark'];

export const DEFAULT_SETTINGS = Object.freeze({
  theme: 'auto',
  palette: DEFAULT_PALETTE,
  /** Colores propios: { work: '#rrggbb', … } — solo los que el usuario cambió. */
  colors: Object.freeze({}),
});

/** Devuelve ajustes válidos a partir de cualquier cosa (datos viejos, importados o dañados). */
export function normalizeSettings(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const colors = {};
  if (s.colors && typeof s.colors === 'object') {
    for (const { key } of CUSTOM_COLORS) {
      if (isHex(s.colors[key])) colors[key] = s.colors[key].toLowerCase();
    }
  }
  return {
    theme: THEMES.includes(s.theme) ? s.theme : DEFAULT_SETTINGS.theme,
    palette: PALETTES.some((p) => p.id === s.palette) ? s.palette : DEFAULT_SETTINGS.palette,
    colors,
  };
}
