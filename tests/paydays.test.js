import { describe, expect, it } from 'vitest';
import { nextPayday, paydayOn, paydaysForMonth, paydayText } from '../src/core/paydays.js';
import { MANUAL_HOLIDAYS } from '../src/data/holidays-mx.js';

const dates = (y, m, opts) => paydaysForMonth(y, m, opts).map((p) => p.date);

describe('días de pago', () => {
  it('15 y 30; con BBVA un día antes', () => {
    expect(dates(2026, 10)).toEqual(['2026-10-15', '2026-10-30']);
    expect(dates(2026, 10, { bank: 'bbva' })).toEqual(['2026-10-14', '2026-10-29']);
  });

  it('meses de 31 días pagan el 30, no el 31', () => {
    expect(dates(2027, 1)).toEqual(['2027-01-15', '2027-01-30']);
  });

  it('febrero paga el último día (28 o 29 en bisiesto)', () => {
    expect(dates(2027, 2)).toEqual(['2027-02-15', '2027-02-28']);
    expect(dates(2027, 2, { bank: 'bbva' })).toEqual(['2027-02-14', '2027-02-27']);
    expect(dates(2028, 2)).toEqual(['2028-02-15', '2028-02-29']);
    expect(dates(2028, 2, { bank: 'bbva' })).toEqual(['2028-02-14', '2028-02-28']);
  });

  it('si el 15 es festivo se adelanta un día (y BBVA uno más)', () => {
    // 15 mar 2027 = natalicio de Benito Juárez; 15 nov 2027 = Día de la Revolución.
    expect(dates(2027, 3)).toEqual(['2027-03-14', '2027-03-30']);
    expect(dates(2027, 3, { bank: 'bbva' })).toEqual(['2027-03-13', '2027-03-29']);
    expect(dates(2027, 11)).toEqual(['2027-11-14', '2027-11-30']);
    expect(dates(2027, 11, { bank: 'bbva' })).toEqual(['2027-11-13', '2027-11-29']);
  });

  it('sábados y domingos no adelantan el pago', () => {
    // 15 ago 2026 es sábado; 30 ago 2026 es domingo.
    expect(dates(2026, 8)).toEqual(['2026-08-15', '2026-08-30']);
  });

  it('diciembre todavía no tiene días de pago', () => {
    expect(paydaysForMonth(2026, 12)).toEqual([]);
    expect(paydaysForMonth(2026, 12, { bank: 'bbva' })).toEqual([]);
  });

  it('ejemplo del dueño: BBVA y el 30 festivo → se paga el 28; festivos seguidos encadenan', () => {
    // Festivos inventados en un año sin festivos manuales, solo para la prueba.
    MANUAL_HOLIDAYS['2099-07-30'] = 'Prueba';
    MANUAL_HOLIDAYS['2099-04-30'] = 'Prueba';
    MANUAL_HOLIDAYS['2099-04-29'] = 'Prueba';
    MANUAL_HOLIDAYS['2099-06-14'] = 'Prueba';
    try {
      expect(dates(2099, 7)[1]).toBe('2099-07-29');
      expect(dates(2099, 7, { bank: 'bbva' })[1]).toBe('2099-07-28');
      expect(dates(2099, 4)[1]).toBe('2099-04-28');
      expect(dates(2099, 4, { bank: 'bbva' })[1]).toBe('2099-04-27');
      // El 15 no es festivo pero el día de BBVA (14) sí: BBVA cobra el 13.
      expect(dates(2099, 6)[0]).toBe('2099-06-15');
      expect(dates(2099, 6, { bank: 'bbva' })[0]).toBe('2099-06-13');
    } finally {
      for (const k of ['2099-07-30', '2099-04-30', '2099-04-29', '2099-06-14']) delete MANUAL_HOLIDAYS[k];
    }
  });

  it('paydayOn marca solo el día que corresponde a cada banco', () => {
    expect(paydayOn('2026-10-15')).toMatchObject({ quincena: 1, moved: false });
    expect(paydayOn('2026-10-15', { bank: 'bbva' })).toBeNull();
    expect(paydayOn('2026-10-29', { bank: 'bbva' })).toMatchObject({ quincena: 2, moved: true });
    expect(paydayOn('2026-10-16')).toBeNull();
  });

  it('próximo día de pago salta diciembre', () => {
    expect(nextPayday('2026-10-08').date).toBe('2026-10-15');
    expect(nextPayday('2026-10-15').date).toBe('2026-10-30');
    expect(nextPayday('2026-10-15', { includeStart: true }).date).toBe('2026-10-15');
    expect(nextPayday('2026-11-30').date).toBe('2027-01-15');
    expect(nextPayday('2026-11-29', { bank: 'bbva' }).date).toBe('2027-01-14');
  });

  it('texto explica por qué se movió', () => {
    expect(paydayText(paydayOn('2026-10-15'))).toBe('Día de pago: quincena del 15.');
    expect(paydayText(paydayOn('2026-10-29', { bank: 'bbva' }), { bank: 'bbva' }))
      .toBe('Día de pago: quincena del 30 (un día antes por BBVA).');
    expect(paydayText(paydayOn('2027-03-14'))).toBe('Día de pago: quincena del 15 (el 15 es festivo).');
    expect(paydayText(paydayOn('2027-02-28'))).toBe('Día de pago: quincena de fin de mes.');
  });
});
