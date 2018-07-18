/**
 * Register the service worker.
 */
if (navigator.serviceWorker) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(_ => {
      console.log('SW is registered!');
      // Then later, request a one-off sync:
      navigator.serviceWorker.ready.then(function(swRegistration) {
        console.log('registerwhenready');
        return swRegistration.sync.register('dataSync');
      });
    })
    .catch(err => console.log('SW registration ', err));
}
