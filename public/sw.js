// Ascned service worker — offline shell + stale-while-revalidate runtime caching.
// Authenticated routes (/app, /auth) are never cached: caching them would leave
// private user data readable on a shared device after logout.
const SHELL_CACHE = 'ascned-shell-v2';
const RUNTIME_CACHE = 'ascned-runtime-v2';
const OFFLINE_URL = '/offline';
const PRIVATE_PREFIXES = ['/app', '/auth'];

function isPrivatePath(pathname) {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isCacheable(request, response) {
  if (!response || !response.ok) return false;
  const cacheControl = response.headers.get('Cache-Control') || '';
  if (/(^|,)\s*(no-store|private)/i.test(cacheControl)) return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  return !isPrivatePath(url.pathname);
}

function offlineResponse() {
  return caches.match(OFFLINE_URL).then(
    (offline) =>
      offline ||
      new Response('Offline', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/plain' },
      })
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(['/', OFFLINE_URL]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        const keep = new Set([SHELL_CACHE, RUNTIME_CACHE]);
        return Promise.all(
          keys
            .filter((key) => (key.startsWith('ascned-') || key.startsWith('veyro-')) && !keep.has(key))
            .map((key) => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

function notificationTarget(value) {
  try {
    const url = new URL(typeof value === 'string' ? value : '/app/tasks', self.location.origin);
    if (url.origin !== self.location.origin) return '/app/tasks';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/app/tasks';
  }
}

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = typeof payload.title === 'string' && payload.title ? payload.title : 'Ascned reminder';
  const options = {
    body:
      typeof payload.body === 'string' && payload.body
        ? payload.body
        : 'You have a reminder waiting in Ascned.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: typeof payload.tag === 'string' && payload.tag ? payload.tag : 'ascned-reminder',
    data: { url: notificationTarget(payload.url) },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = notificationTarget(event.notification.data && event.notification.data.url);

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            if ('navigate' in client) {
              client.navigate(target).catch(() => {});
            }
            return client.focus();
          }
        }
        return self.clients.openWindow(target);
      })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for navigations, falling back to cache/offline page.
  if (request.mode === 'navigate') {
    if (isPrivatePath(url.pathname)) {
      event.respondWith(fetch(request).catch(offlineResponse));
      return;
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isCacheable(request, response)) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || offlineResponse())
        )
    );
    return;
  }

  if (isPrivatePath(url.pathname)) return;

  // Stale-while-revalidate for public same-origin GET requests.
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (isCacheable(request, response)) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
