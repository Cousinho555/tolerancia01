// ══════════════════════════════════════════════════
// TOLERANCIA 0'1 — Service Worker
// Versión: incrementa este número cada vez que
// hagas un cambio importante en la web para
// forzar la actualización en todos los dispositivos
// ══════════════════════════════════════════════════
// ══════════════════════════════════════════════════
// TOLERANCIA 0'1 — Service Worker
// ══════════════════════════════════════════════════

// OneSignal (imprescindible que esté en la primera línea)
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const VERSION = 'tol01-v4';

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

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(STATIC_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== VERSION).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('onesignal.com')
  ) {
    event.respondWith(fetch(event.request).catch(() => new Response('')));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(VERSION).then(cache => cache.put(event.request, response));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(VERSION).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/tolerancia01/index.html');
        }
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
