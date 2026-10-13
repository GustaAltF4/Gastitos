const CACHE_NAME = 'gastitos-v5'
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
]

// Instalar Service Worker y precachear shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    }).then(() => self.skipWaiting())
  )
})

// Activar Service Worker y limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// Receptor de Web Push (despierta el iPhone/Android bloqueado o con la PWA cerrada)
self.addEventListener('push', (event) => {
  let payload = {
    title: '🔔 Gastitos 🐾',
    body: 'Tienes un recordatorio pendiente',
    tag: 'gastitos-push',
    url: '/',
  }

  if (event.data) {
    try {
      const parsed = event.data.json()
      payload = { ...payload, ...parsed }
    } catch {
      try {
        payload.body = event.data.text()
      } catch {}
    }
  }

  const options = {
    body: payload.body || '',
    icon: '/pwa-192x192.png',
    badge: '/apple-touch-icon.png',
    tag: String(payload.tag || Date.now()),
    data: {
      url: payload.url || '/',
    },
  }

  event.waitUntil(self.registration.showNotification(payload.title || '🔔 Gastitos 🐾', options))
})

// También permitir disparo directo vía postMessage desde la app abierta
self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'SHOW_NOW' || !data.payload) return

  const { title, body, tag } = data.payload
  event.waitUntil(
    self.registration.showNotification(title || '🔔 Gastitos 🐾', {
      body: body || '',
      icon: '/pwa-192x192.png',
      badge: '/apple-touch-icon.png',
      tag: String(tag || Date.now()),
      data: { url: '/' },
    })
  )
})

// Al tocar la notificación en la pantalla bloqueada, abrir o enfocar la PWA
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})

// Interceptar peticiones (Offline First / Stale-While-Revalidate)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // No interceptar funciones serverless de Netlify
  if (url.pathname.startsWith('/.netlify/') || url.pathname.startsWith('/api/')) return

  // Solo cachear peticiones del mismo origen y fuentes de Google
  const isSameOrigin = url.origin === self.location.origin
  const isGoogleFont = url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')

  if (!isSameOrigin && !isGoogleFont) return

  // Navegación (HTML): Red primero con respaldo en caché para asegurar actualizaciones
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/')
        })
    )
    return
  }

  // Recursos estáticos (CSS, JS, imágenes, fuentes): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return networkResponse
      }).catch(() => {
        // En caso de fallo de red, se mantiene la respuesta de caché si existía
      })

      return cachedResponse || fetchPromise
    })
  )
})
