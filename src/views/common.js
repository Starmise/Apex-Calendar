// Piezas compartidas por las vistas.

import { shortRange, PAY } from '../core/schedule.js';

/** Crea un elemento con clase y texto opcionales. */
export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/**
 * Etiqueta de paga especial. `cls` conserva los nombres históricos (x2 = domingo, x3 = festivo)
 * porque son las claves de color guardadas en apex.settings.colors.
 */
const PAY_TAGS = {
  [PAY.SUNDAY]: { cls: 'x2', text: 'PD', label: 'prima dominical' },
  [PAY.HOLIDAY]: { cls: 'x3', text: 'x3', label: 'paga x3' },
};

/** 'Trabajo 8–20 · Navidad · paga x3 · día de pago' / 'Trabajo 8–21 · prima dominical' */
export function describe(info, payday = null) {
  const parts = [info.type === 'work' ? `Trabajo ${shortRange(info)}` : 'Descanso'];
  if (info.holiday) parts.push(info.holiday);
  if (PAY_TAGS[info.pay]) parts.push(PAY_TAGS[info.pay].label);
  if (payday) parts.push('día de pago');
  return parts.join(' · ');
}

/** Marca "$" del día de pago (solo visual; el texto accesible va aparte). */
export function paydayBadge() {
  const badge = el('span', 'payday-badge', '$');
  badge.setAttribute('aria-hidden', 'true');
  return badge;
}

/** 12 → '12', 12.5 → '12.5' */
export function fmtHours(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** Etiqueta PD (prima dominical) / x3 (festivo). */
export function payBadge(pay) {
  const tag = PAY_TAGS[pay];
  const badge = el('span', `pay pay-${tag.cls}`, tag.text);
  badge.setAttribute('aria-hidden', 'true');
  return badge;
}

/** Explicación de la paga de un día para la vista día y el buscador. */
export function payText(info) {
  if (info.type !== 'work') {
    if (info.holiday) return 'Festivo en día de descanso: no hay paga extra.';
    if (info.isSunday) return 'Domingo de descanso: no hay paga extra.';
    return 'Día de descanso.';
  }
  if (info.pay === PAY.HOLIDAY) {
    return info.isSunday
      ? 'Festivo trabajado en domingo: paga triple (x3); la prima dominical no se suma.'
      : 'Festivo trabajado: paga triple (x3).';
  }
  if (info.pay === PAY.SUNDAY) return 'Domingo trabajado: paga normal más prima dominical (25 % extra, LFT art. 71). No es paga doble.';
  return 'Paga normal (x1).';
}

/** 'Semana A · día 3 de 14' */
export function cycleText(info) {
  const week = info.cycleIndex < 7 ? 'A' : 'B';
  return `Semana ${week} del rol · día ${info.cycleIndex + 1} de 14`;
}
