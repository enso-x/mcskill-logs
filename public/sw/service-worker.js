const CACHE_NAME = '[pixelmon][panel][cache]';
const urlsToCache = [
	'/styles/datepicker.minimal.css',
	'/styles/globals.css',
	'/logs.js'
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then((cache) => {
				return cache.addAll(urlsToCache);
			})
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					return caches.delete(cacheName);
				})
			);
		})
	);
});

self.addEventListener('fetch', function(event) {
	event.respondWith(caches.open(CACHE_NAME).then((cache) => {
		return cache.match(event.request).then((cachedResponse) => {
			return cachedResponse || fetch(event.request.url).then((fetchedResponse) => {
				cache.put(event.request, fetchedResponse.clone());

				return fetchedResponse;
			});
		});
	}));
});
