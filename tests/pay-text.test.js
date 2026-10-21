import { describe as group, it, expect } from 'vitest';
import { getDayInfo } from '../src/core/schedule.js';
import { describe, payText } from '../src/views/common.js';
import { summarize, summaryText, monthDates } from '../src/views/month.js';

group('textos de paga', () => {
  it('domingo trabajado: prima dominical, nunca "doble" ni "x2"', () => {
    const d = getDayInfo('2026-08-09');
    expect(describe(d)).toBe('Trabajo 8–21 · prima dominical');
    expect(payText(d)).toMatch(/prima dominical/);
    expect(payText(d)).toMatch(/25 %/);
    expect(payText(d)).not.toMatch(/x2/);
  });

  it('festivo trabajado: x3', () => {
    const d = getDayInfo('2026-09-16');
    expect(describe(d)).toMatch(/paga x3$/);
    expect(payText(d)).toBe('Festivo trabajado: paga triple (x3).');
  });

  it('resumen del mes cuenta domingos con prima dominical', () => {
    // Agosto 2026: domingos trabajados 9 y 23 (semana B).
    const s = summarize(monthDates(2026, 8));
    expect(s.sundays).toBe(2);
    expect(summaryText(s)).toMatch(/2 domingos con prima dominical/);
    expect(summaryText(s)).not.toMatch(/x2/);
  });
});
