/* global Firebase, self, settings, panoAddLater */
(function () {

function getExtension(fn) {
  return fn.substr(fn.lastIndexOf('.'));
}

function WorldManager() {
  this.pending = {
    audio: null,
    image: null
  };
  this.storeUrl = settings.firebaseRootUrl + '/worlds';
}

WorldManager.prototype = {
  init: function () {
    var self = this;

    self.ref = new Firebase(self.storeUrl);
    self.ref.on('child_added', function (snapshot) {
      var key = snapshot.key();
      var data = snapshot.val();
      data.key = key;

      var idx = panoAddLater(data);
      panoIdxByKey[key] = idx;
    });
  },
  create: function () {

    var self = this;

    console.log('Create a world by dragging an image + audio file/URL …');

    uploader.classList.toggle('hidden');

    var widget = uploadcare.Widget('[role=uploadcare-uploader]');

    widget.onUploadComplete(function (file) {
      if (file.isImage) {
        self.pending.image = file;
      } else {
        // TODO: Be smarter here instead of assuming it's an audio file if
        // it's not an image file.
        self.pending.audio = file;
      }

      // Once we've received an image and an audio file, we assume the world
      // is ready to be built.
      if (self.pending.image && self.pending.audio) {
        // TODO: Wait for user acknowledgement (voice command "done")
        // before we actually save the world.

        var audioExt = getExtension(self.pending.audio.name);
        var imageExt = getExtension(self.pending.image.name);

        self.ref.promisePush({
          audio: self.pending.audio.cdnUrl.replace(/^http:/, 'https:') + audioExt,
          image: self.pending.image.cdnUrl.replace(/^http:/, 'https:') + imageExt
        }).then(function (newRef) {
          var key = newRef.key();
          console.log('Successfully created new world: %s', key);
          panoJump(panoIdxByKey[key]);
          uploader.classList.add('hidden');
          widget.value(null);
        });
      }

    });
  },
};

self.WorldManager = new WorldManager();
self.WorldManager.init();

})();
