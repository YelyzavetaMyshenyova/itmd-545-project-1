// String to identify site cache
const site_cache = 'site_cache';


// Object to hold supporting and essential assets
// Each asset is identified by a simple (absolute) path,
// represented as a string
const site_autocached_assets = {
  //essential: [ site_offline_path ],
  supporting: []
};

// The first step in a ServiceWorker's life cycle is to install it...
addEventListener('install', function(e) {
  console.log('Preparing to install the service worker...');

});


addEventListener('activate', function(e) {
  console.log('The service worker is activated!');
  e.waitUntil(
    caches.keys()
    .then(function(existing_caches) {
      return Promise.all(
        existing_caches.map(function(existing_cache) {
          if (existing_cache != site_cache) {
            return caches.delete(existing_cache);
          }
        })
      );
    })
    .then(function(){
      // see https://developer.mozilla.org/en-US/docs/Web/API/Clients/claim
      return clients.claim();
    })
  // end waitUntil
  );
// end activate event listener
});

// Intercepting 'fetch' events, fired on browser requests
addEventListener('fetch', function(fe) {
  const request = fe.request;

  // HTML pages: try the network first
  if (request.headers.get('Accept').includes('text/html')) {
    fe.respondWith(
      fetch(request)
      .then(function(fetch_response) {
        const copy = fetch_response.clone();
        fe.waitUntil(
          caches.open(site_cache)
          .then(function(this_cache) {
            this_cache.put(request,copy);
          })
        );
        return fetch_response;
      })
      .catch(function(error) {
        return caches.match(request)
        .then(function(cached_response) {
          if (cached_response) {
            return cached_response;
          }
        //  return caches.match(site_offline_path);
        });

      })
    // end respondWith
    );
    return;
  } else {

    // All other requests: Try the cache first; update the cache from the network
    fe.respondWith(
      caches.match(request)
      .then(function(cached_response) {
        if (cached_response) {
          fe.waitUntil(
            fetch(request)
            .then(function(fetch_response){
              caches.open(site_cache)
              .then(function(this_cache){
                return this_cache.put(request, fetch_response);
              });
            })
          );
          return cached_response;
        }
        return fetch(request)
        .then(function(fetch_response) {
          const copy = fetch_response.clone();
          fe.waitUntil(
            caches.open(site_cache)
            .then(function(this_cache) {
              this_cache.put(request, copy);
            })
          );
          return fetch_response;
        });
      })
    // end respondWith
    );
    return;
  }

});

// Logic to handle push notifications goes here...

addEventListener('push', function(event) {
  if (event.data) {
    event.waitUntil(self.registration.showNotification(event.data.text()));
  } else {
    console.log("Push event, but no data (bad, bad practice).");
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('https://localhost:3000/'));
});
