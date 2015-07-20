/* global Firebase, self, settings, panoAddLater */
(function () {

function WorldManager() {
  this.storeUrl = settings.firebaseRootUrl + '/worlds';
}

WorldManager.prototype = {
  init: function () {
    this.ref = new Firebase(this.storeUrl);
    this.ref.on('child_added', function (snapshot) {
      var key = snapshot.key();
      var data = snapshot.val();
      data.key = key;
      panoAddLater(data);
    });
  },
  create: function () {
    var audio = prompt('URL to audio loop') || null;
    var image = prompt('URL to 360° panoramic image') || null;

    if (image) {
      this.ref.promisePush({
        audio: audio,
        image: image
      }).then(function (newRef) {
        console.log('Successfully created new world: %s', newRef.key());
      });
    }
  }
};

self.WorldManager = new WorldManager();
self.WorldManager.init();

})();
