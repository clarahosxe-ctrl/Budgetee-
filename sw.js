// Réseau d'abord : l'app se met à jour toute seule dès qu'il y a du réseau,
// et le cache ne sert que hors-ligne.
const CACHE = 'daylance-v5';
const ASSETS = ['./', 'index.html', 'app.js', 'i18n.js', 'cloud.js', 'firebase-config.js', 'manifest.webmanifest', 'icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-192.png', 'icons/maskable-512.png', 'icons/favicon-64.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(a => new Request(a, {cache:'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r, {cache:'no-cache'}).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => caches.match(r).then(hit => hit || caches.match('index.html')))
  );
});
