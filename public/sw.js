// Service Worker — Leisure Exporting LLC
// v2: conservador — solo cachea assets estáticos con hash.
// NUNCA cachea el HTML ni /api/*. Al activarse, elimina TODOS los cachés viejos
// (incluidos los de versiones anteriores que congelaban la app en navegadores).
const CACHE_NAME = 'leisure-v2';

self.addEventListener('install', (e) => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  // Solo assets estáticos con hash de contenido (inmutables entre builds)
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(caches.match(e.request).then((c) => c || fetch(e.request)));
  }
  // Todo lo demás (incluido el HTML "/") siempre va a la red: nunca congela la app
});
