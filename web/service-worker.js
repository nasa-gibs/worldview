const CACHE_NAME = 'worldview-tiles-v1';
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours
const TILE_URL_PATTERN = /gibs-\w\.earthdata\.nasa\.gov\/wmts\/.*(?:GetTile|GetMap)/;
const MAX_CACHE_ENTRIES = 500;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only cache NASA GIBS tile requests
  if (!TILE_URL_PATTERN.test(url.href)) {
    return;
  }

  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clonedResponse = networkResponse.clone();
            cache.put(event.request, clonedResponse);
            limitCacheSize(cache);
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        // Return cached response immediately, update from network in background
        if (cachedResponse && !isStale(cachedResponse)) {
          // Background refresh
          fetchPromise;
          return cachedResponse;
        }

        return fetchPromise;
      })
    )
  );
});

function isStale(response) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  const requestDate = new Date(dateHeader).getTime();
  return Date.now() - requestDate > MAX_CACHE_AGE;
}

function limitCacheSize(cache) {
  cache.keys().then((keys) => {
    if (keys.length > MAX_CACHE_ENTRIES) {
      const deleteCount = keys.length - MAX_CACHE_ENTRIES;
      keys.slice(0, deleteCount).forEach((request) => {
        cache.delete(request);
      });
    }
  });
}