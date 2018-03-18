// code largely inspired by Udacity's Offline Web application course (ud899)
const cacheNameMain  = 'restareviews-v4';
const cacheNamePhoto = 'restareviewsPhotos-v2';
const urlsToCache = [
  '/',
  '/sw.js',
  '/restaurant.html',
  '/css/styles.css',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/data/restaurants.json',
  'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.0/normalize.min.css'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    // open main cache and add the resources urls from urlsToCache
    caches.open(cacheNameMain).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});


self.addEventListener('activate', function(event) {
  event.waitUntil(
      caches.keys().then(function(cacheNames) {
        cacheNames.filter(function (cacheName) {
          /* commented the solution studied with Udacity course
           * and "widened" to manage the two chaches' names
           */
          // if(cacheName.startsWith('restareviews-') && cacheName != cacheNameMain) console.log(cacheName)
          return cacheName.startsWith('restareviews-') && cacheName != cacheNameMain || cacheName.startsWith('restareviewsPhotos-') && cacheName != cacheNamePhoto;
        }).map(function(cacheName){
          return caches.delete(cacheName);
        })
      })
    )
});


self.addEventListener('fetch', function(event) {
  //console.log(event.request);
  const requestUrl = new URL(event.request.url);
  //console.log(requestUrl.origin);
  //save photos in the defined cache
  if (requestUrl.origin === location.origin && requestUrl.pathname.endsWith('.jpg')) {
    event.respondWith(
      caches.open(cacheNamePhoto).then(cache => {
        return cache.match(event.request).then(response => {
          //if photo is already present return it fro mcache
          if (response) return response;
          //else save it in cache and return
          cache.add(event.request);
          return fetch(event.request);
        });
      })
    );

  } else { //all other requests..
    event.respondWith(
      caches.match(event.request).then(response => (
        response || fetch(event.request)
      ))
    )
  }
});
