(function() {
  if (!navigator.serviceWorker) return;

  var thisScriptURL = document.currentScript.src;

  // some nasty url hacking that should probably be done some other way
  var urlRE = /^.*offline-book-demo\/([^\/]+)\//.exec(location.href);
  var publicationName = urlRE[1];
  var publicationBaseURL = urlRE[0];

  var ui = document.querySelector('.page-controls');

  navigator.serviceWorker.register(new URL('sw.js', thisScriptURL));


  if (navigator.serviceWorker.controller) {
    initPageControls();
  }
  else {
    navigator.serviceWorker.addEventListener('controllerchange', function onControllerChange() {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      initPageControls();
    });
  }

  function initPageControls() {
    caches.has(publicationName).then(function(isCached) {
      ui.innerHTML =
        '<div><label><input type="checkbox" class="work-offline"> Enable a seamless reading experience of this Web publication while offline.</label></div>' +
        '<div class="status"></div>' +
      '';

      var status = ui.querySelector('.status');
      var checkbox = ui.querySelector('.work-offline');

      checkbox.checked = isCached;

      checkbox.addEventListener('change', function(event) {
        if (!this.checked) {
          caches.delete(publicationName);
          status.textContent = "Cache cleared. This Web publication is no longer offline-enabled.";
        }
        else {
          status.textContent = "Caching all resources for this Web publication…";

          fetch(publicationBaseURL + 'pub-manifest.json').then(function(response) {
            return response.json();
          }).then(function(data) {
            data.assets.push('pub-manifest.json');
            return caches.open(publicationName).then(function(cache) {
              return cache.addAll(data.assets.map(function(url) {
                return new URL(url, publicationBaseURL);
              }));
            });
          }).then(function() {
            status.textContent = 'Caching complete! This Web publication is now readable offline.';
          }).catch(function(err) {
            console.log(err);
            status.textContent = 'Something failed :(';
          });
        }
      });
    });
  }
}());
