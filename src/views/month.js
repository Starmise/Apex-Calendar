// Vista mes: tabla domingo–sábado con el tipo de día, horario, paga y festivos.
// Cada día es un enlace a su vista día.

import { getDayInfo, shortRange } from '../core/schedule.js';
import { daysInMonth, fromParts, weekday, MONTHS_ES, WEEKDAYS_ES, WEEKDAYS_SHORT_ES } from '../core/dates.js';
import { el, describe, fmtHours, payBadge } from './common.js';

/** Resumen de un rango de fechas: horas trabajadas y días con paga especial. */
export function summarize(dates) {
  let hours = 0, workDays = 0, x2 = 0, x3 = 0;
  for (const iso of dates) {
    const info = getDayInfo(iso);
    if (info.type !== 'work') continue;
    workDays++;
    hours += info.hours;
    if (info.pay === 2) x2++;
    if (info.pay === 3) x3++;
  }
  return { hours, workDays, x2, x3 };
}

export function monthDates(year, month) {
  return Array.from({ length: daysInMonth(year, month) }, (_, i) => fromParts(year, month, i + 1));
}

/** Resumen del mes (se conserva por compatibilidad con v0.1). */
export function monthSummary(year, month) {
  return summarize(monthDates(year, month));
}

export function summaryText(s) {
  return (
    `${s.workDays} ${s.workDays === 1 ? 'día' : 'días'} de trabajo · ${fmtHours(s.hours)} h` +
    (s.x2 ? ` · ${s.x2} ${s.x2 === 1 ? 'domingo' : 'domingos'} x2` : '') +
    (s.x3 ? ` · ${s.x3} ${s.x3 === 1 ? 'festivo' : 'festivos'} x3` : '')
  );
}

/**
 * @param {HTMLElement} root
 * @param {{date: string, today: string, focus?: string, reminders?: (iso: string) => number}} opts
 *   date = día 1 del mes; focus = día que recibe el foco del teclado.
 */
export function renderMonth(root, { date, today, focus, reminders = () => 0 }) {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  root.replaceChildren();

  const title = el('h2', 'view-title', `${MONTHS_ES[month - 1]} ${year}`);
  title.id = 'view-title';
  title.tabIndex = -1;
  root.append(title);

  const table = el('table', 'month-grid');
  table.setAttribute('aria-labelledby', 'view-title');
  const thead = el('thead');
  const headRow = el('tr');
  WEEKDAYS_SHORT_ES.forEach((name, i) => {
    const th = el('th', 'weekday');
    th.scope = 'col';
    const abbr = el('abbr', null, name);
    abbr.title = WEEKDAYS_ES[i];
    th.append(abbr);
    headRow.append(th);
  });
  thead.append(headRow);
  table.append(thead);

  const tbody = el('tbody');
  const total = daysInMonth(year, month);
  const lead = weekday(fromParts(year, month, 1));
  const cells = Math.ceil((lead + total) / 7) * 7;
  const focusDay = focus && focus.slice(0, 7) === date.slice(0, 7) ? focus : date;

  let row;
  for (let i = 0; i < cells; i++) {
    if (i % 7 === 0) {
      row = el('tr');
      tbody.append(row);
    }
    const day = i - lead + 1;
    const td = el('td');
    if (day < 1 || day > total) {
      td.className = 'empty';
      row.append(td);
      continue;
    }

    const iso = fromParts(year, month, day);
    const info = getDayInfo(iso);
    const count = reminders(iso);
    const link = el('a', `day ${info.type}`);
    link.href = `#/dia/${iso}`;
    link.dataset.date = iso;
    // Solo un día entra en el orden de tabulación; las flechas mueven el foco entre días.
    link.tabIndex = iso === focusDay ? 0 : -1;
    if (iso === today) {
      link.classList.add('today');
      link.setAttribute('aria-current', 'date');
    }
    if (info.holiday) link.classList.add('holiday');
    const extra = count ? ` · ${count} ${count === 1 ? 'recordatorio' : 'recordatorios'}` : '';
    link.title = describe(info) + extra;
    link.setAttribute(
      'aria-label',
      `${WEEKDAYS_ES[weekday(iso)]} ${day}: ${describe(info)}${extra}${iso === today ? ' (hoy)' : ''}`,
    );

    const top = el('span', 'day-top');
    top.append(el('span', 'day-num', String(day)));
    if (info.pay > 1) top.append(payBadge(info.pay));
    link.append(top);

    if (info.type === 'work') link.append(el('span', 'day-range', shortRange(info)));
    if (info.holiday) link.append(el('span', 'day-holiday', info.holiday));
    if (count) {
      const dot = el('span', 'day-reminder', count > 1 ? `● ${count}` : '●');
      dot.setAttribute('aria-hidden', 'true');
      link.append(dot);
    }

    td.append(link);
    row.append(td);
  }
  table.append(tbody);
  root.append(table);

  root.append(el('p', 'view-summary', summaryText(monthSummary(year, month))));
}
