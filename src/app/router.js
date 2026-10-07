// Rutas por hash. Funciones puras: no tocan `location` ni el DOM, para poder probarlas.
//
//   #/mes/2026-08          vista mes
//   #/semana/2026-08-02    vista semana (se normaliza al domingo)
//   #/dia/2026-08-04       vista día
//
// Cualquier ruta desconocida o fecha inválida cae en el mes de hoy.

import { addDays, addMonths, isValidISO, startOfMonth, startOfWeek } from '../core/dates.js';

/** Vistas de calendario: tienen fecha y se pueden recorrer con anterior/siguiente. */
export const CALENDAR_VIEWS = ['mes', 'semana', 'dia'];

/** Fecha canónica de cada vista (mes → día 1, semana → domingo). */
function normalize(view, iso) {
  if (view === 'mes') return startOfMonth(iso);
  if (view === 'semana') return startOfWeek(iso);
  return iso;
}

/**
 * '#/semana/2026-08-05' → { view: 'semana', date: '2026-08-02' }
 * @param {string} hash  location.hash
 * @param {string} today 'YYYY-MM-DD' (fecha local del usuario)
 */
export function parseRoute(hash, today) {
  const fallback = { view: 'mes', date: startOfMonth(today) };
  const m = String(hash || '').match(/^#\/([a-z]+)(?:\/([\d-]+))?\/?$/);
  if (!m) return fallback;
  const [, view, param] = m;

  if (!CALENDAR_VIEWS.includes(view)) return fallback;

  let iso = param;
  if (view === 'mes' && /^\d{4}-\d{2}$/.test(param || '')) iso = `${param}-01`;
  if (iso == null) iso = today;
  if (!isValidISO(iso)) return fallback;
  return { view, date: normalize(view, iso) };
}

/** { view, date } → hash canónico. */
export function routeHash({ view, date }) {
  if (view === 'mes') return `#/mes/${date.slice(0, 7)}`;
  return `#/${view}/${date}`;
}

/** Ruta de la vista `view` que contiene la fecha `iso`. */
export function routeFor(view, iso) {
  return { view, date: normalize(view, iso) };
}

/** Periodo anterior (-1) o siguiente (+1) de una vista de calendario. */
export function shiftRoute(route, delta) {
  const { view, date } = route;
  if (view === 'mes') return { view, date: addMonths(date, delta) };
  if (view === 'semana') return { view, date: addDays(date, 7 * delta) };
  if (view === 'dia') return { view, date: addDays(date, delta) };
  return route;
}

/**
 * Fecha "de trabajo" al cambiar de vista: si hoy cae dentro del periodo que se ve, se usa hoy;
 * si no, el inicio del periodo. Así Mes → Semana abre la semana de hoy cuando tiene sentido.
 */
export function focusDate(route, today) {
  const { view, date } = route;
  if (view === 'mes' && today.slice(0, 7) === date.slice(0, 7)) return today;
  if (view === 'semana' && startOfWeek(today) === date) return today;
  return date;
}
