// Service Worker for Client Payment Tracker
const CACHE_NAME = "payment-tracker-cache-v2";

const FILES_TO_CACHE = [
  "./",               // root of your GitHub Pages project
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
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
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

// FETCH
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // ✅ Only handle requests to your own domain (GitHub Pages)
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  } else {
    // ✅ Let external requests (Firebase, Google Auth, etc.) pass through
    event.respondWith(fetch(event.request));
  }
});
