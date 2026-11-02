import { describe, expect, it } from 'vitest';
import { nextPayday, paydayOn, paydaysForMonth, paydayText } from '../src/core/paydays.js';
import { MANUAL_HOLIDAYS } from '../src/data/holidays-mx.js';
import { DECEMBER_PAYDAYS } from '../src/data/december-paydays.js';
import { paydaySummary } from '../src/views/month.js';

const dates = (y, m, opts) => paydaysForMonth(y, m, opts).map((p) => p.date);

// Calendario de pagos 2026 de la empresa (captura que compartió el dueño; sin cuenta BBVA).
// Si una de estas fechas falla, el error está en el código, no en la referencia.
const REFERENCE_2026 = {
  1: ['2026-01-15', '2026-01-30'],
  2: ['2026-02-13', '2026-02-27'], // 15 domingo → viernes 13; 28 sábado → viernes 27
  3: ['2026-03-13', '2026-03-30'], // 15 domingo → viernes 13
  4: ['2026-04-15', '2026-04-30'],
  5: ['2026-05-15', '2026-05-29'], // 30 sábado → viernes 29
  6: ['2026-06-15', '2026-06-30'],
  7: ['2026-07-15', '2026-07-30'],
  8: ['2026-08-14', '2026-08-28'], // 15 sábado y 30 domingo → viernes
  9: ['2026-09-15', '2026-09-30'],
  10: ['2026-10-15', '2026-10-30'],
  11: ['2026-11-13', '2026-11-30'], // 15 domingo → viernes 13
  12: ['2026-12-04', '2026-12-11', '2026-12-18'], // aguinaldo + quincenas adelantadas
};

