// Almacenamiento local (localStorage) con prefijo `apex.` y migraciones por versión.
// Si el navegador bloquea localStorage (modo privado estricto, cookies desactivadas…)
// la app sigue funcionando con memoria temporal: los cambios se pierden al cerrar.

export const PREFIX = 'apex.';
/** Versión del formato de datos guardados. Subirla al cambiar la forma de algo guardado. */
export const DATA_VERSION = 1;

/** Backend en memoria con la misma interfaz que localStorage. */
export function memoryBackend(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    key: (i) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
  };
}

function browserBackend() {
  try {
    const ls = globalThis.localStorage;
    const probe = `${PREFIX}probe`;
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return { backend: ls, persistent: true };
  } catch {
    return { backend: memoryBackend(), persistent: false };
  }
}

/**
 * Migraciones: MIGRATIONS[n] convierte datos de la versión n-1 a la n.
 * Recibe el store y lo modifica en su lugar.
 */
const MIGRATIONS = {
  // 1: primera versión con datos guardados (v0.4). No hay nada que convertir.
  1: () => {},
};

/**
 * @param {object} [backend] objeto con la interfaz de localStorage (por defecto el del navegador)
 */
export function createStore(backend) {
  let persistent = true;
  if (!backend) ({ backend, persistent } = browserBackend());

  const store = {
    persistent,
    get(key, fallback = null) {
      try {
        const raw = backend.getItem(PREFIX + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    /** @returns {boolean} false si no se pudo guardar (p. ej. almacenamiento lleno). */
    set(key, value) {
      try {
        backend.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      try {
        backend.removeItem(PREFIX + key);
      } catch {
        /* nada que hacer */
      }
    },
    /** Claves propias (sin prefijo). */
    keys() {
      const out = [];
      for (let i = 0; i < backend.length; i++) {
        const k = backend.key(i);
        if (k && k.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
      }
      return out;
    },
  };
  migrate(store);
  return store;
}

/** Lleva los datos guardados a DATA_VERSION. */
export function migrate(store) {
  const from = Number(store.get('version', 0)) || 0;
  if (from >= DATA_VERSION) return;
  for (let v = from + 1; v <= DATA_VERSION; v++) MIGRATIONS[v]?.(store);
  store.set('version', DATA_VERSION);
}
