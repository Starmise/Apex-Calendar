import { describe, expect, it } from 'vitest';
import { focusDate, parseRoute, routeFor, routeHash, shiftRoute } from '../src/app/router.js';
import { addMonths, formatLong, isValidISO, startOfWeek } from '../src/core/dates.js';

const TODAY = '2026-10-07'; // miércoles

describe('fechas', () => {
  it('valida fechas reales', () => {
    expect(isValidISO('2026-02-28')).toBe(true);
    expect(isValidISO('2028-02-29')).toBe(true);
    expect(isValidISO('2026-02-29')).toBe(false);
    expect(isValidISO('2026-13-01')).toBe(false);
    expect(isValidISO('hola')).toBe(false);
  });

  it('semana de domingo a sábado', () => {
    expect(startOfWeek('2026-10-07')).toBe('2026-10-04');
    expect(startOfWeek('2026-10-04')).toBe('2026-10-04');
    expect(startOfWeek('2026-10-10')).toBe('2026-10-04');
    expect(startOfWeek('2027-01-01')).toBe('2026-12-27');
  });

  it('suma meses sin desbordar', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-12-01', 1)).toBe('2027-01-01');
    expect(addMonths('2026-01-01', -1)).toBe('2025-12-01');
  });

  it('formato largo en español', () => {
    expect(formatLong('2026-10-07')).toBe('miércoles 7 de octubre de 2026');
    expect(formatLong('2026-10-07', { withYear: false })).toBe('miércoles 7 de octubre');
  });
});

describe('rutas', () => {
  it('sin hash o desconocida → mes de hoy', () => {
    expect(parseRoute('', TODAY)).toEqual({ view: 'mes', date: '2026-10-01' });
    expect(parseRoute('#/', TODAY)).toEqual({ view: 'mes', date: '2026-10-01' });
    expect(parseRoute('#/nada', TODAY)).toEqual({ view: 'mes', date: '2026-10-01' });
  });

  it('mes, semana y día', () => {
    expect(parseRoute('#/mes/2026-08', TODAY)).toEqual({ view: 'mes', date: '2026-08-01' });
    expect(parseRoute('#/semana/2026-08-05', TODAY)).toEqual({ view: 'semana', date: '2026-08-02' });
    expect(parseRoute('#/dia/2026-12-25', TODAY)).toEqual({ view: 'dia', date: '2026-12-25' });
  });

  it('vista sin fecha → la de hoy', () => {
    expect(parseRoute('#/semana', TODAY)).toEqual({ view: 'semana', date: '2026-10-04' });
    expect(parseRoute('#/dia', TODAY)).toEqual({ view: 'dia', date: TODAY });
  });

  it('fechas inválidas → mes de hoy', () => {
    expect(parseRoute('#/dia/2026-02-30', TODAY).view).toBe('mes');
    expect(parseRoute('#/mes/2026-13', TODAY).view).toBe('mes');
  });

  it('hash canónico', () => {
    expect(routeHash({ view: 'mes', date: '2026-08-01' })).toBe('#/mes/2026-08');
    expect(routeHash(routeFor('semana', '2026-10-07'))).toBe('#/semana/2026-10-04');
    expect(routeHash(routeFor('dia', '2026-10-07'))).toBe('#/dia/2026-10-07');
  });

  it('anterior / siguiente', () => {
    expect(shiftRoute({ view: 'mes', date: '2026-12-01' }, 1).date).toBe('2027-01-01');
    expect(shiftRoute({ view: 'semana', date: '2026-10-04' }, -1).date).toBe('2026-09-27');
    expect(shiftRoute({ view: 'dia', date: '2026-12-31' }, 1).date).toBe('2027-01-01');
  });

  it('al cambiar de vista conserva hoy si está a la vista', () => {
    expect(focusDate({ view: 'mes', date: '2026-10-01' }, TODAY)).toBe(TODAY);
    expect(focusDate({ view: 'mes', date: '2026-08-01' }, TODAY)).toBe('2026-08-01');
    expect(focusDate({ view: 'semana', date: '2026-10-04' }, TODAY)).toBe(TODAY);
  });
});

describe('rutas del buscador', () => {
  it('con y sin fecha', () => {
    expect(parseRoute('#/buscar', TODAY)).toEqual({ view: 'buscar', date: null });
    expect(parseRoute('#/buscar/2026-12-25', TODAY)).toEqual({ view: 'buscar', date: '2026-12-25' });
    expect(parseRoute('#/buscar/2026-02-31', TODAY)).toEqual({ view: 'buscar', date: null });
    expect(routeHash({ view: 'buscar', date: null })).toBe('#/buscar');
    expect(routeHash(routeFor('buscar', '2026-12-25'))).toBe('#/buscar/2026-12-25');
  });
});
