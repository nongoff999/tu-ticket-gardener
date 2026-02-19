const CACHE_NAME = 'tu-ticket-v4';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/styles.css',
    './css/category-selection.css',
    './css/popup.css',
    './js/app.js',
    './js/data.js',
    './js/firebase.js',
    './js/router.js',
    './js/components.js'
];

// Install Event
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force activate immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('✅ Service Worker: Caching App Shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: Clearing Old Cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim(); // Take control of all pages immediately
});

// Fetch Event — Network-First Strategy
// Try network first, fall back to cache if offline
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Let external resources pass through
    const isLocal = event.request.url.includes(self.location.origin);
    if (!isLocal) return;

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Got a fresh response from network — update cache
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Network failed (offline) — try cache
                return caches.match(event.request).then((cachedResponse) => {
                    return cachedResponse || new Response('Offline', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            })
    );
});
