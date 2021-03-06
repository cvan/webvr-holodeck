/* global Howl, self */
(function () {

var utils = {
  defaultExtend: function (dest, src) {
    // Because `Object.assign` is not available everywhere.
    var ret = {};

    if (dest) {
      Object.keys(src).forEach(function (key) {
        ret[key] = key in dest ? dest[key] : src[key];
      });
    }

    return ret;
  },
  unique: function (list) {
    // Removes duplicates from an array.

    if (!Array.isArray(list)) {
      return list;
    }

    var ret = [];

    list.forEach(function (item) {
      if (ret.indexOf(item) === -1) {
        ret.push(item);
      }
    });

    return ret;
  },
  without: function (obj, blacklist) {
    var ret = Object.create(obj);
    (blacklist || []).forEach(function (key) {
      delete ret[key];
    });
  },
  coerceBool: function (str) {
    if (typeof str === 'boolean') {
      return str;
    }

    if (typeof str === 'string') {
      switch (str.toLowerCase()) {
        case 'true':
        case 'yes':
        case '1':
          return true;
        case 'false':
        case 'no':
        case '0':
          return false;
      }
    }

    return !!str;
  }
};


function Sfx() {
  // This is a Promise-based wrapper around Howl
  // so we can do easy preloading and playing of multiple
  // audio files.

  this.sounds = {};
  this.timeoutPlay = 5000;  // milliseconds.
}

Sfx.prototype = {
  preload: function (urls) {
    // We preload the sound clips so they get added to Howl's internal cache.
    var self = this;

    return new Promise(function (resolve, reject) {

      if (typeof urls === 'string') {
        urls = [urls];
      }

      // Remove dupes so we don't preload the same audio file twice.
      urls = utils.unique(urls).filter(function (x) { return !!x; });

      var lastIdx = urls.length - 1;

      urls.forEach(function (url, idx) {
        // We cache the sounds here so we can play them later
        // and not have to load the same audio file twice.
        self.sounds[url] = new Howl({
          urls: [url],
          onload: function () {
            if (idx === lastIdx) {
              resolve(urls);
            }
          },
          onloaderror: reject
        });
      });

    });
  },
  play: function (url, opts) {
    var self = this;

    if (url in self.sounds) {
      return self._play(url, opts);
    }

    // Otherwise, start up Howl and play the sound.
    return self.preload(url).then(function () {
      return self._play(url, opts);
    });
  },
  _play: function (url, opts) {
    var self = this;

    opts = opts || {};

    opts = utils.defaultExtend(opts, {
      force: 'force' in opts ? utils.coerceBool(opts.force) : false,
      loop: 'loop' in opts ? utils.coerceBool(opts.loop) : false,
      sprite: 'sprite' in opts ? opts.sprite : null,
    });

    var prom = new Promise(function (resolve, reject) {
      if (!url) {
        // No sound to play if no URL given.
        return resolve();
      }

      if (!opts.force && self.sound && self.sound._src === url) {
        // Do not play the same sound again, unless we're forced to.
        return resolve();
      }

      if (self.sound) {
        // Stop the sound that's currently playing.
        self.sound.stop();
      }

      if (opts.sprite) {
        self.sounds[url].sprite(opts.sprite);
      }

      self.sounds[url].loop(opts.loop);

      var sprite = opts.sprite && Object.keys(opts.sprite)[0];

      self.sounds[url].play(sprite, function () {
        self.sound = self.sounds[url];
        resolve(url);
      });

      // There is no error callback that gets called, so we just time out.
      // The event gets called immediately when the `play` method gets called,
      // so the timeout is plenty of enough time to wait for.
      setTimeout(function () {
        var msg = 'Sound could not be played (timeout after ' + self.timeoutPlay + ' ms)';
        reject(new Error(msg));
      }, self.timeoutPlay);
    });

    return prom;
  },
  mute: function () {
    if (this.sound) {
      this.sound.mute();
    }
  },
  unmute: function () {
    if (this.sound) {
      this.sound.unmute();
    }
  },
  toggleSound: function () {
    // Toggle sound by muting/unmuting.
    if (this.sound) {
      this.sound._muted = !!!this.sound._muted;
      if (this.sound._muted) {
        this.sound.unmute();
      } else {
        this.sound.mute();
      }
    }
  }
};

self.sfx = new Sfx();

})();
