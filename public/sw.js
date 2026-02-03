// NHKA Offline Service Worker - Enhanced Version
const CACHE_NAME = 'nhka-cache-v3';
const STATIC_CACHE = 'nhka-static-v3';
const DATA_CACHE = 'nhka-data-v3';
const DOCUMENT_CACHE = 'nhka-documents-v3';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/rest/v1/gemeentes',
  '/rest/v1/gebruikers',
  '/rest/v1/wyke',
  '/rest/v1/besoekpunte',
  '/rest/v1/pastorale_aksies',
  '/rest/v1/krisis_verslae',
  '/rest/v1/gemeente_program',
  '/rest/v1/lms_kursusse',
  '/rest/v1/dagstukkies'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  self.console.log('[SW] Installing service worker v2...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        self.console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => self.console.log('[SW] Install error:', String(err.message || err)))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  self.console.log('[SW] Activating service worker v2...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete old version caches
              return name.startsWith('nhka-') &&
                !name.endsWith('-v2');
            })
            .map((name) => {
              self.console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests with network-first strategy
  if (isApiRequest(url)) {
    // DO NOT CACHE Edge Functions
    if (url.pathname.includes('/functions/v1/')) {
      return; // Hand over to browser
    }
    event.respondWith(networkFirstStrategy(request, DATA_CACHE));
    return;
  }

  // Handle document/file requests with cache-first strategy
  if (isDocumentRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, DOCUMENT_CACHE));
    return;
  }

  // Handle static assets with cache-first strategy
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Default: network-first for everything else
  event.respondWith(networkFirstStrategy(request, CACHE_NAME));
});

// Check if request is an API request
function isApiRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => url.pathname.includes(pattern)) ||
    url.hostname.includes('supabase');
}

// Check if request is for a document
function isDocumentRequest(url) {
  const docExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
  return docExtensions.some(ext => url.pathname.endsWith(ext)) ||
    url.pathname.includes('/storage/') ||
    url.pathname.includes('/gemeente-dokumente/');
}

// Check if request is for static assets
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ico'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

// Network-first strategy: try network, fallback to cache
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      // Clone the response before caching
      cache.put(request, networkResponse.clone()).catch(() => {
        // Ignore cache put errors
      });
    }

    return networkResponse;
  } catch (error) {
    self.console.log('[SW] Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/');
      if (offlinePage) {
        return offlinePage;
      }
    }

    // Return a proper error response
    return new Response(JSON.stringify({ error: 'Offline', message: 'Nie aanlyn nie' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Cache-first strategy: try cache, fallback to network
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Refresh cache in background (stale-while-revalidate)
    fetch(request)
      .then(async (networkResponse) => {
        if (networkResponse.ok) {
          const cache = await caches.open(cacheName);
          cache.put(request, networkResponse).catch(() => { });
        }
      })
      .catch(() => {
        // Ignore background refresh errors
      });

    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone()).catch(() => { });
    }

    return networkResponse;
  } catch (error) {
    self.console.log('[SW] Failed to fetch:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  if (!type) return;

  switch (type) {
    case 'CACHE_DOCUMENT':
      if (payload && payload.url && payload.name) {
        cacheDocument(payload.url, payload.name);
      }
      break;
    case 'CACHE_DAGSTUKKIES':
      if (payload && payload.data) {
        cacheDagstukkies(payload.data);
      }
      break;
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        if (event.source) {
          event.source.postMessage({ type: 'CACHE_STATUS', payload: status });
        }
      });
      break;
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
  }
});

// Cache a specific document for offline use
async function cacheDocument(url, name) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const cache = await caches.open(DOCUMENT_CACHE);
      await cache.put(url, response);
      self.console.log('[SW] Cached document:', name);

      // Notify clients with simple data
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'DOCUMENT_CACHED',
          payload: { url: String(url), name: String(name), success: true }
        });
      });
    }
  } catch (error) {
    self.console.log('[SW] Failed to cache document:', String(error.message || error));
    // Notify clients of failure
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'DOCUMENT_CACHED',
        payload: { url: String(url), name: String(name), success: false }
      });
    });
  }
}

