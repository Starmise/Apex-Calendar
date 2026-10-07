// Ajustes → Aplicación, Avisos y Atajos de teclado.

import { el } from './common.js';

/**
 * @param {{standalone: boolean, canInstall: boolean, ios: boolean, offlineReady: boolean,
 *          onInstall: () => void}} s
 */
export function appSection({ standalone, canInstall, ios, offlineReady, onInstall }) {
  const fs = el('fieldset', 'settings-group');
  fs.append(el('legend', null, 'Aplicación'));

  const status = el('ul', 'status-list');
  status.append(
    el('li', offlineReady ? 'ok' : 'pending', offlineReady ? 'Funciona sin conexión.' : 'El modo sin conexión se activa después de la primera visita al sitio publicado.'),
  );
  if (standalone) status.append(el('li', 'ok', 'Estás usando la app instalada.'));
  fs.append(status);

  if (!standalone) {
    if (canInstall) {
      fs.append(el('p', 'settings-hint', 'Instálala para abrirla como una app, con su propio ícono y sin la barra del navegador.'));
      const b = el('button', 'primary', 'Instalar Apex Calendar');
      b.type = 'button';
      b.addEventListener('click', onInstall);
      fs.append(b);
    } else if (ios) {
      fs.append(el('p', 'settings-hint', 'En iPhone o iPad: abre el sitio en Safari, toca Compartir y luego "Agregar a inicio".'));
    } else {
      fs.append(
        el(
          'p',
          'settings-hint',
          'Para instalarla, usa el menú del navegador ("Instalar app" o "Agregar a la pantalla de inicio"). En Chrome y Edge aparece también un ícono en la barra de direcciones.',
        ),
      );
    }
  }
  return fs;
}

const PERMISSION_TEXT = {
  granted: 'Permitidos. Te avisaremos a la hora de los recordatorios marcados con "Avisarme".',
  denied: 'Bloqueados en este navegador. Para activarlos, abre la configuración del sitio (el candado junto a la dirección) y permite las notificaciones.',
  default: 'Todavía no has dado permiso.',
  unsupported: 'Este navegador no permite notificaciones. Los avisos aparecerán dentro de la app mientras esté abierta.',
};

/**
 * @param {{permission: string, onRequest: () => void, onTest: () => void}} s
 */
export function notificationsSection({ permission, onRequest, onTest }) {
  const fs = el('fieldset', 'settings-group');
  fs.append(el('legend', null, 'Avisos de recordatorios'));
  fs.append(
    el(
      'p',
      'settings-hint',
      'Los avisos solo llegan mientras Apex Calendar está abierto (en una pestaña o como app instalada). No hay servidor que pueda avisarte con todo cerrado.',
    ),
  );
  fs.append(el('p', `permission ${permission}`, PERMISSION_TEXT[permission] ?? PERMISSION_TEXT.unsupported));
  const row = el('div', 'settings-actions');
  if (permission === 'default') {
    const b = el('button', 'primary', 'Permitir avisos');
    b.type = 'button';
    b.addEventListener('click', onRequest);
    row.append(b);
  }
  const test = el('button', null, 'Probar un aviso');
  test.type = 'button';
  test.addEventListener('click', onTest);
  row.append(test);
  fs.append(row);
  return fs;
}

const SHORTCUTS = [
  ['← →', 'Periodo anterior / siguiente (fuera del calendario)'],
  ['Flechas', 'Moverse entre días dentro del mes o la semana'],
  ['Enter', 'Abrir el día seleccionado'],
  ['Re Pág / Av Pág', 'Mes o semana anterior / siguiente sin perder el foco'],
  ['Inicio / Fin', 'Primer / último día visible'],
  ['Tab', 'El primer Tab muestra "Saltar al contenido"'],
];

export function shortcutsSection() {
  const fs = el('fieldset', 'settings-group');
  fs.append(el('legend', null, 'Atajos de teclado'));
  const dl = el('dl', 'shortcuts');
  for (const [keys, what] of SHORTCUTS) {
    const dt = el('dt');
    for (const [i, k] of keys.split(' / ').entries()) {
      if (i) dt.append(' / ');
      dt.append(el('kbd', null, k));
    }
    dl.append(dt, el('dd', null, what));
  }
  fs.append(dl);
  return fs;
}
