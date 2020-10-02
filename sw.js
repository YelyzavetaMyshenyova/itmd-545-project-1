// String to identify site cache
const site_cache = 'site_cache';
// String to identify the offline path
const site_offline_path = '/offline/'

// Object to hold supporting and essential assets
// Each asset is identified by a simple (absolute) path,
// represented as a string
const site_autocached_assets = {
  essential: [ site_offline_path ],
  supporting: []
};

// The first step in a ServiceWorker's life cycle is to install it...
addEventListener('install', function(e) {
  console.log('Preparing to install the service worker...');
  // Uncomment to skip the usual waiting period (all active windows and
  // tabs must be closed). This has the effect of immediately firing the
  // 'activated' event, listened for below
  //
  //self.skipWaiting();
  //
  e.waitUntil(
    caches.open(site_cache)
    .then(function(c) {
      // non-essential/nice-to-have assets are added asynchronously
      c.addAll(site_autocached_assets.supporting);
      // *synchronously* add only for essential assets and fallbacks
      return c.addAll(site_autocached_assets.essential);
    })
    .catch(function(e) {
      console.error('Caches error:', e);
    })
  );
// end install event listener
});

// Once the ServiceWorker has been installed, it must be activated. Ordinarily, that will only
// happen if all tabs and windows open to your site on a user's computer are closed. But the
// call to skipWaiting() above is more aggressive, and activates the ServiceWorker immediately.
// The primary tasks of the activate event function is to check all existing caches and delete
// any that aren't listed in the site_cache_list created above
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
          return caches.match(site_offline_path);
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
