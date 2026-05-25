const APP_VERSION = 'v1.3';
const CACHE_NAME = `milana-${APP_VERSION}`;
const STATIC_CACHE = `milana-static-${APP_VERSION}`;
const DATA_CACHE = `milana-data-${APP_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker', APP_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DATA_CACHE && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.pathname.startsWith('/api/') || url.hostname !== location.hostname) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)
  ) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.match(/\.(js|css|woff2?|ttf)$/)
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(networkFirstStrategy(request));
});

async function cacheFirstStrategy(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Cache-first fetch failed:', request.url);
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network-first falling back to cache:', request.url);
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.destination === 'document') {
      const fallback = await caches.match('/');
      if (fallback) return fallback;
    }

    return new Response(
      JSON.stringify({ error: 'offline', message: 'No cached data available' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, response.clone());
        });
      }
      return response;
    })
    .catch(() => {
      console.log('[SW] SWR revalidation failed:', request.url);
      return cached;
    });

  return cached || fetchPromise;
}
