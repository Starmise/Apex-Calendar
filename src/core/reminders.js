// Recordatorios personales (se guardan en `apex.reminders`) y respaldo JSON.
// Puro: valida, calcula en qué fechas cae cada recordatorio y arma/lee respaldos.

import { addDays, daysInMonth, diffDays, isValidISO, mod } from './dates.js';
import { normalizeSettings } from './settings.js';

export const REPEATS = [
  ['none', 'No se repite'],
  ['weekly', 'Cada semana'],
  ['cycle', 'Cada 14 días (como el rol)'],
  ['monthly', 'Cada mes'],
  ['yearly', 'Cada año'],
];
const REPEAT_IDS = REPEATS.map(([id]) => id);

export const MAX_TEXT = 200;

const isTime = (t) => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

export function newId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/** Un recordatorio válido o null. Acepta datos importados o viejos. */
export function normalizeReminder(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const text = typeof raw.text === 'string' ? raw.text.trim().slice(0, MAX_TEXT) : '';
  if (!text || !isValidISO(raw.date)) return null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id.slice(0, 64) : newId(),
    date: raw.date,
    time: isTime(raw.time) ? raw.time : null,
    text,
    repeat: REPEAT_IDS.includes(raw.repeat) ? raw.repeat : 'none',
    notify: raw.notify === true && isTime(raw.time),
  };
}

/** Lista válida, sin ids repetidos. */
export function normalizeReminders(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const r = normalizeReminder(raw);
    if (!r || seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out;
}

/** ¿El recordatorio cae en esa fecha? */
export function occursOn(r, iso) {
  const diff = diffDays(r.date, iso);
  if (diff < 0) return false;
  switch (r.repeat) {
    case 'none':
      return diff === 0;
    case 'weekly':
      return diff % 7 === 0;
    case 'cycle':
      return diff % 14 === 0;
    case 'monthly': {
      // Día 31 → último día de los meses más cortos.
      const y = Number(iso.slice(0, 4));
      const m = Number(iso.slice(5, 7));
      const day = Math.min(Number(r.date.slice(8, 10)), daysInMonth(y, m));
      return Number(iso.slice(8, 10)) === day;
    }
    case 'yearly': {
      if (iso.slice(5, 7) !== r.date.slice(5, 7)) return false;
      const y = Number(iso.slice(0, 4));
      const m = Number(iso.slice(5, 7));
      const day = Math.min(Number(r.date.slice(8, 10)), daysInMonth(y, m)); // 29 feb → 28 feb
      return Number(iso.slice(8, 10)) === day;
    }
    default:
      return false;
  }
}

/** Orden dentro de un día: primero los de todo el día, luego por hora. */
export function compareReminders(a, b) {
  if (a.time !== b.time) {
    if (!a.time) return -1;
    if (!b.time) return 1;
    return a.time < b.time ? -1 : 1;
  }
  return a.text.localeCompare(b.text, 'es');
}

export function remindersOn(list, iso) {
  return list.filter((r) => occursOn(r, iso)).sort(compareReminders);
}

/** Próximas apariciones desde `from` (incluido) durante `days` días: [{ date, reminder }]. */
export function upcoming(list, from, days = 60) {
  const out = [];
  for (let i = 0; i < days; i++) {
    const iso = addDays(from, i);
    for (const reminder of remindersOn(list, iso)) out.push({ date: iso, reminder });
  }
  return out;
}

/** Siguiente fecha (desde `from`, incluida) en que cae el recordatorio, o null si ya pasó. */
export function nextOccurrence(r, from, limit = 400) {
  const start = r.date > from ? r.date : from;
  if (r.repeat === 'none') return r.date >= from ? r.date : null;
  if (r.repeat === 'weekly' || r.repeat === 'cycle') {
    const step = r.repeat === 'weekly' ? 7 : 14;
    return addDays(start, mod(-diffDays(r.date, start), step));
  }
  for (let i = 0; i < limit; i++) {
    const iso = addDays(start, i);
    if (occursOn(r, iso)) return iso;
  }
  return null;
}

/** Texto corto de la repetición. */
export function repeatLabel(repeat) {
  return REPEATS.find(([id]) => id === repeat)?.[1] ?? '';
}

// ——— Respaldo ———

export const BACKUP_FORMAT = 1;

/** Objeto de respaldo listo para JSON.stringify. */
export function buildBackup({ settings, reminders }, now = new Date()) {
  return {
    app: 'apex-calendar',
    format: BACKUP_FORMAT,
    exportedAt: now.toISOString(),
    settings,
    reminders,
  };
}

/**
 * Lee un respaldo (texto JSON). Lanza Error con un mensaje para el usuario si no sirve.
 * @returns {{settings: object|null, reminders: object[], skipped: number}}
 */
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  if (!data || data.app !== 'apex-calendar') {
    throw new Error('El archivo no es un respaldo de Apex Calendar.');
  }
  if (typeof data.format !== 'number' || data.format > BACKUP_FORMAT) {
    throw new Error('El respaldo es de una versión más nueva de Apex Calendar. Actualiza la página e intenta de nuevo.');
  }
  const rawList = Array.isArray(data.reminders) ? data.reminders : [];
  const reminders = normalizeReminders(rawList);
  return {
    settings: data.settings ? normalizeSettings(data.settings) : null,
    reminders,
    skipped: rawList.length - reminders.length,
  };
}

/** Combina recordatorios: los importados reemplazan a los que tienen el mismo id. */
export function mergeReminders(current, incoming) {
  const byId = new Map(current.map((r) => [r.id, r]));
  for (const r of incoming) byId.set(r.id, r);
  return [...byId.values()];
}

/** 'apex-calendar-2026-10-07.json' */
export function backupFileName(today) {
  return `apex-calendar-${today}.json`;
}

// ——— Avisos ———

/** Máximo retraso con el que todavía se avisa (p. ej. si la computadora estaba suspendida). */
export const NOTIFY_GRACE_MS = 15 * 60_000;

const pad2 = (n) => String(n).padStart(2, '0');
const localISO = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/**
 * Recordatorios con aviso cuya hora (local) cae en el intervalo (from, to].
 * @param {object[]} list
 * @param {Date} from última revisión
 * @param {Date} to   ahora
 * @returns {{reminder: object, date: string, at: number}[]}
 */
export function dueReminders(list, from, to) {
  const start = Math.max(from.getTime(), to.getTime() - NOTIFY_GRACE_MS);
  const end = to.getTime();
  if (end <= start) return [];
  const out = [];
  const firstDay = localISO(new Date(start));
  const lastDay = localISO(to);
  for (let iso = firstDay; iso <= lastDay; iso = addDays(iso, 1)) {
    const [y, m, d] = iso.split('-').map(Number);
    for (const r of list) {
      if (!r.notify || !r.time || !occursOn(r, iso)) continue;
      const [hh, mm] = r.time.split(':').map(Number);
      const at = new Date(y, m - 1, d, hh, mm).getTime();
      if (at > start && at <= end) out.push({ reminder: r, date: iso, at });
    }
  }
  return out.sort((a, b) => a.at - b.at);
}
