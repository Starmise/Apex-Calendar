import { describe, expect, it } from 'vitest';
import {
  findNext, nextFreeWeekend, nextHoliday, nextRest, nextRestOnWeekday, nextWork, relativeDays, streak,
} from '../src/core/search.js';

// Rol: Semana A (desde dom 2026-08-02) Dom D, Lun D, Mar–Vie 8–20, Sáb D;
//      Semana B Dom 8–21, Lun 8–21, Mar–Vie D, Sáb 8–21.

describe('próximos días', () => {
  it('próximo descanso y próximo día de trabajo', () => {
    expect(nextRest('2026-08-04')).toBe('2026-08-08'); // mar A → sáb A
    expect(nextWork('2026-08-08')).toBe('2026-08-09'); // sáb A → dom B
    expect(nextWork('2026-10-07')).toBe('2026-10-10'); // mié B → sáb B
  });

  it('no incluye el día de inicio salvo que se pida', () => {
    expect(nextRest('2026-08-02')).toBe('2026-08-03');
    expect(findNext('2026-08-02', (d) => d.type === 'rest', { includeStart: true })).toBe('2026-08-02');
  });

  it('próximo festivo, trabajado o no', () => {
    const h = nextHoliday('2026-10-07');
    expect(h.date).toBe('2026-11-16');
    expect(h.holiday).toBe('Día de la Revolución');
    expect(h.type).toBe('work');
    expect(nextHoliday('2026-12-26').date).toBe('2027-01-01');
  });

  it('sábado y domingo libres por separado', () => {
    expect(nextRestOnWeekday('2026-10-07', 6)).toBe('2026-10-17');
    expect(nextRestOnWeekday('2026-10-07', 0)).toBe('2026-10-11');
  });
});

describe('fin de semana libre', () => {
  it('el rol actual nunca tiene sábado y domingo libres seguidos', () => {
    expect(nextFreeWeekend('2026-10-07')).toBeNull();
  });

  it('con un rol que sí los tiene, encuentra el siguiente', () => {
    const weekdaysOnly = {
      anchor: '2026-08-02', // domingo
      cycle: [
        { type: 'rest' },
        ...Array.from({ length: 5 }, () => ({ type: 'work', start: '09:00', end: '17:00' })),
        { type: 'rest' },
      ],
    };
    expect(nextFreeWeekend('2026-10-07', { schedule: weekdaysOnly })).toEqual({
      saturday: '2026-10-10',
      sunday: '2026-10-11',
    });
    // Si hoy es sábado libre, cuenta este fin de semana.
    expect(nextFreeWeekend('2026-10-10', { schedule: weekdaysOnly }).saturday).toBe('2026-10-10');
  });
});

describe('bloques y textos', () => {
  it('descanso de 4 días seguidos en semana B', () => {
    expect(streak('2026-10-07')).toEqual({ type: 'rest', start: '2026-10-06', end: '2026-10-09', length: 4 });
  });

  it('bloque de trabajo de 4 días en semana A', () => {
    expect(streak('2026-08-05')).toEqual({ type: 'work', start: '2026-08-04', end: '2026-08-07', length: 4 });
  });

  it('días relativos', () => {
    expect(relativeDays('2026-10-07', '2026-10-07')).toBe('hoy');
    expect(relativeDays('2026-10-07', '2026-10-08')).toBe('mañana');
    expect(relativeDays('2026-10-07', '2026-10-12')).toBe('en 5 días');
    expect(relativeDays('2026-10-07', '2026-10-04')).toBe('hace 3 días');
  });
});
