// Ajustes (#/ajustes): apariencia, paleta y colores propios.
// Las secciones de datos, notificaciones e instalación se agregan con `sections`.

import { PALETTES, CUSTOM_COLORS, getPalette } from '../data/palettes.js';
import { el } from './common.js';

const THEME_LABELS = [
  ['auto', 'Automático', 'Sigue al sistema'],
  ['light', 'Claro', null],
  ['dark', 'Oscuro', null],
];

function fieldset(legend) {
  const fs = el('fieldset', 'settings-group');
  fs.append(el('legend', null, legend));
  return fs;
}

function radio(name, value, checked, labelText, hint) {
  const label = el('label', 'choice');
  const input = el('input');
  input.type = 'radio';
  input.name = name;
  input.value = value;
  input.checked = checked;
  label.append(input, el('span', 'choice-label', labelText));
  if (hint) label.append(el('span', 'choice-hint', hint));
  return label;
}

/** Muestra de colores de una paleta (modo claro y oscuro). */
function swatches(palette) {
  const wrap = el('span', 'palette-swatches');
  wrap.setAttribute('aria-hidden', 'true');
  for (const mode of ['light', 'dark']) {
    const c = palette[mode];
    for (const k of ['work-bg', 'rest-bg', 'x2-bg', 'x3-bg', 'accent']) {
      const s = el('span', 'palette-swatch');
      s.style.background = c[k];
      wrap.append(s);
    }
    if (mode === 'light') wrap.append(el('span', 'palette-sep'));
  }
  return wrap;
}

/**
 * @param {HTMLElement} root
 * @param {{settings: object, onChange: (patch: object) => void, sections?: Node[], persistent?: boolean}} opts
 */
export function renderSettings(root, { settings, onChange, sections = [], persistent = true }) {
  root.replaceChildren();

  const title = el('h2', 'view-title', 'Ajustes');
  title.id = 'view-title';
  title.tabIndex = -1;
  root.append(title);

  if (!persistent) {
    root.append(
      el(
        'p',
        'notice warning',
        'Tu navegador no permite guardar datos en este sitio: los cambios se perderán al cerrar la pestaña.',
      ),
    );
  }

  root.append(el('p', 'settings-intro', 'Todo se guarda solo en este navegador. Nadie más ve tus colores ni tus recordatorios.'));

  // Modo
  const mode = fieldset('Modo');
  for (const [value, label, hint] of THEME_LABELS) mode.append(radio('theme', value, settings.theme === value, label, hint));
  mode.addEventListener('change', (e) => onChange({ theme: e.target.value }));
  root.append(mode);

  // Paleta
  const pal = fieldset('Paleta');
  pal.classList.add('palette-group');
  for (const p of PALETTES) {
    const label = radio('palette', p.id, settings.palette === p.id, p.name);
    label.classList.add('palette-choice');
    label.append(swatches(p));
    pal.append(label);
  }
  pal.addEventListener('change', (e) => onChange({ palette: e.target.value }));
  root.append(pal);

  // Colores propios
  const custom = fieldset('Colores propios');
  custom.append(
    el('p', 'settings-hint', 'Cambian la paleta en modo claro y oscuro. El color del texto se ajusta solo para que siempre se lea.'),
  );
  const base = getPalette(settings.palette).light;
  const grid = el('div', 'color-grid');
  for (const { key, label, bg } of CUSTOM_COLORS) {
    const row = el('div', 'color-row');
    const id = `color-${key}`;
    const lab = el('label', null, label);
    lab.htmlFor = id;
    const input = el('input');
    input.type = 'color';
    input.id = id;
    input.value = settings.colors[key] ?? base[bg];
    input.addEventListener('input', () => onChange({ colors: { ...settings.colors, [key]: input.value } }, { rerender: false }));
    input.addEventListener('change', () => onChange({ colors: { ...settings.colors, [key]: input.value } }));
    const reset = el('button', 'small', 'Restablecer');
    reset.type = 'button';
    reset.setAttribute('aria-label', `Restablecer color de ${label.toLowerCase()}`);
    reset.disabled = !settings.colors[key];
    reset.addEventListener('click', () => {
      const colors = { ...settings.colors };
      delete colors[key];
      onChange({ colors });
    });
    row.append(lab, input, reset);
    grid.append(row);
  }
  custom.append(grid);

  // Vista previa con los colores actuales.
  const preview = el('div', 'settings-preview');
  preview.setAttribute('aria-hidden', 'true');
  const sample = [
    ['work', '8–21', 2], ['work', '8–21', 0], ['rest', '', 0], ['work', '8–20', 3], ['rest', '', 0],
  ];
  sample.forEach(([type, range, pay], i) => {
    const d = el('span', `day ${type}`);
    const top = el('span', 'day-top');
    top.append(el('span', 'day-num', String(i + 4)));
    if (pay) top.append(el('span', `pay pay-x${pay}`, `x${pay}`));
    d.append(top);
    if (range) d.append(el('span', 'day-range', range));
    preview.append(d);
  });
  custom.append(preview);

  const resetAll = el('button', null, 'Restablecer todos los colores');
  resetAll.type = 'button';
  resetAll.disabled = Object.keys(settings.colors).length === 0;
  resetAll.addEventListener('click', () => onChange({ colors: {} }));
  custom.append(resetAll);
  root.append(custom);

  for (const node of sections) root.append(node);
}
