// Días de descanso obligatorio en México (Ley Federal del Trabajo, art. 74).
// En Apex Calendar NO son días libres: si el turno cae en festivo se trabaja con paga x3.
//
// Los festivos con regla fija se calculan por año, así no hay que actualizarlos.
// Las jornadas electorales ordinarias (federales y de Querétaro) se agregan a mano
// en MANUAL_HOLIDAYS cuando se conozca la fecha.

import { fromParts, nthWeekday } from '../core/dates.js';

/** Fechas que no siguen una regla anual. Formato: 'YYYY-MM-DD': 'Nombre'. */
export const MANUAL_HOLIDAYS = {
  '2027-06-06': 'Jornada electoral federal y local (Querétaro)',
};

const MONDAY = 1;

/** Map 'YYYY-MM-DD' → nombre del festivo, para un año. */
export function holidaysForYear(year) {
  const list = [
    [fromParts(year, 1, 1), 'Año Nuevo'],
    [nthWeekday(year, 2, MONDAY, 1), 'Día de la Constitución'],
    [nthWeekday(year, 3, MONDAY, 3), 'Natalicio de Benito Juárez'],
    [fromParts(year, 5, 1), 'Día del Trabajo'],
    [fromParts(year, 9, 16), 'Día de la Independencia'],
    [nthWeekday(year, 11, MONDAY, 3), 'Día de la Revolución'],
    [fromParts(year, 12, 25), 'Navidad'],
  ];
  // 1 de octubre cada seis años: transmisión del Poder Ejecutivo Federal (2024, 2030, …).
  if (year >= 2024 && (year - 2024) % 6 === 0) {
    list.push([fromParts(year, 10, 1), 'Transmisión del Poder Ejecutivo Federal']);
  }
  for (const [iso, name] of Object.entries(MANUAL_HOLIDAYS)) {
    if (iso.startsWith(`${year}-`)) list.push([iso, name]);
  }
  return new Map(list);
}

const cache = new Map();

/** Nombre del festivo de esa fecha, o null. */
export function holidayName(iso) {
  const year = Number(iso.slice(0, 4));
  if (!cache.has(year)) cache.set(year, holidaysForYear(year));
  return cache.get(year).get(iso) ?? null;
}
