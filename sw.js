const CACHE_NAME = 'tu-ticket-v3';
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
    self.skipWaiting(); // Force update
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
                        console.log('🗑️ Service Worker: Clearing Old Cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    // Let external resources (Google Fonts, Google Images) pass through normally
    // unless we specifically want to cache them later.
    const isExternal = event.request.url.startsWith('http');
    const isLocal = event.request.url.includes(self.location.origin);

    if (!isLocal && !event.request.url.includes('fonts.googleapis.com')) {
        return; // Let browser handle external requests
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cache if found, otherwise fetch from network
            return response || fetch(event.request).catch(() => {
                // Optional: Return a fallback for images if offline
                console.log('🌐 Fetch failed, possibly offline');
            });
        })
    );
});
