import { describe, expect, it } from 'vitest';
import { createStore, memoryBackend, DATA_VERSION } from '../src/store/storage.js';

describe('almacenamiento', () => {
  it('guarda y lee JSON con prefijo apex.', () => {
    const backend = memoryBackend();
    const store = createStore(backend);
    store.set('settings', { theme: 'dark' });
    expect(backend.getItem('apex.settings')).toBe('{"theme":"dark"}');
    expect(store.get('settings')).toEqual({ theme: 'dark' });
    expect(store.get('nada', 5)).toBe(5);
  });

  it('marca la versión de datos al crear', () => {
    const backend = memoryBackend();
    createStore(backend);
    expect(backend.getItem('apex.version')).toBe(String(DATA_VERSION));
  });

  it('JSON dañado → valor por defecto', () => {
    const store = createStore(memoryBackend({ 'apex.settings': '{roto' }));
    expect(store.get('settings', 'x')).toBe('x');
  });

  it('lista solo claves propias', () => {
    const store = createStore(memoryBackend({ 'otra.cosa': '1', 'apex.reminders': '[]' }));
    expect(store.keys().sort()).toEqual(['reminders', 'version']);
  });

  it('si el navegador falla al guardar, no truena', () => {
    const broken = { ...memoryBackend(), setItem: () => { throw new Error('QuotaExceeded'); }, getItem: () => null, length: 0 };
    const store = createStore(broken);
    expect(store.set('x', 1)).toBe(false);
  });
});
