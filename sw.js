// Keeps the weather page on the guest's phone so it opens without signal.
// Page: network first (so a rebuilt page reaches the guest), saved copy when offline.
// The forecast itself is saved by the page (localStorage); met.no calls are not touched here.
const CACHE = 'stage-weather-pages-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('stage-weather-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(new URL(req.url).pathname, copy));
        }
        return res;
      })
      .catch(() => caches.match(new URL(req.url).pathname, {ignoreSearch: true})
        .then(hit => hit || new Response('Offline and this page was not saved yet.', {status: 503, headers: {'Content-Type': 'text/plain'}})))
  );
});
