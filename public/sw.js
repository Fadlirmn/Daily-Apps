/* Arunika service worker: app-shell offline + runtime cache aset GET same-origin.
 * API (/api/*) selalu network-only — data keuangan tidak pernah disajikan basi. */
const VERSION = "arunika-v1"
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/favicon.svg"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith("/api/")) return // network-only

  event.respondWith(
    caches
      .match(request, { ignoreSearch: request.url.includes("?tab=") })
      .then((hit) => {
        const miss = fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(VERSION).then((cache) => cache.put(request, copy))
            }
            return res
          })
          .catch(() =>
            request.mode === "navigate" ? caches.match("/index.html") : hit,
          )
        return hit || miss
      }),
  )
})
