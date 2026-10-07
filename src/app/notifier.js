// Avisos de recordatorios. Solo funcionan con Apex Calendar abierto (una pestaña o la app
// instalada): no hay servidor que pueda despertar al navegador cuando está cerrado.

import { dueReminders } from '../core/reminders.js';
import { formatLong } from '../core/dates.js';
import { showToast } from './toast.js';

const CHECK_EVERY_MS = 20_000;

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** 'granted' | 'denied' | 'default' | 'unsupported' */
export function notificationPermission() {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/** Muestra una notificación del sistema (si hay permiso) y un aviso dentro de la app. */
export async function showReminderNotification({ title, body, url, tag }) {
  showToast(`${title} — ${body}`, { timeout: 60_000 });
  if (notificationPermission() !== 'granted') return;
  const options = {
    body,
    tag,
    lang: 'es-MX',
    icon: `${import.meta.env.BASE_URL}icon-192.png`,
    badge: `${import.meta.env.BASE_URL}icon-192.png`,
    data: { url },
  };
  try {
    // En Android solo funciona a través del service worker.
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
    const n = new Notification(title, options);
    n.onclick = () => {
      window.focus();
      location.hash = url.slice(url.indexOf('#'));
      n.close();
    };
  } catch {
    // Si el sistema rechaza la notificación, el aviso dentro de la app ya se mostró.
  }
}

/**
 * Revisa cada 20 s si toca avisar algún recordatorio.
 * @param {() => object[]} getReminders
 */
export function startNotifier(getReminders) {
  let last = new Date();
  const fired = new Set();

  const check = () => {
    const now = new Date();
    const due = dueReminders(getReminders(), last, now);
    last = now;
    for (const { reminder, date } of due) {
      const key = `${reminder.id}|${date}|${reminder.time}`;
      if (fired.has(key)) continue;
      fired.add(key);
      showReminderNotification({
        title: `${reminder.time} · ${reminder.text}`,
        body: `Recordatorio de Apex Calendar para el ${formatLong(date, { withYear: false })}.`,
        url: `./#/dia/${date}`,
        tag: key,
      });
    }
  };

  setInterval(check, CHECK_EVERY_MS);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check());
  return check;
}
