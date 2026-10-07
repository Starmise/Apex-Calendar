// Piezas compartidas por las vistas.

import { shortRange } from '../core/schedule.js';

/** Crea un elemento con clase y texto opcionales. */
export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/** 'Trabajo 8–20 · Navidad · paga x3' */
export function describe(info) {
  const parts = [info.type === 'work' ? `Trabajo ${shortRange(info)}` : 'Descanso'];
  if (info.holiday) parts.push(info.holiday);
  if (info.pay > 1) parts.push(`paga x${info.pay}`);
  return parts.join(' · ');
}

/** 12 → '12', 12.5 → '12.5' */
export function fmtHours(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** Etiqueta x2 / x3. */
export function payBadge(pay) {
  const badge = el('span', `pay pay-x${pay}`, `x${pay}`);
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
  if (info.pay === 3) {
    return info.isSunday
      ? 'Festivo trabajado en domingo: paga triple (x3, no se suma al x2).'
      : 'Festivo trabajado: paga triple (x3).';
  }
  if (info.pay === 2) return 'Domingo trabajado: paga doble (x2).';
  return 'Paga normal (x1).';
}

/** 'Semana A · día 3 de 14' */
export function cycleText(info) {
  const week = info.cycleIndex < 7 ? 'A' : 'B';
  return `Semana ${week} del rol · día ${info.cycleIndex + 1} de 14`;
}
