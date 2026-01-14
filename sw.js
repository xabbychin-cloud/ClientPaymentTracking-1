const CACHE_NAME = "payment-tracker-cache-v1";

const FILES_TO_CACHE = [
  "/ClientPaymentTracking-1/",
  "/ClientPaymentTracking-1/index.html",
  "/ClientPaymentTracking-1/style.css",
  "/ClientPaymentTracking-1/manifest.json",
  "/ClientPaymentTracking-1/icon-192.png",
  "/ClientPaymentTracking-1/icon-512.png"
];

// INSTALL
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : null)
      )
    )
  );
  self.clients.claim();
});

// FETCH
self.addEventListener("fetch", (event) => {
  // NEVER cache Firebase calls
  if (event.request.url.includes("firebase")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
