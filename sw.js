// code largely inspired by Udacity's Offline Web application course (ud899)
const cacheMain = 'restareviews-v1';
const cacheImages = 'restareviewsPhotos-v1';
const urlsToCache = [
  '/',
  '/sw.js',
  '/restaurant.html',
  '/css/styles.css',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/js/swregister.js',
  '/data/restaurants.json',
  'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.0/normalize.min.css'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    // open main cache and add the resources urls from urlsToCache
    caches.open(cacheMain).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      cacheNames
        .filter(function(cacheName) {
          /* commented the solution studied with Udacity course
           * and "widened" to manage the two chaches' names
           */
          // if(cacheName.startsWith('restareviews-') && cacheName != cacheMain) console.log(cacheName)
          return (
            (cacheName.startsWith('restareviews-') && cacheName != cacheMain) ||
            (cacheName.startsWith('restareviewsPhotos-') &&
              cacheName != cacheImages)
          );
        })
        .map(function(cacheName) {
          return caches.delete(cacheName);
        });
    })
  );
});

self.addEventListener('fetch', function(event) {
  //console.log(event.request);
  const requestUrl = new URL(event.request.url);
  //console.log(requestUrl.origin);
  //save photos and various images in the defined cache
  if (
    requestUrl.origin === location.origin &&
    (requestUrl.pathname.endsWith('.jpg') ||
      requestUrl.pathname.endsWith('.webp') ||
      requestUrl.pathname.endsWith('.png'))
  ) {
    event.respondWith(
      caches.open(cacheImages).then(cache => {
        return cache.match(event.request).then(response => {
          //if photo is already present return it fro mcache
          if (response) return response;
          //else save it in cache and return
          cache.add(event.request);
          return fetch(event.request);
        });
      })
    );
  } else if (requestUrl.pathname.startsWith('/restaurant.html')) {
    event.respondWith(
      caches
        .match('restaurant.html')
        .then(response => response || fetch(event.request))
    );
  } else {
    //all other requests..
    event.respondWith(
      caches
        .match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
