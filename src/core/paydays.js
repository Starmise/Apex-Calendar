// Días de pago (quincenas y aguinaldo). Puro: no toca la pantalla ni el almacenamiento.
//
// Reglas (confirmadas por el dueño con el calendario de pagos 2026 de la empresa):
// - La empresa paga el 15 y el 30 de cada mes; en febrero, el último día (28 o 29).
// - Si ese día cae en sábado o domingo, se paga el viernes anterior.
// - Si cae en festivo, se adelanta un día. Ambas reglas se repiten hasta llegar a un
//   día hábil (ej.: sábado con viernes festivo → jueves).
// - Con cuenta BBVA el depósito llega un día antes del de la empresa, con las mismas
//   reglas: 30 festivo → empresa 29 → BBVA 28; empresa lunes → BBVA viernes.
// - Diciembre se paga por adelantado y además lleva aguinaldo: las fechas salen de
//   la tabla de src/data/december-paydays.js. Sin datos de ese año → pendiente.

import { holidayName } from '../data/holidays-mx.js';
import { DECEMBER_PAYDAYS } from '../data/december-paydays.js';
import { addDays, daysInMonth, fromParts, weekday, WEEKDAYS_ES } from './dates.js';

/** Bancos que cambian el día de pago. 'general' = cualquier banco que no sea BBVA. */
export const BANKS = Object.freeze(['general', 'bbva']);

const SATURDAY = 6;
const SUNDAY = 0;

function isWeekend(iso) {
  const wd = weekday(iso);
  return wd === SATURDAY || wd === SUNDAY;
}

/** Retrocede desde `iso` hasta un día que no sea sábado, domingo ni festivo. */
export function toBusinessDay(iso) {
  let d = iso;
  while (isWeekend(d) || holidayName(d)) d = addDays(d, -1);
  return d;
}

/** Fecha de BBVA: un día antes de la de la empresa, ya en día hábil. */
function bbvaDate(companyDate) {
  return toBusinessDay(addDays(companyDate, -1));
}

/** Diciembre: fechas publicadas por la empresa, o null si ese año no está. */
function decemberPaydays(year) {
  const data = DECEMBER_PAYDAYS[year];
  if (!data) return null;
  const list = [];
  if (data.aguinaldo) {
    list.push({ date: data.aguinaldo, kind: 'aguinaldo', quincena: null, nominal: data.aguinaldo });
  }
  data.quincenas.forEach((date, i) => {
    list.push({ date, kind: 'quincena', quincena: i + 1, nominal: fromParts(year, 12, i === 0 ? 15 : 30) });
  });
  return list;
}

/**
 * Días de pago de un mes, ordenados por fecha.
 * @param {number} year
 * @param {number} month 1–12
 * @param {{bank?: 'general'|'bbva'}} [opts]
 * @returns {{date: string, kind: 'quincena'|'aguinaldo', quincena: 1|2|null, nominal: string, moved: boolean}[]}
 *   quincena 1 = la del 15, 2 = la del 30 (null en el aguinaldo); nominal = el 15 o el 30
 *   (fin de febrero) sin ajustes; moved = true si fin de semana, festivo, diciembre o el banco
 *   cambiaron el día. Diciembre sin datos de ese año → [].
 */
export function paydaysForMonth(year, month, { bank = 'general' } = {}) {
  let list;
  if (month === 12) {
    list = decemberPaydays(year);
    if (!list) return [];
  } else {
    list = [15, Math.min(30, daysInMonth(year, month))].map((day, i) => {
      const nominal = fromParts(year, month, day);
      return { date: toBusinessDay(nominal), kind: 'quincena', quincena: i + 1, nominal };
    });
  }
  return list
    .map((p) => {
      const date = bank === 'bbva' ? bbvaDate(p.date) : p.date;
      return { ...p, date, moved: date !== p.nominal };
    })
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Día de pago que cae en `iso`, o null. */
export function paydayOn(iso, opts) {
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  return paydaysForMonth(year, month, opts).find((p) => p.date === iso) ?? null;
}

/**
 * Próximo día de pago después de `iso` (o el mismo día si `includeStart`).
 * Busca hasta dos años adelante, como el resto del buscador.
 */
export function nextPayday(iso, { bank = 'general', includeStart = false } = {}) {
  let year = Number(iso.slice(0, 4));
  let month = Number(iso.slice(5, 7));
  for (let i = 0; i < 25; i++) {
    for (const p of paydaysForMonth(year, month, { bank })) {
      if (p.date > iso || (includeStart && p.date === iso)) return p;
    }
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return null;
}

/** Nombre corto del pago: 'aguinaldo' / 'quincena del 15' / 'quincena de fin de mes'. */
export function paydayName(p) {
  if (p.kind === 'aguinaldo') return 'aguinaldo';
  if (p.quincena === 1) return 'quincena del 15';
  return Number(p.nominal.slice(8)) === 30 ? 'quincena del 30' : 'quincena de fin de mes';
}

/** Texto para la ficha del día: 'Día de pago: quincena del 15 (el 15 cae en domingo).' */
export function paydayText(p, { bank = 'general' } = {}) {
  const reasons = [];
  if (bank === 'bbva') reasons.push('un día antes por BBVA');
  if (p.kind === 'aguinaldo') {
    return `Pago de aguinaldo${reasons.length ? ` (${reasons.join('; ')})` : ''}.`;
  }
  const day = Number(p.nominal.slice(8));
  if (p.nominal.slice(5, 7) === '12') reasons.push('en diciembre se paga por adelantado');
  else if (holidayName(p.nominal)) reasons.push(`el ${day} es festivo`);
  else if (isWeekend(p.nominal)) reasons.push(`el ${day} cae en ${WEEKDAYS_ES[weekday(p.nominal)]}`);
  else if (bank !== 'bbva' && p.moved) reasons.push('se adelantó por festivo');
  return `Día de pago: ${paydayName(p)}${reasons.length ? ` (${reasons.join('; ')})` : ''}.`;
}
