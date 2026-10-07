// Ajustes → Tus datos: exportar, importar y borrar.

import { el } from './common.js';

/**
 * @param {{reminderCount: number, onExport: () => void,
 *          onImport: (file: File, mode: 'merge'|'replace') => void, onClear: () => void}} opts
 */
export function dataSection({ reminderCount, onExport, onImport, onClear }) {
  const fs = el('fieldset', 'settings-group');
  fs.append(el('legend', null, 'Tus datos'));
  fs.append(
    el(
      'p',
      'settings-hint',
      `Tus ajustes y ${reminderCount} ${reminderCount === 1 ? 'recordatorio' : 'recordatorios'} viven solo en este navegador. ` +
        'Si borras los datos del navegador o cambias de dispositivo se pierden: exporta un respaldo de vez en cuando.',
    ),
  );

  const exportBtn = el('button', 'primary', 'Exportar respaldo (.json)');
  exportBtn.type = 'button';
  exportBtn.addEventListener('click', onExport);
  const exportRow = el('div', 'settings-actions');
  exportRow.append(exportBtn);
  fs.append(exportRow);

  // Importar
  const imp = el('div', 'import-box');
  imp.append(el('p', 'import-title', 'Importar un respaldo'));
  const modes = el('div', 'import-modes');
  modes.setAttribute('role', 'radiogroup');
  modes.setAttribute('aria-label', 'Al importar');
  for (const [value, text] of [
    ['merge', 'Combinar con lo que tengo'],
    ['replace', 'Reemplazar todo (ajustes y recordatorios)'],
  ]) {
    const label = el('label', 'choice');
    const input = el('input');
    input.type = 'radio';
    input.name = 'import-mode';
    input.value = value;
    input.checked = value === 'merge';
    label.append(input, el('span', null, text));
    modes.append(label);
  }
  imp.append(modes);

  const file = el('input');
  file.type = 'file';
  file.accept = 'application/json,.json';
  file.id = 'import-file';
  file.className = 'visually-hidden';
  const pick = el('label', 'button', 'Elegir archivo…');
  pick.htmlFor = 'import-file';
  // La etiqueta funciona como botón: que también responda a Enter y espacio.
  pick.tabIndex = 0;
  pick.setAttribute('role', 'button');
  pick.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      file.click();
    }
  });
  file.tabIndex = -1;
  file.addEventListener('change', () => {
    const f = file.files?.[0];
    if (!f) return;
    const mode = imp.querySelector('input[name="import-mode"]:checked')?.value ?? 'merge';
    onImport(f, mode);
    file.value = '';
  });
  const importRow = el('div', 'settings-actions');
  importRow.append(pick, file);
  imp.append(importRow);
  fs.append(imp);

  // Borrar
  const clear = el('button', 'danger', 'Borrar todos mis datos');
  clear.type = 'button';
  clear.addEventListener('click', onClear);
  const clearRow = el('div', 'settings-actions danger-zone');
  clearRow.append(clear);
  fs.append(clearRow);
  return fs;
}
