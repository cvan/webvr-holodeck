/* global self */
(function () {

var panosLoaded = fetchPanos();
var panos = [];

function fetchPanos() {
  return fetch('panos.json').then(function (response) {
    return response.json();
  }).then(function (panosJSON) {
    self.panos = panosJSON;
    return panos;
  });
}

self.panosLoaded = panosLoaded;
self.panos = panos;

})();
