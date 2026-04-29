// ═══════════════════════════════════════════════════════
//  StreamVault — Service Worker  (sw.js)
//  Strategy: Cache-First for static assets,
//            Network-First for API / Firebase calls,
//            Offline fallback splash for navigation.
// ═══════════════════════════════════════════════════════

const CACHE_NAME = "streamvault-v1";

// Assets to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/firebase-config.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── Install: pre-cache shell assets ──────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS).catch((err) => {
          // Don't block install if some assets are missing
          console.warn("[SW] Pre-cache partial failure:", err);
        });
      })
      .then(() => self.skipWaiting()),
  );
});

// ── Activate: clean up old caches ────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch: routing strategy ───────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, chrome-extension, and Firebase/Google requests
  if (
    request.method !== "GET" ||
    url.protocol === "chrome-extension:" ||
    url.hostname.includes("firebase") ||
    url.hostname.includes("googleapis") ||
    url.hostname.includes("gstatic") ||
    url.hostname.includes("google") ||
    url.hostname.includes("firebaseio")
  ) {
    return; // Fall through to network
  }

  // For same-origin navigation requests → serve index.html (SPA fallback)
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/index.html")));
    return;
  }

  // Cache-first for static assets (.css, .js, .png, .jpg, fonts)
  if (url.pathname.match(/\.(css|js|png|jpg|jpeg|webp|svg|woff2?|ico)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached || new Response("", { status: 503 }));
      }),
    );
    return;
  }

  // Network-first for everything else
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
