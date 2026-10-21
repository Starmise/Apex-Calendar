// Motor del ciclo: decide qué pasa cualquier día, pasado o futuro.
// No toca la pantalla ni el almacenamiento, para poder probarlo y reutilizarlo en todas las vistas.

import defaultSchedule from '../data/default-schedule.json';
import { holidayName } from '../data/holidays-mx.js';
import { diffDays, mod, weekday } from './dates.js';

export { defaultSchedule };

/**
 * Paga de un día trabajado, en veces el salario diario.
 * - Domingo: salario normal + prima dominical del 25 % (LFT art. 71) = 1.25. No es paga doble.
 * - Festivo: triple (LFT art. 75). Si cae en domingo se queda en x3: la prima dominical
 *   no se suma (decisión del dueño).
 */
export const SUNDAY_PREMIUM = 0.25;
export const PAY = Object.freeze({ NORMAL: 1, SUNDAY: 1 + SUNDAY_PREMIUM, HOLIDAY: 3 });

function hoursBetween(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}

/**
 * Información de un día.
 * @param {string} iso fecha 'YYYY-MM-DD'
 * @param {object} [schedule] { anchor, cycle[] } — por defecto el rol compartido
 * @returns {{date, type: 'work'|'rest', start, end, hours, holiday, isSunday, pay, cycleIndex}}
 *   pay = 0 en descanso; PAY.NORMAL (1), PAY.SUNDAY (1.25) o PAY.HOLIDAY (3) en día trabajado.
 */
export function getDayInfo(iso, schedule = defaultSchedule) {
  const cycleIndex = mod(diffDays(schedule.anchor, iso), schedule.cycle.length);
  const shift = schedule.cycle[cycleIndex];
  const holiday = holidayName(iso);
  const isSunday = weekday(iso) === 0;
  const working = shift.type === 'work';

  let pay = 0;
  if (working) pay = holiday ? PAY.HOLIDAY : isSunday ? PAY.SUNDAY : PAY.NORMAL;

  return {
    date: iso,
    type: shift.type,
    start: working ? shift.start : null,
    end: working ? shift.end : null,
    hours: working ? hoursBetween(shift.start, shift.end) : 0,
    holiday,
    isSunday,
    pay,
    cycleIndex,
  };
}

/** "08:00"–"20:00" → "8–20" (formato corto de la celda). */
export function shortRange(info) {
  if (info.type !== 'work') return '';
  const h = (t) => String(Number(t.split(':')[0])) + (t.endsWith(':00') ? '' : `:${t.split(':')[1]}`);
  return `${h(info.start)}–${h(info.end)}`;
}
