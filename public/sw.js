/* global self, caches */
const CACHE_NAME = "civitra-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/js/app.js",
  "/js/auth.js",
  "/js/chat.js",
  "/js/learn.js",
  "/js/voting-plan.js",
  "/js/quiz.js",
  "/js/booth.js",
  "/js/manifesto.js",
  "/js/profile.js",
  "/js/journey.js",
  "/js/i18n.js",
  "/assets/logo.png",
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
  "https://cdn.jsdelivr.net/npm/marked/marked.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
