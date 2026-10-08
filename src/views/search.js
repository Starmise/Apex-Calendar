// Buscador por fecha (#/buscar/AAAA-MM-DD) y panel "Lo que sigue", que también usa la vista día.

import { getDayInfo } from '../core/schedule.js';
import { addDays, formatLong, isValidISO } from '../core/dates.js';
import {
  nextFreeWeekend, nextHoliday, nextRest, nextRestOnWeekday, nextWork, relativeDays, streak,
} from '../core/search.js';
import { nextPayday } from '../core/paydays.js';
import { el } from './common.js';
import { capitalize, dayCard } from './day.js';

function dayLink(iso, label = capitalize(formatLong(iso))) {
  const a = el('a', null, label);
  a.href = `#/dia/${iso}`;
  return a;
}

/** Fila "Próximo descanso: lunes 12 de octubre (en 5 días)". */
function row(dl, term, iso, from, suffix = '') {
  dl.append(el('dt', null, term));
  const dd = el('dd');
  if (iso) {
    dd.append(dayLink(iso), ` (${relativeDays(from, iso)})${suffix}`);
  } else {
    dd.textContent = 'No hay en los próximos dos años.';
  }
  dl.append(dd);
}

/** Texto del bloque de días seguidos: 'Descanso de 4 días seguidos: …'. */
function streakText(iso) {
  const s = streak(iso);
  if (s.length < 2) return null;
  const kind = s.type === 'work' ? 'Bloque de trabajo' : 'Descanso';
  return `${kind} de ${s.length} días seguidos: del ${formatLong(s.start, { withYear: false })} al ${formatLong(s.end, { withYear: false })}.`;
}

/** Panel con lo que viene después de `iso`. */
export function upcomingPanel(iso, today, { bank = 'general' } = {}) {
  const panel = el('section', 'panel upcoming');
  const h = el('h3', null, iso === today ? 'Lo que sigue' : 'Después de este día');
  panel.append(h);

  const info = getDayInfo(iso);
  const text = streakText(iso);
  if (text) panel.append(el('p', 'upcoming-streak', text));

  const dl = el('dl', 'upcoming-list');
  if (info.type === 'work') {
    row(dl, 'Próximo descanso', nextRest(iso), iso);
  } else {
    row(dl, 'Regreso al trabajo', nextWork(iso), iso);
  }

  const weekend = nextFreeWeekend(addDays(iso, 1));
  if (weekend) {
    row(dl, 'Fin de semana libre', weekend.saturday, iso, ' — sábado y domingo');
  } else {
    dl.append(el('dt', null, 'Fin de semana libre'));
    const dd = el('dd', null, 'Con el rol actual no hay sábado y domingo libres seguidos. ');
    const sat = nextRestOnWeekday(iso, 6);
    const sun = nextRestOnWeekday(iso, 0);
    if (sat || sun) {
      dd.append('Siguiente sábado libre: ');
      dd.append(sat ? dayLink(sat, relativeDays(iso, sat)) : 'ninguno', '; siguiente domingo libre: ');
      dd.append(sun ? dayLink(sun, relativeDays(iso, sun)) : 'ninguno', '.');
    }
    dl.append(dd);
  }

  const holiday = nextHoliday(iso);
  if (holiday) {
    const worked = holiday.type === 'work' ? ' — se trabaja, paga x3' : ' — cae en descanso';
    row(dl, 'Próximo festivo', holiday.date, iso, ` · ${holiday.holiday}${worked}`);
  }

  const pay = nextPayday(iso, { bank });
  if (pay) row(dl, 'Próximo día de pago', pay.date, iso, bank === 'bbva' ? ' — cuenta BBVA' : '');
  panel.append(dl);
  return panel;
}

/**
 * @param {HTMLElement} root
 * @param {{date: string|null, today: string, onSearch: (iso: string) => void}} opts
 */
export function renderSearch(root, { date, today, onSearch, bank = 'general' }) {
  root.replaceChildren();
  const iso = date && isValidISO(date) ? date : today;

  const title = el('h2', 'view-title', '¿Se trabaja ese día?');
  title.id = 'view-title';
  title.tabIndex = -1;
  root.append(title);

  const form = el('form', 'search-form');
  form.setAttribute('role', 'search');
  const label = el('label', null, 'Fecha');
  label.htmlFor = 'search-date';
  const input = el('input');
  input.type = 'date';
  input.id = 'search-date';
  input.required = true;
  input.value = iso;
  const submit = el('button', 'primary', 'Buscar');
  submit.type = 'submit';
  form.append(label, input, submit);

  const quick = el('div', 'search-quick');
  quick.setAttribute('aria-label', 'Atajos');
  quick.setAttribute('role', 'group');
  for (const [text, offset] of [['Hoy', 0], ['Mañana', 1], ['En una semana', 7], ['En un mes', 30]]) {
    const b = el('button', null, text);
    b.type = 'button';
    b.addEventListener('click', () => onSearch(addDays(today, offset)));
    quick.append(b);
  }
  form.append(quick);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (isValidISO(input.value)) onSearch(input.value);
  });
  root.append(form);

  const result = el('section', 'search-result');
  result.setAttribute('aria-labelledby', 'search-result-title');
  const h = el('h3', 'search-result-title', capitalize(formatLong(iso)));
  h.id = 'search-result-title';
  h.tabIndex = -1;
  const rel = relativeDays(today, iso);
  h.append(el('span', 'search-rel', ` · ${rel}`));
  result.append(h);
  result.append(dayCard(iso, today, { headingLevel: 'p', bank }));
  result.append(upcomingPanel(iso, today, { bank }));

  const links = el('p', 'search-links');
  const week = el('a', null, 'Ver la semana');
  week.href = `#/semana/${iso}`;
  const month = el('a', null, 'Ver el mes');
  month.href = `#/mes/${iso.slice(0, 7)}`;
  links.append(week, ' · ', month);
  result.append(links);
  root.append(result);
}
