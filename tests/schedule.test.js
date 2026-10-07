import { describe, expect, it } from 'vitest';
import { getDayInfo, shortRange, PAY } from '../src/core/schedule.js';
import { holidaysForYear, holidayName } from '../src/data/holidays-mx.js';
import { fromParts, nthWeekday } from '../src/core/dates.js';

// Calendario real de agosto y septiembre 2026 (la imagen de referencia del proyecto).
// Un carácter por día: A = 8–20, B = 8–21, . = descanso.
const REFERENCE = {
  '2026-08': 'B..AAAA.BB....B..AAAA.BB....B..',
  '2026-09': 'AAAA.BB....B..AAAA.BB....B..AA',
};
const CODE = { A: '8–20', B: '8–21', '.': '' };

describe('ciclo de 14 días', () => {
  for (const [ym, days] of Object.entries(REFERENCE)) {
    const [y, m] = ym.split('-').map(Number);
    it(`coincide con la referencia de ${ym} (${days.length} días)`, () => {
      [...days].forEach((code, i) => {
        const info = getDayInfo(fromParts(y, m, i + 1));
        expect(info.type, `${ym}-${i + 1}`).toBe(code === '.' ? 'rest' : 'work');
        expect(shortRange(info), `${ym}-${i + 1}`).toBe(CODE[code]);
      });
    });
  }

  it('se repite cada 14 días hacia adelante y hacia atrás', () => {
    for (const iso of ['2026-08-01', '2026-08-09', '2026-08-12']) {
      const base = getDayInfo(iso);
      for (const offset of [-140, -14, 14, 364, 3640]) {
        const d = new Date(Date.parse(iso) + offset * 86_400_000).toISOString().slice(0, 10);
        expect(getDayInfo(d).type).toBe(base.type);
        expect(getDayInfo(d).cycleIndex).toBe(base.cycleIndex);
      }
    }
  });

  it('calcula las horas del turno', () => {
    expect(getDayInfo('2026-08-04').hours).toBe(12);
    expect(getDayInfo('2026-08-09').hours).toBe(13);
    expect(getDayInfo('2026-08-02').hours).toBe(0);
  });

  it('ejemplos del plan', () => {
    expect(getDayInfo('2026-10-07').type).toBe('rest');
    expect(shortRange(getDayInfo('2026-12-25'))).toBe('8–20');
  });
});

describe('festivos de México', () => {
  it('2026 según la LFT art. 74', () => {
    expect([...holidaysForYear(2026).keys()].sort()).toEqual([
      '2026-01-01', '2026-02-02', '2026-03-16', '2026-05-01',
      '2026-09-16', '2026-11-16', '2026-12-25',
    ]);
  });

  it('lunes móviles de 2027', () => {
    expect(nthWeekday(2027, 2, 1, 1)).toBe('2027-02-01');
    expect(nthWeekday(2027, 3, 1, 3)).toBe('2027-03-15');
    expect(nthWeekday(2027, 11, 1, 3)).toBe('2027-11-15');
  });

  it('1 de octubre solo cada seis años', () => {
    expect(holidayName('2030-10-01')).not.toBeNull();
    expect(holidayName('2026-10-01')).toBeNull();
  });

  it('jornada electoral de 2027 (federal y Querétaro)', () => {
    expect(holidayName('2027-06-06')).toMatch(/Querétaro/);
  });
});

describe('paga', () => {
  it('día normal trabajado = x1', () => {
    expect(getDayInfo('2026-08-04').pay).toBe(PAY.NORMAL);
  });

  it('domingo trabajado = x2', () => {
    const d = getDayInfo('2026-08-09');
    expect(d.isSunday).toBe(true);
    expect(d.pay).toBe(PAY.SUNDAY);
  });

  it('festivo trabajado = x3', () => {
    expect(getDayInfo('2026-09-16').pay).toBe(PAY.HOLIDAY);
    expect(getDayInfo('2026-11-16').pay).toBe(PAY.HOLIDAY);
    expect(getDayInfo('2026-12-25').pay).toBe(PAY.HOLIDAY);
  });

  it('festivo en domingo trabajado = x3, no se acumula', () => {
    const allWork = {
      anchor: '2026-01-01',
      cycle: [{ type: 'work', start: '08:00', end: '20:00' }],
    };
    // 6 jun 2027 es domingo y jornada electoral.
    expect(getDayInfo('2027-06-06', allWork).pay).toBe(PAY.HOLIDAY);
  });

  it('festivo o domingo en descanso = sin paga, pero se marca', () => {
    const d = getDayInfo('2027-01-01');
    expect(d.type).toBe('rest');
    expect(d.holiday).toBe('Año Nuevo');
    expect(d.pay).toBe(0);
    expect(getDayInfo('2026-08-02').pay).toBe(0);
  });
});
