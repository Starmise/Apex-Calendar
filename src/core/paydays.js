// Días de pago (quincenas). Puro: no toca la pantalla ni el almacenamiento.
//
// Reglas (confirmadas por el dueño):
// - La empresa paga el 15 y el 30 de cada mes; en febrero, el último día (28 o 29).
// - Si ese día es festivo, el pago se adelanta un día, y sigue adelantándose
//   mientras el día anterior también sea festivo. Sábados y domingos no cuentan.
// - Con cuenta BBVA el depósito llega un día antes del de la empresa
//   (y también se adelanta si ese día es festivo). Ej.: 30 festivo → empresa 29 → BBVA 28.
// - Diciembre todavía no tiene días de pago (pendiente de revisar la documentación de la empresa).

import { holidayName } from '../data/holidays-mx.js';
import { addDays, daysInMonth, fromParts } from './dates.js';

/** Bancos que cambian el día de pago. 'general' = cualquier banco que no sea BBVA. */
export const BANKS = Object.freeze(['general', 'bbva']);

/** Meses (1–12) sin días de pago por ahora. */
export const MONTHS_WITHOUT_PAYDAY = Object.freeze([12]);

/** Retrocede desde `iso` mientras sea festivo. */
function beforeHolidays(iso) {
  let d = iso;
  while (holidayName(d)) d = addDays(d, -1);
  return d;
}

/**
 * Días de pago de un mes.
 * @param {number} year
 * @param {number} month 1–12
 * @param {{bank?: 'general'|'bbva'}} [opts]
 * @returns {{date: string, quincena: 1|2, nominal: string, moved: boolean}[]}
 *   quincena 1 = la del 15, 2 = la del 30; nominal = el 15 o el 30 (fin de febrero) sin ajustes;
 *   moved = true si el festivo o el banco cambiaron el día.
 */
export function paydaysForMonth(year, month, { bank = 'general' } = {}) {
  if (MONTHS_WITHOUT_PAYDAY.includes(month)) return [];
  const nominals = [fromParts(year, month, 15), fromParts(year, month, Math.min(30, daysInMonth(year, month)))];
  return nominals.map((nominal, i) => {
    let date = beforeHolidays(nominal);
    if (bank === 'bbva') date = beforeHolidays(addDays(date, -1));
    return { date, quincena: i + 1, nominal, moved: date !== nominal };
  });
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

/** Texto para la ficha del día: 'Día de pago: quincena del 15'. */
export function paydayText(p, { bank = 'general' } = {}) {
  const which = p.quincena === 1 ? 'del 15' : Number(p.nominal.slice(8)) === 30 ? 'del 30' : 'de fin de mes';
  const reasons = [];
  if (bank === 'bbva') reasons.push('un día antes por BBVA');
  if (holidayName(p.nominal)) reasons.push(`el ${Number(p.nominal.slice(8))} es festivo`);
  else if (bank !== 'bbva' && p.moved) reasons.push('se adelantó por festivo');
  return `Día de pago: quincena ${which}${reasons.length ? ` (${reasons.join('; ')})` : ''}.`;
}
