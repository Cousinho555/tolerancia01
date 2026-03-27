// ══════════════════════════════════════════════════
// TOLERANCIA 0'1 — Service Worker
// Versión: incrementa este número cada vez que
// hagas un cambio importante en la web para
// forzar la actualización en todos los dispositivos
// ══════════════════════════════════════════════════
const VERSION = 'tol01-v3';

// Archivos que se guardan en caché para funcionar offline
const STATIC_CACHE = [
  '/tolerancia01/',
  '/tolerancia01/index.html',
  '/tolerancia01/logo.png',
  '/tolerancia01/equipo.jpg',
  '/tolerancia01/jugador1.jpg',
  '/tolerancia01/jugador2.jpg',
  '/tolerancia01/jugador3.jpg',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&family=Inter:wght@300;400;500&display=swap'
];

// ── INSTALL: guarda los archivos estáticos en caché ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(STATIC_CACHE))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: limpia versiones antiguas ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== VERSION)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: estrategia por tipo de recurso ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Supabase y Google Fonts: siempre desde la red (datos en tiempo real)
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('youtube.com')
  ) {
    event.respondWith(fetch(event.request).catch(() => new Response('')));
    return;
  }

  // Archivos propios: caché primero, red como fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Actualiza en background para la próxima visita
        fetch(event.request)
          .then(response => {
            if (response && response.status === 200) {
              caches.open(VERSION).then(cache => cache.put(event.request, response));
            }
          })
          .catch(() => {});
        return cached;
      }
      // No está en caché: va a la red y lo guarda
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(VERSION).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() => {
        // Sin red y sin caché: página offline
        if (event.request.destination === 'document') {
          return caches.match('/tolerancia01/index.html');
        }
      });
    })
  );
});

// ── MENSAJE: fuerza actualización desde la web ──
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
