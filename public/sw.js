const CACHE_NAME = 'cadenzio-v1';
const BASE_PATH = (() => {
  const { pathname } = self.location;
  if (pathname.endsWith('sw.js')) {
    const scope = pathname.slice(0, -'sw.js'.length);
    return scope.endsWith('/') ? scope : `${scope}/`;
  }
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
})();

const urlsToCache = [
  BASE_PATH,
  `${BASE_PATH}favicon.svg`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}icon-192.png`,
  `${BASE_PATH}icon-512.png`
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache =>
        Promise.all(
          urlsToCache.map(url =>
            cache.add(url).catch(error => {
              console.warn('Skipping cache entry', url, error);
              return null;
            })
          )
        )
      )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
