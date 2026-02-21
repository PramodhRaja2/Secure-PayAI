const CACHE_NAME = 'securepay-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/securepay_app_icon.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
