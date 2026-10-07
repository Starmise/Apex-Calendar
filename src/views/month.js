// Vista mes: cuadrícula domingo–sábado con el tipo de día, horario, paga y festivos.

import { getDayInfo, shortRange } from '../core/schedule.js';
import { daysInMonth, fromParts, weekday, MONTHS_ES, WEEKDAYS_SHORT_ES } from '../core/dates.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function describe(info) {
  const parts = [];
  parts.push(info.type === 'work' ? `Trabajo ${shortRange(info)}` : 'Descanso');
  if (info.holiday) parts.push(info.holiday);
  if (info.pay > 1) parts.push(`paga x${info.pay}`);
  return parts.join(' · ');
}

/** Resumen del mes: horas trabajadas y días con paga especial. */
export function monthSummary(year, month) {
  let hours = 0, workDays = 0, x2 = 0, x3 = 0;
  for (let d = 1; d <= daysInMonth(year, month); d++) {
    const info = getDayInfo(fromParts(year, month, d));
    if (info.type !== 'work') continue;
    workDays++;
    hours += info.hours;
    if (info.pay === 2) x2++;
    if (info.pay === 3) x3++;
  }
  return { hours, workDays, x2, x3 };
}

export function renderMonth(root, { year, month, today }) {
  root.replaceChildren();

  const title = el('h2', 'month-title', `${MONTHS_ES[month - 1]} ${year}`);
  title.id = 'month-title';
  root.append(title);

  const grid = el('div', 'month-grid');
  grid.setAttribute('role', 'grid');
  grid.setAttribute('aria-labelledby', 'month-title');

  const head = el('div', 'month-row month-head');
  head.setAttribute('role', 'row');
  for (const name of WEEKDAYS_SHORT_ES) {
    const h = el('div', 'weekday', name);
    h.setAttribute('role', 'columnheader');
    head.append(h);
  }
  grid.append(head);

  const total = daysInMonth(year, month);
  const lead = weekday(fromParts(year, month, 1));
  const cells = Math.ceil((lead + total) / 7) * 7;

  let row;
  for (let i = 0; i < cells; i++) {
    if (i % 7 === 0) {
      row = el('div', 'month-row');
      row.setAttribute('role', 'row');
      grid.append(row);
    }
    const day = i - lead + 1;
    if (day < 1 || day > total) {
      const empty = el('div', 'day empty');
      empty.setAttribute('role', 'gridcell');
      row.append(empty);
      continue;
    }

    const iso = fromParts(year, month, day);
    const info = getDayInfo(iso);
    const cell = el('div', `day ${info.type}`);
    cell.setAttribute('role', 'gridcell');
    cell.dataset.date = iso;
    if (iso === today) {
      cell.classList.add('today');
      cell.setAttribute('aria-current', 'date');
    }
    if (info.holiday) cell.classList.add('holiday');
    cell.title = describe(info);
    cell.setAttribute('aria-label', `${day} de ${MONTHS_ES[month - 1]}: ${describe(info)}`);

    const top = el('div', 'day-top');
    top.append(el('span', 'day-num', String(day)));
    if (info.pay > 1) top.append(el('span', `pay pay-x${info.pay}`, `x${info.pay}`));
    cell.append(top);

    if (info.type === 'work') cell.append(el('span', 'day-range', shortRange(info)));
    if (info.holiday) cell.append(el('span', 'day-holiday', info.holiday));

    row.append(cell);
  }
  root.append(grid);

  const s = monthSummary(year, month);
  const summary = el('p', 'month-summary');
  const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  summary.textContent =
    `${s.workDays} días de trabajo · ${fmt(s.hours)} h` +
    (s.x2 ? ` · ${s.x2} ${s.x2 === 1 ? 'domingo' : 'domingos'} x2` : '') +
    (s.x3 ? ` · ${s.x3} ${s.x3 === 1 ? 'festivo' : 'festivos'} x3` : '');
  root.append(summary);
}
