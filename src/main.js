// Arranque de la app y router por hash: #/mes/2026-08, #/semana/2026-08-02, #/dia/2026-08-04
import './styles/themes.css';
import './styles/base.css';
import { renderMonth } from './views/month.js';
import { renderWeek } from './views/week.js';
import { renderDay } from './views/day.js';
import { addDays, todayISO } from './core/dates.js';
import { CALENDAR_VIEWS, focusDate, parseRoute, routeFor, routeHash, shiftRoute } from './app/router.js';

const view = document.getElementById('view');
const toolbar = document.getElementById('toolbar');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const todayBtn = document.getElementById('today');
const tabs = [...document.querySelectorAll('.tabs a[data-view]')];
document.getElementById('version').textContent = `v${__APP_VERSION__}`;

const PERIOD = {
  mes: ['Mes anterior', 'Mes siguiente'],
  semana: ['Semana anterior', 'Semana siguiente'],
  dia: ['Día anterior', 'Día siguiente'],
};

/** Día que recibe el foco del teclado tras renderizar (navegación con flechas). */
let pendingFocus = null;
/** Si el próximo render vino de una acción del usuario, el foco va al título de la vista. */
let moveFocus = false;

const today = () => todayISO();
const current = () => parseRoute(location.hash, today());

function go(route, { focusDay = null } = {}) {
  pendingFocus = focusDay;
  moveFocus = true;
  const hash = routeHash(route);
  if (location.hash === hash) render();
  else location.hash = hash;
}

function render() {
  const t = today();
  const route = current();

  // Hash canónico (p. ej. #/semana/2026-08-05 → #/semana/2026-08-02) sin crear historial.
  const canonical = routeHash(route);
  if (location.hash !== canonical) history.replaceState(null, '', canonical);

  const focus = pendingFocus ?? focusDate(route, t);
  const opts = { date: route.date, today: t, focus };
  if (route.view === 'mes') renderMonth(view, opts);
  if (route.view === 'semana') renderWeek(view, opts);
  if (route.view === 'dia') renderDay(view, opts);

  // Pestañas: conservan la fecha que se está viendo.
  for (const tab of tabs) {
    tab.href = routeHash(routeFor(tab.dataset.view, focus));
    if (tab.dataset.view === route.view) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }

  toolbar.hidden = !CALENDAR_VIEWS.includes(route.view);
  const labels = PERIOD[route.view];
  if (labels) {
    prevBtn.setAttribute('aria-label', labels[0]);
    nextBtn.setAttribute('aria-label', labels[1]);
  }

  document.title = `${view.querySelector('.view-title')?.firstChild?.textContent ?? ''} · Apex Calendar`;

  if (pendingFocus) {
    view.querySelector(`[data-date="${pendingFocus}"]`)?.focus();
  } else if (moveFocus) {
    view.querySelector('.view-title')?.focus();
  }
  pendingFocus = null;
  moveFocus = false;
}

prevBtn.addEventListener('click', () => go(shiftRoute(current(), -1)));
nextBtn.addEventListener('click', () => go(shiftRoute(current(), 1)));
todayBtn.addEventListener('click', () => go(routeFor(current().view, today())));

// Flechas dentro del mes o la semana: mueven el foco de día en día (y cambian de periodo si hace falta).
const STEP = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
const WEEK_STEP = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1 };

view.addEventListener('keydown', (e) => {
  const day = e.target.closest('[data-date]');
  if (!day || e.altKey || e.ctrlKey || e.metaKey) return;
  const route = current();
  let target = null;
  if (route.view === 'mes' && e.key in STEP) target = addDays(day.dataset.date, STEP[e.key]);
  if (route.view === 'semana' && e.key in WEEK_STEP) target = addDays(day.dataset.date, WEEK_STEP[e.key]);
  if (e.key === 'Home') target = view.querySelector('[data-date]')?.dataset.date;
  if (e.key === 'End') target = [...view.querySelectorAll('[data-date]')].pop()?.dataset.date;
  if (e.key === 'PageUp' || e.key === 'PageDown') {
    const next = shiftRoute(route, e.key === 'PageUp' ? -1 : 1);
    e.preventDefault();
    go(next, { focusDay: next.date });
    return;
  }
  if (!target) return;
  e.preventDefault();
  const link = view.querySelector(`[data-date="${target}"]`);
  if (link) {
    day.tabIndex = -1;
    link.tabIndex = 0;
    link.focus();
  } else {
    go(routeFor(route.view, target), { focusDay: target });
  }
});

// Fuera de la cuadrícula, ← y → cambian de periodo.
document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.target.closest('input, textarea, select, button, [contenteditable], [data-date], dialog')) return;
  if (!CALENDAR_VIEWS.includes(current().view)) return;
  if (e.key === 'ArrowLeft') go(shiftRoute(current(), -1));
  if (e.key === 'ArrowRight') go(shiftRoute(current(), 1));
});

window.addEventListener('hashchange', () => {
  moveFocus = true;
  render();
});

render();
