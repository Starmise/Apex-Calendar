// Vista día: todo lo que hay que saber de una fecha.

import { getDayInfo, shortRange } from '../core/schedule.js';
import { formatLong } from '../core/dates.js';
import { paydayOn, paydayText } from '../core/paydays.js';
import { el, fmtHours, payBadge, paydayBadge, payText, cycleText } from './common.js';

/** Ficha de un día. La comparten la vista día y el buscador. */
export function dayCard(iso, today, { headingLevel = 'h2', bank = 'general' } = {}) {
  const info = getDayInfo(iso);
  const payday = paydayOn(iso, { bank });
  const card = el('article', `day-card ${info.type}`);
  if (iso === today) card.classList.add('today');

  const head = el('div', 'day-card-head');
  const status = el(headingLevel, 'day-card-status', info.type === 'work' ? 'Se trabaja' : 'Descanso');
  head.append(status);
  if (payday) head.append(paydayBadge());
  if (info.pay > 1) head.append(payBadge(info.pay));
  card.append(head);

  const dl = el('dl', 'day-facts');
  const fact = (term, value) => {
    dl.append(el('dt', null, term), el('dd', null, value));
  };
  if (info.type === 'work') {
    fact('Horario', `${info.start} a ${info.end} (${shortRange(info)})`);
    fact('Horas', `${fmtHours(info.hours)} h`);
  }
  fact('Paga', payText(info));
  if (info.holiday) fact('Festivo', info.holiday);
  if (payday) fact('Quincena', paydayText(payday, { bank }));
  fact('Rol', cycleText(info));
  card.append(dl);
  return card;
}

/**
 * @param {HTMLElement} root
 * @param {{date: string, today: string, extras?: (iso: string) => Node[]}} opts
 *   extras: secciones adicionales (próximos descansos, recordatorios…).
 */
export function renderDay(root, { date, today, extras = () => [], bank = 'general' }) {
  root.replaceChildren();

  const title = el('h2', 'view-title', capitalize(formatLong(date)));
  title.id = 'view-title';
  title.tabIndex = -1;
  if (date === today) title.append(el('span', 'today-tag', 'Hoy'));
  root.append(title);

  const card = dayCard(date, today, { headingLevel: 'h3', bank });
  root.append(card);
  for (const node of extras(date)) root.append(node);
}

export function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
