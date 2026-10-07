// Búsquedas sobre el rol: próximo descanso, próximo fin de semana libre, etc.
// Puro (sin DOM ni almacenamiento). Todas las búsquedas tienen un límite de días
// para no quedarse en un ciclo infinito si un rol nunca cumple la condición.

import { getDayInfo, defaultSchedule } from './schedule.js';
import { addDays, diffDays, weekday } from './dates.js';

/** Horizonte de búsqueda por defecto: 2 años. */
export const SEARCH_LIMIT = 730;

/**
 * Primera fecha a partir de `from` (sin incluirlo, salvo `includeStart`) que cumple `test(info)`.
 * @returns {string|null}
 */
export function findNext(from, test, { includeStart = false, limit = SEARCH_LIMIT, schedule = defaultSchedule } = {}) {
  for (let i = includeStart ? 0 : 1; i <= limit; i++) {
    const iso = addDays(from, i);
    if (test(getDayInfo(iso, schedule))) return iso;
  }
  return null;
}

export const nextRest = (from, opts) => findNext(from, (d) => d.type === 'rest', opts);
export const nextWork = (from, opts) => findNext(from, (d) => d.type === 'work', opts);

/** Próximo festivo (trabajado o no) después de `from`. */
export function nextHoliday(from, opts) {
  const iso = findNext(from, (d) => d.holiday != null, opts);
  return iso ? getDayInfo(iso, opts?.schedule) : null;
}

/** Próximo día de la semana `wd` (0 = domingo) que sea descanso. */
export function nextRestOnWeekday(from, wd, opts) {
  return findNext(from, (d) => d.type === 'rest' && weekday(d.date) === wd, opts);
}

/**
 * Próximo fin de semana libre completo: sábado y domingo siguiente, los dos de descanso.
 * Incluye el fin de semana en curso si `from` es ese sábado.
 * @returns {{saturday: string, sunday: string}|null} null si no hay ninguno en el horizonte.
 */
export function nextFreeWeekend(from, { limit = SEARCH_LIMIT, schedule = defaultSchedule } = {}) {
  let saturday = addDays(from, (6 - weekday(from) + 7) % 7);
  while (diffDays(from, saturday) <= limit) {
    const sunday = addDays(saturday, 1);
    if (getDayInfo(saturday, schedule).type === 'rest' && getDayInfo(sunday, schedule).type === 'rest') {
      return { saturday, sunday };
    }
    saturday = addDays(saturday, 7);
  }
  return null;
}

/**
 * Bloque de días seguidos del mismo tipo que contiene `iso`.
 * @returns {{type: 'work'|'rest', start: string, end: string, length: number}}
 */
export function streak(iso, { schedule = defaultSchedule, limit = 60 } = {}) {
  const type = getDayInfo(iso, schedule).type;
  let start = iso;
  let end = iso;
  for (let i = 0; i < limit && getDayInfo(addDays(start, -1), schedule).type === type; i++) start = addDays(start, -1);
  for (let i = 0; i < limit && getDayInfo(addDays(end, 1), schedule).type === type; i++) end = addDays(end, 1);
  return { type, start, end, length: diffDays(start, end) + 1 };
}

/** 'hoy', 'mañana', 'ayer', 'en 5 días', 'hace 3 días' */
export function relativeDays(from, to) {
  const n = diffDays(from, to);
  if (n === 0) return 'hoy';
  if (n === 1) return 'mañana';
  if (n === -1) return 'ayer';
  if (n === 2) return 'pasado mañana';
  return n > 0 ? `en ${n} días` : `hace ${-n} días`;
}