// Cache dagstukkies data
async function cacheDagstukkies(data) {
  try {
    const cache = await caches.open(DATA_CACHE);
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put('/cached-dagstukkies', response);
    self.console.log('[SW] Cached dagstukkies');
  } catch (error) {
    self.console.log('[SW] Failed to cache dagstukkies:', String(error.message || error));
  }
}

// Clear all caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter(name => name.startsWith('nhka-'))
        .map(name => caches.delete(name))
    );
    self.console.log('[SW] All caches cleared');

    // Notify clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'CACHES_CLEARED', payload: { success: true } });
    });
  } catch (error) {
    self.console.log('[SW] Failed to clear caches:', String(error.message || error));
  }
}

// Get cache status
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};

  for (const name of cacheNames) {
    if (name.startsWith('nhka-')) {
      try {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        status[name] = keys.length;
      } catch {
        status[name] = 0;
      }
    }
  }

  return status;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  self.console.log('[SW] Sync event:', event.tag);

  if (event.tag === 'sync-pastoral-actions') {
    event.waitUntil(notifyClientsToSync('SYNC_PASTORAL_ACTIONS'));
  }

  if (event.tag === 'sync-crisis-reports') {
    event.waitUntil(notifyClientsToSync('SYNC_CRISIS_REPORTS'));
  }

  if (event.tag === 'sync-all') {
    event.waitUntil(notifyClientsToSync('SYNC_ALL'));
  }
});

// Notify clients to sync
async function notifyClientsToSync(type) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: type });
  });
}

// Push notification event handler
self.addEventListener('push', (event) => {
  self.console.log('[SW] Push notification received');

  let data = {
    title: 'NHKA Kennisgewing',
    body: 'Jy het \'n nuwe kennisgewing ontvang.',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'nhka-notification',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    tag: data.tag || 'nhka-notification',
    data: data.data || { url: '/' },
    vibrate: data.priority === 'urgent' ? [200, 100, 200, 100, 200] : [100, 50, 100],
    requireInteraction: data.priority === 'urgent' || data.priority === 'high',
    actions: data.actions || [
      { action: 'view', title: 'Bekyk' },
      { action: 'dismiss', title: 'Sluit' }
    ]
  };

  if (data.priority === 'urgent') {
    options.tag = 'urgent-' + options.tag;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  self.console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  const notificationData = event.notification.data || {};
  let targetUrl = notificationData.url || '/';

  switch (event.action) {
    case 'view':
      targetUrl = notificationData.url || '/';
      break;
    case 'respond':
      targetUrl = '/krisis';
      break;
    case 'rsvp':
      targetUrl = '/program';
      break;
    case 'contact':
      targetUrl = '/pastorale-aksie';
      break;
    case 'dismiss':
      return;
    default:
      targetUrl = notificationData.url || '/';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              payload: {
                action: event.action,
                data: notificationData,
                url: targetUrl
              }
            });
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

// Notification close handler
self.addEventListener('notificationclose', (event) => {
  self.console.log('[SW] Notification closed');

  const notificationData = event.notification.data || {};

  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'NOTIFICATION_DISMISSED',
        payload: { id: notificationData.id || null }
      });
    });
  });
});

// Push subscription change handler
self.addEventListener('pushsubscriptionchange', (event) => {
  self.console.log('[SW] Push subscription changed');

  // Convert subscriptions to simple objects to avoid cloning issues
  let oldSubData = null;
  let newSubData = null;

  try {
    if (event.oldSubscription) {
      const oldJson = event.oldSubscription.toJSON();
      oldSubData = {
        endpoint: oldJson.endpoint,
        keys: oldJson.keys
      };
    }
    if (event.newSubscription) {
      const newJson = event.newSubscription.toJSON();
      newSubData = {
        endpoint: newJson.endpoint,
        keys: newJson.keys
      };
    }
  } catch (e) {
    self.console.log('[SW] Error converting subscription:', String(e.message || e));
  }

  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'PUSH_SUBSCRIPTION_CHANGED',
          payload: { oldSubscription: oldSubData, newSubscription: newSubData }
        });
      });
    })
  );
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(notifyClientsToSync('PERIODIC_SYNC'));
  }
});
