// App instalable y sin conexión: registro del service worker, aviso de versión nueva,
// botón de instalar y estado de la conexión.

import { showToast } from './toast.js';

const state = {
  /** Evento guardado para mostrar el diálogo de instalación cuando el usuario lo pida. */
  installPrompt: null,
  /** true si el service worker quedó activo (la app funciona sin conexión). */
  offlineReady: false,
};
const listeners = new Set();
/** Solo se recarga al cambiar de service worker si el usuario pidió actualizar
 *  (en la primera visita, clients.claim() también dispara controllerchange). */
let updateRequested = false;
const notify = () => listeners.forEach((fn) => fn());

/** Avisar cambios de estado (para volver a dibujar Ajustes). */
export function onPwaChange(fn) {
  listeners.add(fn);
}

export function isStandalone() {
  return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

export function canInstall() {
  return state.installPrompt != null;
}

export function isOfflineReady() {
  return state.offlineReady;
}

/** iPhone / iPad: no hay diálogo de instalación; se agrega desde Compartir. */
export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export async function promptInstall() {
  const prompt = state.installPrompt;
  if (!prompt) return false;
  state.installPrompt = null;
  prompt.prompt();
  const { outcome } = await prompt.userChoice;
  notify();
  return outcome === 'accepted';
}

function showUpdate(registration) {
  showToast('Hay una versión nueva de Apex Calendar.', {
    timeout: 10 * 60_000,
    action: {
      label: 'Actualizar',
      onClick: () => {
        updateRequested = true;
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      },
    },
  });
}

/**
 * Registra el service worker (solo en el sitio compilado) y los eventos de instalación.
 * @param {{onOpen?: (url: string) => void}} [opts] onOpen: clic en una notificación.
 */
export function initPwa({ onOpen } = {}) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.installPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    state.installPrompt = null;
    showToast('Apex Calendar quedó instalada.');
    notify();
  });
  window.addEventListener('offline', () => showToast('Sin conexión. El calendario y tus recordatorios siguen funcionando.'));
  window.addEventListener('online', () => showToast('Conexión recuperada.', { timeout: 3000 }));

  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  const base = import.meta.env.BASE_URL;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading || !updateRequested) return;
    reloading = true;
    location.reload();
  });
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data?.type === 'OPEN' && e.data.url) onOpen?.(e.data.url);
  });

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(`${base}sw.js`, { scope: base });
      // Ya había una versión nueva esperando.
      if (registration.waiting && navigator.serviceWorker.controller) showUpdate(registration);
      registration.addEventListener('updatefound', () => {
        const sw = registration.installing;
        sw?.addEventListener('statechange', () => {
          if (sw.state !== 'installed') return;
          if (navigator.serviceWorker.controller) showUpdate(registration);
          else showToast('Listo: Apex Calendar ya funciona sin conexión.');
        });
      });
      await navigator.serviceWorker.ready;
      state.offlineReady = true;
      notify();
      // Buscar versiones nuevas al volver a la app y cada hora.
      const check = () => registration.update().catch(() => {});
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check());
      setInterval(check, 60 * 60_000);
    } catch {
      // Sin service worker la app funciona igual, solo que no sin conexión.
    }
  });
}
