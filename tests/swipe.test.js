import { describe, expect, it } from 'vitest';
import { dragOffset, lockAxis, SWIPE, swipeDirection } from '../src/app/swipe.js';

describe('lockAxis', () => {
  it('no decide mientras el dedo casi no se mueve', () => {
    expect(lockAxis(3, 4)).toBe(null);
  });
  it('fija el eje dominante', () => {
    expect(lockAxis(20, 5)).toBe('x');
    expect(lockAxis(-20, 5)).toBe('x');
    expect(lockAxis(5, 20)).toBe('y');
    expect(lockAxis(5, -20)).toBe('y');
  });
});

describe('swipeDirection', () => {
  it('dedo a la izquierda → periodo siguiente; a la derecha → anterior', () => {
    expect(swipeDirection({ dx: -100, dy: 5, dt: 300 })).toBe(1);
    expect(swipeDirection({ dx: 100, dy: -5, dt: 300 })).toBe(-1);
  });

  it('un arrastre lento y corto no cambia de periodo', () => {
    expect(swipeDirection({ dx: -40, dy: 0, dt: 500 })).toBe(0);
  });

  it('un gesto rápido basta con menos distancia', () => {
    expect(swipeDirection({ dx: -40, dy: 0, dt: 60 })).toBe(1);
    expect(swipeDirection({ dx: -20, dy: 0, dt: 10 })).toBe(0); // muy corto aunque sea rápido
  });

  it('ignora gestos con mucha componente vertical (scroll)', () => {
    expect(swipeDirection({ dx: -100, dy: 80, dt: 300 })).toBe(0);
    expect(swipeDirection({ dx: 0, dy: 200, dt: 300 })).toBe(0);
  });

  it('acepta una diagonal leve', () => {
    expect(swipeDirection({ dx: 100, dy: 50, dt: 300 })).toBe(-1);
  });

  it('un toque (sin movimiento) no es deslizamiento', () => {
    expect(swipeDirection({ dx: 0, dy: 0, dt: 100 })).toBe(0);
  });
});

describe('dragOffset', () => {
  it('sigue al dedo con resistencia', () => {
    expect(dragOffset(60)).toBe(30);
    expect(dragOffset(-60)).toBe(-30);
  });
  it('tiene tope', () => {
    expect(dragOffset(1000)).toBe(SWIPE.maxOffset);
    expect(dragOffset(-1000)).toBe(-SWIPE.maxOffset);
  });
});
