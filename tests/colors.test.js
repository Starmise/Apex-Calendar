import { describe, expect, it } from 'vitest';
import { contrast, isHex, mix, parseHex, readableText, toHex } from '../src/core/colors.js';
import { PALETTES } from '../src/data/palettes.js';
import { buildThemeCSS, themeVars } from '../src/app/theme.js';
import { normalizeSettings, DEFAULT_SETTINGS } from '../src/core/settings.js';

// Neutros de themes.css (los que una paleta no sobrescribe).
const NEUTRAL = {
  light: { bg: '#f7f6f2', surface: '#ffffff', text: '#1d1d1b', muted: '#6b6a64' },
  dark: { bg: '#151513', surface: '#1e1e1b', text: '#ecebe6', muted: '#a3a29b' },
};

describe('utilidades de color', () => {
  it('lee y escribe hex', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255]);
    expect(parseHex('1f5fd1')).toEqual([31, 95, 209]);
    expect(parseHex('rojo')).toBeNull();
    expect(isHex('#12345')).toBe(false);
    expect(toHex([31, 95, 209])).toBe('#1f5fd1');
  });

  it('contraste WCAG', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrast('#777777', '#777777')).toBe(1);
  });

  it('mezcla', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
  });

  it('texto legible sobre cualquier fondo', () => {
    for (const bg of ['#fadfc0', '#ffff00', '#1f5fd1', '#000000', '#ffffff', '#808080', '#ff0000', '#00ff00']) {
      expect(contrast(readableText(bg), bg), bg).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('paletas', () => {
  for (const palette of PALETTES) {
    for (const mode of ['light', 'dark']) {
      const c = { ...NEUTRAL[mode], ...palette[mode] };
      it(`${palette.name} (${mode}): texto con contraste AA`, () => {
        for (const k of Object.values(c)) expect(isHex(k), k).toBe(true);
        const pairs = [
          ['work-fg', 'work-bg'], ['rest-fg', 'rest-bg'], ['x2-fg', 'x2-bg'],
          ['x3-fg', 'x3-bg'], ['accent-fg', 'accent'], ['text', 'bg'], ['text', 'surface'],
          ['muted', 'bg'], ['muted', 'surface'],
        ];
        for (const [fg, bg] of pairs) {
          expect(contrast(c[fg], c[bg]), `${fg} sobre ${bg}: ${c[fg]} / ${c[bg]}`).toBeGreaterThanOrEqual(4.5);
        }
      });
      it(`${palette.name} (${mode}): etiquetas x2/x3 visibles sobre un día de trabajo`, () => {
        // Las etiquetas solo aparecen en días trabajados. Contraste de componentes: 3:1,
        // o bien la etiqueta se distingue por su propio texto (x2-fg sobre work-bg).
        for (const k of ['x2', 'x3']) {
          const shape = contrast(c[`${k}-bg`], c['work-bg']);
          const text = contrast(c[`${k}-fg`], c['work-bg']);
          expect(Math.max(shape, text), `${k} en ${palette.id}/${mode}`).toBeGreaterThanOrEqual(3);
        }
      });
    }
  }
});

describe('ajustes y tema', () => {
  it('normaliza datos dañados o viejos', () => {
    expect(normalizeSettings(null)).toEqual({ ...DEFAULT_SETTINGS, colors: {} });
    expect(normalizeSettings({ theme: 'morado', palette: 'nope', colors: { work: 'rojo', rest: '#ABCDEF', foo: '#000' } }))
      .toEqual({ theme: 'auto', palette: 'clasico', colors: { rest: '#abcdef' } });
  });

  it('color propio: el texto se calcula con buen contraste', () => {
    const s = normalizeSettings({ colors: { work: '#ffff00' } });
    for (const mode of ['light', 'dark']) {
      const v = themeVars(s, mode);
      expect(v['work-bg']).toBe('#ffff00');
      expect(contrast(v['work-fg'], '#ffff00')).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('la hoja respeta modo automático y forzado', () => {
    const css = buildThemeCSS(normalizeSettings({ palette: 'oceano' }));
    expect(css).toContain('html:root {');
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('html:root[data-theme="dark"]');
    expect(css).toContain('--work-bg: #cfe3fb');
  });
});
