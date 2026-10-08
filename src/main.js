// Arranque de la app y router por hash:
//   #/mes/2026-08 · #/semana/2026-08-02 · #/dia/2026-08-04 · #/buscar · #/recordatorios · #/ajustes
// Las vistas viven en src/views/, la lógica pura en src/core/ y lo del navegador en src/app/.
import './styles/themes.css';
import './styles/base.css';
import { renderMonth } from './views/month.js';
import { renderWeek } from './views/week.js';
import { renderDay } from './views/day.js';
import { renderSearch, upcomingPanel } from './views/search.js';
import { renderSettings } from './views/settings.js';
import { renderReminders, dayRemindersPanel } from './views/reminders.js';
import { dataSection } from './views/data.js';
import { appSection, notificationsSection, shortcutsSection } from './views/app-settings.js';
import { createStore } from './store/storage.js';
import { normalizeSettings, DEFAULT_SETTINGS } from './core/settings.js';
import {
  backupFileName, buildBackup, mergeReminders, normalizeReminder, normalizeReminders, parseBackup, remindersOn,
} from './core/reminders.js';
import { applyTheme } from './app/theme.js';
import { showToast } from './app/toast.js';
import { canInstall, initPwa, isIOS, isOfflineReady, isStandalone, onPwaChange, promptInstall } from './app/pwa.js';
import {
  notificationPermission, requestNotificationPermission, showReminderNotification, startNotifier,
} from './app/notifier.js';
import { addDays, todayISO } from './core/dates.js';
import { CALENDAR_VIEWS, focusDate, parseRoute, routeFor, routeHash, shiftRoute } from './app/router.js';
import { attachSwipe } from './app/swipe.js';

const view = document.getElementById('view');
const toolbar = document.getElementById('toolbar');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const todayBtn = document.getElementById('today');
const tabs = [...document.querySelectorAll('.tabs a[data-view]')];
document.getElementById('version').textContent = `v${__APP_VERSION__}`;

// ——— Datos del usuario ———

const store = createStore();
let settings = normalizeSettings(store.get('settings'));
let reminders = normalizeReminders(store.get('reminders', []));
applyTheme(settings);
// En modo automático, la barra del navegador sigue al sistema.
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => applyTheme(settings));

function save(key, value) {
  if (!store.set(key, value)) {
    showToast('No se pudo guardar en este navegador (¿almacenamiento lleno o bloqueado?).', { tone: 'alert' });
  }
}

/** Cambia ajustes, los guarda y los aplica. */
function updateSettings(patch, { rerender = true } = {}) {
  settings = normalizeSettings({ ...settings, ...patch });
  save('settings', settings);
  applyTheme(settings);
  if (rerender) renderKeepingFocus();
}

function setReminders(list) {
  reminders = list;
  save('reminders', reminders);
}

/** Recordatorio que se está editando en #/recordatorios. */
let editId = null;

function saveReminder(data) {
  const r = normalizeReminder(data);
  if (!r) return;
  if (r.notify) askForNotifications();
  const exists = reminders.some((x) => x.id === r.id);
  setReminders(exists ? reminders.map((x) => (x.id === r.id ? r : x)) : [...reminders, r]);
  editId = null;
  showToast(exists ? 'Cambios guardados.' : `Recordatorio agregado: ${r.text}`);
  if (exists) pendingSelector = '#reminder-form-title';
  renderKeepingFocus();
}

/** Pide permiso de notificaciones la primera vez que se marca "Avisarme". */
async function askForNotifications() {
  const before = notificationPermission();
  if (before === 'granted') return;
  const after = before === 'default' ? await requestNotificationPermission() : before;
  if (after === 'denied') {
    showToast('Las notificaciones están bloqueadas: el aviso aparecerá solo dentro de la app.', { timeout: 8000 });
  }
  if (current().view === 'ajustes') renderKeepingFocus();
}

function deleteReminder(id) {
  const index = reminders.findIndex((r) => r.id === id);
  if (index < 0) return;
  const removed = reminders[index];
  setReminders(reminders.filter((r) => r.id !== id));
  if (editId === id) editId = null;
  pendingSelector = '.view-title';
  render();
  showToast(`Recordatorio borrado: ${removed.text}`, {
    action: {
      label: 'Deshacer',
      onClick: () => {
        const list = [...reminders];
        list.splice(index, 0, removed);
        setReminders(list);
        render();
      },
    },
  });
}

function editReminder(id) {
  editId = id;
  if (id == null) {
    pendingSelector = '#reminder-form-title';
    render();
    return;
  }
  pendingSelector = '#edit-rem-text';
  go({ view: 'recordatorios', date: null });
}

function exportData() {
  const backup = buildBackup({ settings, reminders });
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName(todayISO());
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Respaldo descargado.');
}

