import { describe, expect, it } from 'vitest';
import {
  buildBackup, mergeReminders, nextOccurrence, normalizeReminder, normalizeReminders, occursOn,
  parseBackup, remindersOn, upcoming,
} from '../src/core/reminders.js';

const r = (over) => normalizeReminder({ id: 'a', date: '2026-10-07', text: 'Pagar luz', ...over });

describe('validación', () => {
  it('requiere texto y fecha real', () => {
    expect(normalizeReminder({ date: '2026-10-07', text: '  ' })).toBeNull();
    expect(normalizeReminder({ date: '2026-02-30', text: 'x' })).toBeNull();
    expect(normalizeReminder(null)).toBeNull();
  });

  it('completa y limpia campos', () => {
    const x = normalizeReminder({ date: '2026-10-07', text: '  Hola ', time: '25:00', repeat: 'diario', notify: true });
    expect(x).toMatchObject({ date: '2026-10-07', text: 'Hola', time: null, repeat: 'none', notify: false });
    expect(typeof x.id).toBe('string');
  });

  it('notificar solo si tiene hora', () => {
    expect(r({ time: '07:30', notify: true }).notify).toBe(true);
    expect(r({ notify: true }).notify).toBe(false);
  });

  it('quita ids repetidos', () => {
    expect(normalizeReminders([r({}), r({ text: 'otro' }), { nada: 1 }])).toHaveLength(1);
  });
});

describe('repeticiones', () => {
  it('una vez', () => {
    expect(occursOn(r({}), '2026-10-07')).toBe(true);
    expect(occursOn(r({}), '2026-10-14')).toBe(false);
  });

  it('cada semana y cada 14 días, nunca antes del inicio', () => {
    expect(occursOn(r({ repeat: 'weekly' }), '2026-10-14')).toBe(true);
    expect(occursOn(r({ repeat: 'weekly' }), '2026-09-30')).toBe(false);
    expect(occursOn(r({ repeat: 'cycle' }), '2026-10-14')).toBe(false);
    expect(occursOn(r({ repeat: 'cycle' }), '2026-10-21')).toBe(true);
  });

  it('cada mes: el 31 cae en el último día de los meses cortos', () => {
    const m = r({ date: '2026-01-31', repeat: 'monthly' });
    expect(occursOn(m, '2026-02-28')).toBe(true);
    expect(occursOn(m, '2026-04-30')).toBe(true);
    expect(occursOn(m, '2026-05-31')).toBe(true);
    expect(occursOn(m, '2026-05-30')).toBe(false);
  });

  it('cada año: 29 de febrero → 28 en años no bisiestos', () => {
    const y = r({ date: '2028-02-29', repeat: 'yearly' });
    expect(occursOn(y, '2029-02-28')).toBe(true);
    expect(occursOn(y, '2032-02-29')).toBe(true);
    expect(occursOn(y, '2032-02-28')).toBe(false);
  });

  it('próxima aparición', () => {
    expect(nextOccurrence(r({ repeat: 'weekly' }), '2026-10-08')).toBe('2026-10-14');
    expect(nextOccurrence(r({ repeat: 'cycle' }), '2026-10-22')).toBe('2026-11-04');
    expect(nextOccurrence(r({}), '2026-10-08')).toBeNull();
    expect(nextOccurrence(r({ date: '2026-12-01' }), '2026-10-08')).toBe('2026-12-01');
    expect(nextOccurrence(r({ date: '2026-01-31', repeat: 'monthly' }), '2026-02-01')).toBe('2026-02-28');
  });
});

describe('listas', () => {
  it('ordena: todo el día primero, luego por hora', () => {
    const list = [r({ id: '1', time: '09:00', text: 'b' }), r({ id: '2', text: 'z' }), r({ id: '3', time: '07:00' })];
    expect(remindersOn(list, '2026-10-07').map((x) => x.id)).toEqual(['2', '3', '1']);
  });

  it('próximos días', () => {
    const list = [r({ repeat: 'weekly' })];
    expect(upcoming(list, '2026-10-07', 15).map((x) => x.date)).toEqual(['2026-10-07', '2026-10-14', '2026-10-21']);
  });
});

describe('respaldo', () => {
  const settings = { theme: 'dark', palette: 'oceano', colors: {} };

  it('ida y vuelta', () => {
    const json = JSON.stringify(buildBackup({ settings, reminders: [r({})] }, new Date('2026-10-07T12:00:00Z')));
    const back = parseBackup(json);
    expect(back.settings).toEqual(settings);
    expect(back.reminders).toEqual([r({})]);
    expect(back.skipped).toBe(0);
  });

  it('rechaza archivos ajenos o dañados con mensaje claro', () => {
    expect(() => parseBackup('{no')).toThrow(/JSON válido/);
    expect(() => parseBackup('{"app":"otra"}')).toThrow(/Apex Calendar/);
    expect(() => parseBackup('{"app":"apex-calendar","format":99}')).toThrow(/más nueva/);
  });

  it('cuenta los recordatorios que no sirven', () => {
    const back = parseBackup(JSON.stringify({ app: 'apex-calendar', format: 1, reminders: [r({}), { text: '' }] }));
    expect(back.reminders).toHaveLength(1);
    expect(back.skipped).toBe(1);
    expect(back.settings).toBeNull();
  });

  it('combinar: el importado gana si tiene el mismo id', () => {
    const merged = mergeReminders([r({}), r({ id: 'b' })], [r({ text: 'Nuevo' }), r({ id: 'c' })]);
    expect(merged.map((x) => `${x.id}:${x.text}`)).toEqual(['a:Nuevo', 'b:Pagar luz', 'c:Pagar luz']);
  });
});
