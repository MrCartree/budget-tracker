console.log('hit SW file');

const fileCacheName = 'file-v1';
const dataCacheName = 'data-v1';

const filesToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/db.js',
  "/index.js",
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

self.addEventListener('install', (event) => {
  console.log('hit install');

  event.waitUntil(
    caches
      .open(fileCacheName)
      .then(cache => {
        return cache.addAll(filesToCache);
      })
      .catch(error => console.log('error caching files on install: ', error))
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('hit activation');

  event.waitUntil(
    caches
      .keys()
      .then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== fileCacheName && key !== dataCacheName) {
              console.log('deleting cache: ', key);
              return caches.delete(key);
            }
          })
        );
      })
      .catch(error => console.log('activation error: ', error))
  );

  self.clients.claim();
});


self.addEventListener('fetch', (event) => {
  console.log(event);

  if (event.request.url.includes('/api')) {
    return event.respondWith(
      caches
        .open(dataCacheName)
        .then(cache => {
          return fetch(event.request)
            .then(response => {
              if (response.status === 200) {
                cache.put(event.request.url, response.clone());
              }

              return response;
            })
            .catch(error => {
              return cache.match(event.request);
            })
        })
        .catch(error => console.log('error fetching api: ', error))
    );
  }

  event.respondWith(
    caches
      .match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((response) => {
            if (!response || !response.basic || !response.status !== 200) {
              console.log('fetch response: ', response);
              return response;
            }

            const responseToCache = response.clone();

            caches
              .open(cacheName)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(error => console.log(error));

            return response;
          });
      })
      .catch(error => console.log('error'))
  )
});
