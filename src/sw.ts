/// <reference lib="webworker" />
// Tipi utili per Workbox
declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any }

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// --- Lifecycle ---
self.skipWaiting()
clientsClaim()

// --- Precache build (iniettato da vite-plugin-pwa) ---
precacheAndRoute(self.__WB_MANIFEST || [])
cleanupOutdatedCaches()

// === CACHING POLICIES ===
// 1) ROUTE SPA (navigazioni): NetworkFirst (o cambia in CacheFirst se vuoi zero rete)
const navigationHandler = new NetworkFirst({
  cacheName: 'html-pages',
  networkTimeoutSeconds: 3,
})
registerRoute(new NavigationRoute(navigationHandler))

// 2) API: Stale-While-Revalidate
registerRoute(
  ({ url }) => /^https?:\/\/api\.tuodominio\.tld\/.*/i.test(url.href),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 })],
  })
)

// 3) Immagini: CacheFirst
registerRoute(
  ({ request }) => /\.(png|jpg|jpeg|svg|gif|webp)$/i.test(request.url),
  // ({ url }) =>     /\.(png|jpg|jpeg|svg|gif|webp)$/i.test(url.pathname)
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  })
)



// --- utils ------------------------------------------------------------------
function normalizePayload(content: string | (NotificationOptions & { title?: string; data?: any })) {
  const base = typeof content === 'string' ? { title: content } : (content || {})
  const title = base.title || '👋'
  const data = base.data || {}
  const url = data.url || '/'
  const options: NotificationOptions = {
    ...base,
    data: { ...data, url },
    icon: base.icon ?? '/img/logo/pwa.png',
    tag: base.tag ?? `default-${new Date().toISOString().slice(0, 10)}`,
  }  
  return { title, options }
}

async function show(title: string, options: NotificationOptions) {
  const reg = (self as any).registration
  if (reg?.showNotification && Notification?.permission === 'granted') {
    await reg.showNotification(title, options)
  }
}

// --- push handler ------------------------------------------------------------
self.addEventListener('push', (event: any) => {
  event.waitUntil((async () => {
    try {
      const json = event?.data ? event.data.json() : null;
      if (!json?.notification) return
      const { title, options } = normalizePayload(json.notification);
      await show(title, options)
    } catch (err) {
      await show('Nuovo aggiornamento', { body: 'Apri l’app per i dettagli', data: { url: '/' } })
    }
  })())
})

// --- click handler -----------------------------------------------------------
self.addEventListener('notificationclick', (event: any) => {
  const url = event?.notification?.data?.url || '/'
  event.notification?.close()

  event.waitUntil((async () => {
    const all = await (self as any).clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of all) {
      // se la scheda è già sullo stesso origin, prova a navigarla
      try {
        if ('navigate' in client && new URL(client.url).origin === self.origin) {
          await client.focus()
          await client.navigate(url)
          return
        }
      } catch {/* ignore */ }
    }
    await (self as any).clients.openWindow(url)
  })())
})