describe('días de pago', () => {
  it('coincide con el calendario de pagos 2026 de la empresa', () => {
    for (const [month, expected] of Object.entries(REFERENCE_2026)) {
      expect(dates(2026, Number(month)), `mes ${month}`).toEqual(expected);
    }
  });

  it('15 y 30; con BBVA un día antes', () => {
    expect(dates(2026, 10)).toEqual(['2026-10-15', '2026-10-30']);
    expect(dates(2026, 10, { bank: 'bbva' })).toEqual(['2026-10-14', '2026-10-29']);
  });

  it('meses de 31 días pagan el 30, no el 31', () => {
    expect(dates(2027, 4)).toEqual(['2027-04-15', '2027-04-30']);
  });

  it('sábado o domingo → viernes anterior (también en enero 2027: 30 sábado)', () => {
    expect(dates(2027, 1)).toEqual(['2027-01-15', '2027-01-29']);
    expect(dates(2027, 8)).toEqual(['2027-08-13', '2027-08-30']); // 15 domingo
  });

  it('febrero paga el último día (28 o 29 en bisiesto), o el viernes anterior', () => {
    expect(dates(2027, 2)).toEqual(['2027-02-15', '2027-02-26']); // 28 domingo
    expect(dates(2028, 2)).toEqual(['2028-02-15', '2028-02-29']); // 29 martes
    expect(dates(2028, 2, { bank: 'bbva' })).toEqual(['2028-02-14', '2028-02-28']);
  });

  it('BBVA: si el día anterior es fin de semana, cobra el viernes', () => {
    // 30 mar 2026 es lunes → BBVA viernes 27; 15 jun 2026 lunes → viernes 12.
    expect(dates(2026, 3, { bank: 'bbva' })).toEqual(['2026-03-12', '2026-03-27']);
    expect(dates(2026, 6, { bank: 'bbva' })).toEqual(['2026-06-12', '2026-06-29']);
    expect(dates(2026, 11, { bank: 'bbva' })).toEqual(['2026-11-12', '2026-11-27']);
  });

  it('si el 15 es festivo se adelanta un día hábil (y BBVA uno más)', () => {
    // 15 mar 2027 = natalicio de Benito Juárez (lunes) → viernes 12.
    expect(dates(2027, 3)).toEqual(['2027-03-12', '2027-03-30']);
    expect(dates(2027, 3, { bank: 'bbva' })).toEqual(['2027-03-11', '2027-03-29']);
    // 15 nov 2027 = Día de la Revolución (lunes) → viernes 12.
    expect(dates(2027, 11)).toEqual(['2027-11-12', '2027-11-30']);
  });

  it('diciembre usa la tabla de la empresa; BBVA un día hábil antes', () => {
    expect(dates(2026, 12, { bank: 'bbva' })).toEqual(['2026-12-03', '2026-12-10', '2026-12-17']);
    const [bonus, q1, q2] = paydaysForMonth(2026, 12);
    expect(bonus).toMatchObject({ kind: 'aguinaldo', quincena: null });
    expect(q1).toMatchObject({ kind: 'quincena', quincena: 1, nominal: '2026-12-15', moved: true });
    expect(q2).toMatchObject({ kind: 'quincena', quincena: 2, nominal: '2026-12-30', moved: true });
  });

  it('diciembre de un año sin datos queda pendiente', () => {
    expect(DECEMBER_PAYDAYS[2027]).toBeUndefined();
    expect(paydaysForMonth(2027, 12)).toEqual([]);
    expect(paydaySummary(2027, 12, 'general')).toBe('Diciembre: días de pago pendientes de confirmar.');
  });

  it('ejemplo del dueño: BBVA y el 30 festivo → se paga el 28; festivos seguidos encadenan', () => {
    // Festivos inventados en días hábiles de un año sin festivos manuales, solo para la prueba.
    const fake = ['2099-07-30', '2099-04-30', '2099-04-29', '2099-06-12', '2099-01-30'];
    for (const k of fake) MANUAL_HOLIDAYS[k] = 'Prueba';
    try {
      expect(dates(2099, 7)[1]).toBe('2099-07-29'); // jueves 30 festivo → miércoles 29
      expect(dates(2099, 7, { bank: 'bbva' })[1]).toBe('2099-07-28');
      expect(dates(2099, 4)[1]).toBe('2099-04-28'); // jueves 30 y miércoles 29 festivos
      expect(dates(2099, 4, { bank: 'bbva' })[1]).toBe('2099-04-27');
      // Lunes 15 normal; BBVA iría al domingo 14 → viernes 12 festivo → jueves 11.
      expect(dates(2099, 6)[0]).toBe('2099-06-15');
      expect(dates(2099, 6, { bank: 'bbva' })[0]).toBe('2099-06-11');
      // Viernes 30 festivo → jueves 29.
      expect(dates(2099, 1)[1]).toBe('2099-01-29');
    } finally {
      for (const k of fake) delete MANUAL_HOLIDAYS[k];
    }
  });

  it('paydayOn marca solo el día que corresponde a cada banco', () => {
    expect(paydayOn('2026-10-15')).toMatchObject({ quincena: 1, moved: false });
    expect(paydayOn('2026-10-15', { bank: 'bbva' })).toBeNull();
    expect(paydayOn('2026-10-29', { bank: 'bbva' })).toMatchObject({ quincena: 2, moved: true });
    expect(paydayOn('2026-10-16')).toBeNull();
    expect(paydayOn('2026-12-04')).toMatchObject({ kind: 'aguinaldo' });
  });

  it('próximo día de pago incluye diciembre y el aguinaldo', () => {
    expect(nextPayday('2026-10-08').date).toBe('2026-10-15');
    expect(nextPayday('2026-10-15').date).toBe('2026-10-30');
    expect(nextPayday('2026-10-15', { includeStart: true }).date).toBe('2026-10-15');
    expect(nextPayday('2026-11-30')).toMatchObject({ date: '2026-12-04', kind: 'aguinaldo' });
    expect(nextPayday('2026-12-04').date).toBe('2026-12-11');
    expect(nextPayday('2026-12-18').date).toBe('2027-01-15');
    expect(nextPayday('2026-12-17', { bank: 'bbva' }).date).toBe('2027-01-14');
  });

  it('texto explica por qué se movió', () => {
    expect(paydayText(paydayOn('2026-10-15'))).toBe('Día de pago: quincena del 15.');
    expect(paydayText(paydayOn('2026-10-29', { bank: 'bbva' }), { bank: 'bbva' }))
      .toBe('Día de pago: quincena del 30 (un día antes por BBVA).');
    expect(paydayText(paydayOn('2026-11-13'))).toBe('Día de pago: quincena del 15 (el 15 cae en domingo).');
    expect(paydayText(paydayOn('2026-02-27'))).toBe('Día de pago: quincena de fin de mes (el 28 cae en sábado).');
    expect(paydayText(paydayOn('2027-03-12'))).toBe('Día de pago: quincena del 15 (el 15 es festivo).');
    expect(paydayText(paydayOn('2026-12-11'))).toBe('Día de pago: quincena del 15 (en diciembre se paga por adelantado).');
    expect(paydayText(paydayOn('2026-12-04'))).toBe('Pago de aguinaldo.');
    expect(paydayText(paydayOn('2026-12-03', { bank: 'bbva' }), { bank: 'bbva' }))
      .toBe('Pago de aguinaldo (un día antes por BBVA).');
  });

  it('resumen del mes', () => {
    expect(paydaySummary(2026, 12, 'general')).toBe('Días de pago: 11 y 18 · aguinaldo: 4.');
    expect(paydaySummary(2026, 8, 'bbva')).toBe('Días de pago: 13 y 27 (cuenta BBVA).');
  });
});
