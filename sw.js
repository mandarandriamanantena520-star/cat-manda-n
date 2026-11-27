importScripts('./version.js');
const CACHE_NAME = 'cat-manda-' + self.APP_VERSION.toLowerCase() + '.0'; // dérivé de version.js
const DEXIE_URL = 'https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.min.js';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './theme-pro.css',
  './theme-bred.css',
  './app.js',
  './operations.js',
  './i18n.js',
  './about.js',
  './icons.js',
  './chef.js',
  './pdf.js',
  './messenger.js',
  './notifs.js',
  './son_1.m4a',
  './img-login-1.jpg',
  './img-login-2.jpg',
  './img-login-3.jpg',
  './profil.js',
  './config.js',
  './version.js',
  './icon-192.png',
  './icon-512.png',
  './logo-cat.png',
  './sync.js',
  './dexie-lite.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).then(() => fetch(DEXIE_URL).then(r => cache.put(DEXIE_URL, r)).catch(() => {})))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http') || event.request.url.includes('.supabase.co')) return;
  event.respondWith(
    fetch(event.request).then((response) => {
      // Mettre à jour le cache avec la nouvelle version si en ligne
      if (response && (response.ok || response.type === 'opaque')) {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
      }
      return response;
    }).catch(() => caches.match(event.request)) // Si hors ligne, prendre dans le cache
  );
});

// Logique de bannière
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// Notifications systeme : toucher une notification ouvre / ramene l'application
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const kind = event.notification.data && event.notification.data.kind;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    if (list.length) { const c = list[0]; if (c.focus) c.focus(); c.postMessage({ type: 'notif-click', kind }); return; }
    return self.clients.openWindow('./index.html');
  }));
});