async function importData(file, mode) {
  try {
    const data = parseBackup(await file.text());
    if (mode === 'replace') {
      setReminders(data.reminders);
      if (data.settings) updateSettings(data.settings, { rerender: false });
    } else {
      setReminders(mergeReminders(reminders, data.reminders));
    }
    const skipped = data.skipped ? ` (${data.skipped} no se pudieron leer)` : '';
    const what = mode === 'replace' ? 'Datos reemplazados' : 'Respaldo combinado';
    showToast(`${what}: ${data.reminders.length} recordatorios${skipped}.`);
    renderKeepingFocus();
  } catch (err) {
    showToast(`No se pudo importar: ${err.message}`, { tone: 'alert', timeout: 10000 });
  }
}

function clearData() {
  const ok = confirm(
    '¿Borrar tus ajustes y todos tus recordatorios de este navegador? No se puede deshacer. Exporta un respaldo antes si lo necesitas.',
  );
  if (!ok) return;
  store.remove('settings');
  store.remove('reminders');
  settings = normalizeSettings(DEFAULT_SETTINGS);
  reminders = [];
  applyTheme(settings);
  showToast('Se borraron tus datos de este navegador.');
  renderKeepingFocus();
}

// ——— Navegación y render ———

const PERIOD = {
  mes: ['Mes anterior', 'Mes siguiente'],
  semana: ['Semana anterior', 'Semana siguiente'],
  dia: ['Día anterior', 'Día siguiente'],
};

/** Día que recibe el foco del teclado tras renderizar (navegación con flechas). */
let pendingFocus = null;
/** Si el próximo render vino de una acción del usuario, el foco va al título de la vista. */
let moveFocus = false;
/** Selector que recibe el foco tras renderizar (p. ej. el resultado del buscador). */
let pendingSelector = null;
/** Tras deslizar con el dedo no se mueve el foco (evita el recuadro de foco en el título). */
let skipFocus = false;

const today = () => todayISO();
const current = () => parseRoute(location.hash, today());

function go(route, { focusDay = null, quiet = false } = {}) {
  pendingFocus = focusDay;
  moveFocus = !quiet;
  skipFocus = quiet;
  const hash = routeHash(route);
  if (location.hash === hash) render();
  else location.hash = hash;
}

/** Vuelve a dibujar la vista sin perder el control que tenía el foco. */
function renderKeepingFocus() {
  const active = document.activeElement;
  const id = active && active !== document.body ? active.id : null;
  const radio = active?.type === 'radio' && active.name ? `input[name="${active.name}"]:checked` : null;
  const hadSelector = pendingSelector;
  render();
  if (hadSelector) return;
  const target = (id && document.getElementById(id)) || (radio && view.querySelector(radio));
  target?.focus();
}

const reminderCount = (iso) => remindersOn(reminders, iso).length;

function render() {
  const t = today();
  const route = current();
  if (route.view !== 'recordatorios') editId = null;

  // Hash canónico (p. ej. #/semana/2026-08-05 → #/semana/2026-08-02) sin crear historial.
  const canonical = routeHash(route);
  if (location.hash !== canonical) history.replaceState(null, '', canonical);

  const focus = pendingFocus ?? (route.date ? focusDate(route, t) : t);
  const opts = { date: route.date, today: t, focus, bank: settings.bank };
  const reminderHandlers = { onSave: saveReminder, onDelete: deleteReminder, onEdit: editReminder };

  switch (route.view) {
    case 'mes':
      renderMonth(view, { ...opts, reminders: reminderCount });
      break;
    case 'semana':
      renderWeek(view, { ...opts, reminders: (iso) => remindersOn(reminders, iso) });
      break;
    case 'dia':
      renderDay(view, {
        ...opts,
        extras: (iso) => [dayRemindersPanel(iso, { reminders, showNotify: true, ...reminderHandlers }), upcomingPanel(iso, t, { bank: settings.bank })],
      });
      break;
    case 'buscar':
      renderSearch(view, {
        ...opts,
        onSearch: (iso) => {
          pendingSelector = '#search-result-title';
          go({ view: 'buscar', date: iso });
        },
      });
      break;
    case 'recordatorios':
      renderReminders(view, { ...opts, reminders, editId, showNotify: true, ...reminderHandlers });
      break;
    case 'ajustes':
      renderSettings(view, {
        settings,
        onChange: updateSettings,
        persistent: store.persistent,
        sections: [
          appSection({
            standalone: isStandalone(),
            canInstall: canInstall(),
            ios: isIOS(),
            offlineReady: isOfflineReady(),
            onInstall: promptInstall,
          }),
          notificationsSection({
            permission: notificationPermission(),
            onRequest: askForNotifications,
            onTest: () =>
              showReminderNotification({
                title: 'Aviso de prueba',
                body: 'Así se verán los avisos de tus recordatorios.',
                url: './#/recordatorios',
                tag: 'apex-test',
              }),
          }),
          dataSection({ reminderCount: reminders.length, onExport: exportData, onImport: importData, onClear: clearData }),
          shortcutsSection(),
        ],
      });
      break;
  }

  // Pestañas: conservan la fecha que se está viendo.
  for (const tab of tabs) {
    tab.href = routeHash(routeFor(tab.dataset.view, focus));
    if (tab.dataset.view === route.view) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }

  toolbar.hidden = !CALENDAR_VIEWS.includes(route.view);
  // En mes, semana y día se puede deslizar el dedo para cambiar de periodo.
  view.classList.toggle('swipeable', CALENDAR_VIEWS.includes(route.view));
  const labels = PERIOD[route.view];
  if (labels) {
    prevBtn.setAttribute('aria-label', labels[0]);
    nextBtn.setAttribute('aria-label', labels[1]);
  }

  document.title = `${view.querySelector('.view-title')?.firstChild?.textContent ?? ''} · Apex Calendar`;

  if (skipFocus) {
    // nada: el gesto táctil no mueve el foco
  } else if (pendingFocus) {
    view.querySelector(`[data-date="${pendingFocus}"]`)?.focus();
  } else if (pendingSelector) {
    view.querySelector(pendingSelector)?.focus();
  } else if (moveFocus) {
    view.querySelector('.view-title')?.focus();
  }
  pendingFocus = null;
  pendingSelector = null;
  moveFocus = false;
  skipFocus = false;
}

