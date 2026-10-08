// Vista semana: los 7 días (domingo a sábado) con horario, horas, paga y festivos.

import { getDayInfo, shortRange } from '../core/schedule.js';
import { addDays, formatShort, weekday, MONTHS_ES, WEEKDAYS_ES } from '../core/dates.js';
import { paydayOn } from '../core/paydays.js';
import { el, describe, fmtHours, payBadge, paydayBadge } from './common.js';
import { summarize, summaryText } from './month.js';

function weekTitle(start) {
  const end = addDays(start, 6);
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  if (sy !== ey) return `${sd} ${MONTHS_ES[sm - 1].toLowerCase()} ${sy} – ${ed} ${MONTHS_ES[em - 1].toLowerCase()} ${ey}`;
  if (sm !== em) return `${sd} ${MONTHS_ES[sm - 1].toLowerCase()} – ${ed} ${MONTHS_ES[em - 1].toLowerCase()} ${ey}`;
  return `${sd}–${ed} de ${MONTHS_ES[sm - 1].toLowerCase()} ${sy}`;
}

/**
 * @param {HTMLElement} root
 * @param {{date: string, today: string, focus?: string, reminders?: (iso: string) => object[]}} opts
 *   date = domingo de la semana.
 */
export function renderWeek(root, { date, today, focus, reminders = () => [], bank = 'general' }) {
  root.replaceChildren();

  const title = el('h2', 'view-title', `Semana del ${weekTitle(date)}`);
  title.id = 'view-title';
  title.tabIndex = -1;
  root.append(title);

  const dates = Array.from({ length: 7 }, (_, i) => addDays(date, i));
  const focusDay = dates.includes(focus) ? focus : date;
  const list = el('ol', 'week-list');
  list.setAttribute('aria-labelledby', 'view-title');

  for (const iso of dates) {
    const info = getDayInfo(iso);
    const items = reminders(iso);
    const payday = paydayOn(iso, { bank });
    const li = el('li');
    const link = el('a', `week-day day ${info.type}`);
    link.href = `#/dia/${iso}`;
    link.dataset.date = iso;
    link.tabIndex = iso === focusDay ? 0 : -1;
    if (iso === today) {
      link.classList.add('today');
      link.setAttribute('aria-current', 'date');
    }
    if (info.holiday) link.classList.add('holiday');
    if (payday) link.classList.add('payday');

    const head = el('span', 'week-head');
    const name = el('span', 'week-name', WEEKDAYS_ES[weekday(iso)]);
    head.append(name, el('span', 'week-date', formatShort(iso)));
    if (payday) head.append(paydayBadge());
    if (info.pay > 1) head.append(payBadge(info.pay));
    link.append(head);

    link.append(
      el('span', 'week-status', info.type === 'work' ? shortRange(info) : 'Descanso'),
    );
    if (info.type === 'work') link.append(el('span', 'week-hours', `${fmtHours(info.hours)} h`));
    if (info.holiday) link.append(el('span', 'day-holiday', info.holiday));
    if (payday) link.append(el('span', 'week-payday', 'Día de pago'));

    if (items.length) {
      const ul = el('ul', 'week-reminders');
      for (const r of items.slice(0, 3)) ul.append(el('li', null, r.time ? `${r.time} ${r.text}` : r.text));
      if (items.length > 3) ul.append(el('li', null, `+${items.length - 3} más`));
      link.append(ul);
    }

    const extra = items.length ? ` · ${items.length} ${items.length === 1 ? 'recordatorio' : 'recordatorios'}` : '';
    link.prepend(
      el('span', 'visually-hidden', `${WEEKDAYS_ES[weekday(iso)]} ${formatShort(iso)}: ${describe(info, payday)}${extra}${iso === today ? ' (hoy)' : ''}`),
    );
    for (const child of [...link.children].slice(1)) child.setAttribute('aria-hidden', 'true');
    li.append(link);
    list.append(li);
  }
  root.append(list);
  root.append(el('p', 'view-summary', summaryText(summarize(dates))));
}
