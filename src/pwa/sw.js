// Service worker de Apex Calendar: hace que la app funcione sin conexión.
//
// Esta es una plantilla: al compilar, el plugin `pwaPrecache` de vite.config.js reemplaza
// los dos marcadores de abajo por la lista de archivos generados y por un hash de esa
// lista, y publica el resultado como dist/sw.js. En desarrollo (`npm run dev`) no se registra.
//
// Estrategia:
//   - Al instalar se guardan todos los archivos de la app (precache).
//   - Página (navegación): primero la red (máx. 3 s) y si falla, la copia guardada.
//   - Resto (JS, CSS, íconos): primero la copia guardada; si no existe, la red.
//   - La versión nueva espera hasta que el usuario pulsa "Actualizar" (mensaje SKIP_WAITING).

const CACHE = 'apex-__CACHE_VERSION__';
const PRECACHE = __PRECACHE__;
const SHELL = new URL('./', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((p) => new URL(p, self.registration.scope).href))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('apex-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await Promise.race([fetch(request), timeout(3000)]);
    if (response.ok) cache.put(SHELL, response.clone());
    return response;
  } catch {
    return (await cache.match(SHELL)) || (await cache.match(request)) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request, { ignoreSearch: true });
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (request.mode === 'navigate') event.respondWith(networkFirst(request));
  else event.respondWith(cacheFirst(request));
});

// Clic en una notificación de recordatorio: enfoca la app abierta (o la abre) en ese día.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || './', self.registration.scope).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const w of windows) {
        if (w.url.startsWith(self.registration.scope)) {
          await w.focus();
          // La app cambia de ruta sola (solo cambia el hash, sin recargar).
          w.postMessage({ type: 'OPEN', url: target });
          return undefined;
        }
      }
      return self.clients.openWindow(target);
    })(),
  );
});
