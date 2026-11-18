const CACHE_NAME = 'cat-manda-v2.5.0'; // OVAO IZY RAHA MISY VERSION VAOVAO
const DEXIE_URL = 'https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.min.js';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './icons.js',
  './chef.js',
  './config.js',
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