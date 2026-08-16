// Minimal offline support for the Goat Farm app.
// Strategy: network-first for pages (always try to get fresh data when
// online), falling back to the last cached copy of that exact page when
// offline. Static assets (icons, logo) are cache-first since they never
// change. This does NOT support offline data entry — writes still need
// a live connection — it just means pages you've already opened will
// still open (read-only, possibly stale) if signal drops mid-visit.

const CACHE_NAME = "goat-farm-v1";
const STATIC_ASSETS = ["/logo.png", "/logo-small.png", "/icon-192.png", "/icon-512.png", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests — never intercept server actions (POST) or
  // other methods, since those must always hit the network live.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Don't cache API/auth routes — those should always be live or fail loudly.
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match("/dashboard"))
      )
  );
});