prevBtn.addEventListener('click', () => go(shiftRoute(current(), -1)));
nextBtn.addEventListener('click', () => go(shiftRoute(current(), 1)));
todayBtn.addEventListener('click', () => go(routeFor(current().view, today())));

// Flechas dentro del mes o la semana: mueven el foco de día en día (y cambian de periodo si hace falta).
const STEP = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
const WEEK_STEP = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1 };

view.addEventListener('keydown', (e) => {
  const day = e.target.closest('[data-date]');
  if (!day || e.altKey || e.ctrlKey || e.metaKey) return;
  const route = current();
  let target = null;
  if (route.view === 'mes' && e.key in STEP) target = addDays(day.dataset.date, STEP[e.key]);
  if (route.view === 'semana' && e.key in WEEK_STEP) target = addDays(day.dataset.date, WEEK_STEP[e.key]);
  if (e.key === 'Home') target = view.querySelector('[data-date]')?.dataset.date;
  if (e.key === 'End') target = [...view.querySelectorAll('[data-date]')].pop()?.dataset.date;
  if (e.key === 'PageUp' || e.key === 'PageDown') {
    const next = shiftRoute(route, e.key === 'PageUp' ? -1 : 1);
    e.preventDefault();
    go(next, { focusDay: next.date });
    return;
  }
  if (!target) return;
  e.preventDefault();
  const link = view.querySelector(`[data-date="${target}"]`);
  if (link) {
    day.tabIndex = -1;
    link.tabIndex = 0;
    link.focus();
  } else {
    go(routeFor(route.view, target), { focusDay: target });
  }
});

// En pantallas táctiles, deslizar el dedo cambia de periodo (izquierda → siguiente).
attachSwipe(view, {
  enabled: () => CALENDAR_VIEWS.includes(current().view),
  onSwipe: (delta) => go(shiftRoute(current(), delta), { quiet: true }),
});

// Fuera de la cuadrícula, ← y → cambian de periodo.
document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.target.closest?.('input, textarea, select, button, a, label, [contenteditable], [data-date], dialog')) return;
  if (!CALENDAR_VIEWS.includes(current().view)) return;
  if (e.key === 'ArrowLeft') go(shiftRoute(current(), -1));
  if (e.key === 'ArrowRight') go(shiftRoute(current(), 1));
});

window.addEventListener('hashchange', () => {
  moveFocus = true;
  render();
});

// Si otra pestaña cambia los datos, esta se actualiza.
window.addEventListener('storage', (e) => {
  if (!e.key?.startsWith('apex.')) return;
  settings = normalizeSettings(store.get('settings'));
  reminders = normalizeReminders(store.get('reminders', []));
  applyTheme(settings);
  renderKeepingFocus();
});

// ——— App instalable, sin conexión y avisos ———

initPwa({
  onOpen: (url) => {
    const hash = new URL(url, location.href).hash;
    if (hash) location.hash = hash;
  },
});
onPwaChange(() => {
  if (current().view === 'ajustes') renderKeepingFocus();
});
startNotifier(() => reminders);

render();
