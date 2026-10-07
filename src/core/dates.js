// Utilidades de fecha.
// Todas las fechas se manejan como texto 'YYYY-MM-DD' y la aritmética se hace en UTC
// a medianoche, para que la zona horaria o cambios de horario nunca desplacen un día.

export const DAY_MS = 86_400_000;

const pad = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' → milisegundos UTC a medianoche. */
export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Milisegundos UTC → 'YYYY-MM-DD'. */
export function toISO(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Año, mes (1–12) y día → 'YYYY-MM-DD'. */
export function fromParts(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function addDays(iso, n) {
  return toISO(parseISO(iso) + n * DAY_MS);
}

/** Días de `from` a `to` (negativo si `to` es anterior). */
export function diffDays(from, to) {
  return Math.round((parseISO(to) - parseISO(from)) / DAY_MS);
}

/** Día de la semana: 0 = domingo … 6 = sábado. */
export function weekday(iso) {
  return new Date(parseISO(iso)).getUTCDay();
}

/** Módulo que nunca es negativo (necesario para fechas anteriores a la ancla). */
export function mod(n, m) {
  return ((n % m) + m) % m;
}

export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** n-ésimo `wd` (0 = domingo) del mes. Ej.: tercer lunes de marzo = nthWeekday(y, 3, 1, 3). */
export function nthWeekday(year, month, wd, n) {
  const first = weekday(fromParts(year, month, 1));
  const day = 1 + mod(wd - first, 7) + 7 * (n - 1);
  return fromParts(year, month, day);
}

/** La fecha local del usuario (no UTC) como 'YYYY-MM-DD'. */
export function todayISO(now = new Date()) {
  return fromParts(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const WEEKDAYS_SHORT_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
