/* global THREE */
import aframe from "aframe";
import { copyValues } from '@micosmo/core';
import { startProcess, msWaiter } from '@micosmo/ticker/aframe-ticker';

aframe.registerComponent('misound', {
  schema: {
    autoplay: { default: false },
    distanceModel: { default: 'inverse', oneOf: ['linear', 'inverse', 'exponential'] },
    loop: { default: false },
    maxDistance: { default: 10000 },
    maxPoolsize: { default: 1 }, // Poolsize can be dynamically extended up to this number.
    offset: { default: 0 },
    on: { default: '' },
    pausePolicy: { default: 'pause', oneOf: ['pause', 'stop'] },
    poolPolicy: { default: 'warn', oneOf: ['warn', 'error', 'discard', 'ignore'] },
    poolSize: { default: 1 },
    positional: { default: true },
    refDistance: { default: 1 },
    repeat: {
      default: {},
      parse: function(v) {
        return typeof v === "object" ? v : (() => {
          const [count, interval, fade] = v.split(',').map(s => Number.parseFloat(s.trim(' ')));
          return {
            count: count || 0,
            interval: interval || 0, // Wait interval im milliseconds
            fade: fade || 0 // Amount to decrease from the volume
          };
        })();
      },
      stringify: v => `{count:${v.count},interval:${v.interval},fade:${v.fade}}`
    },
    rolloffFactor: { default: 1 },
    src: { type: 'audio' },
    volume: { default: 1 },
    // '_state' is an internal schema property that holds call level interface data. It is
    // included here to allow the data to be displayed in the browser inspector.
    _state: {
      default: {},
      parse: o => o,
      stringify: o => `{volume:${o.volume}, playbackRate:${o.playbackRate}}`
    }
  },

  multiple: true,

  init: function () {
    var self = this;

    this.listener = null;
    this.audioLoader = new THREE.AudioLoader();
    this.pool = new THREE.Group();
    this.loaded = false;
    this.mustPlay = false;
    this.state = this.data._state;

    // Don't pass evt because playSound takes a function as parameter.
    this.playSoundBound = function () { self.playSound(); };
  },

  update: function (oldData) {
    var data = this.data;
    var i;
    var sound;
    var srcChanged = data.src !== oldData.src;

    // Create new sound if not yet created or changing `src`.
    if (srcChanged) {
      if (!data.src) { return; }
      this.setupSound();
    }

    for (i = 0; i < this.pool.children.length; i++) {
      sound = this.pool.children[i];
      if (data.positional) {
        sound.setDistanceModel(data.distanceModel);
        sound.setMaxDistance(data.maxDistance);
        sound.setRefDistance(data.refDistance);
        sound.setRolloffFactor(data.rolloffFactor);
      }
      sound.setLoop(data.loop);
      sound.isPaused = false;
    }
    if (!this.state.volume)
      this.state.volume = data.volume; // Only initialise volume. this.data.volume is the default.

    if (data.on !== oldData.on) {
      this.updateEventListener(oldData.on);
    }

    // All sound values set. Load in `src`.
    if (srcChanged) {
      var self = this;

      this.loaded = false;
      this.audioLoader.load(data.src, function (buffer) {
        for (i = 0; i < self.pool.children.length; i++) {
          sound = self.pool.children[i];
          sound.setBuffer(buffer);
        }
        self.loaded = true;

        // Remove this key from cache, otherwise we can't play it again
        THREE.Cache.remove(data.src);
        if (self.data.autoplay || self.mustPlay) { self.playSound(); }
        self.el.emit('sound-loaded', self.evtDetail, false);
      });
    }
  },

  pause() {
    if (this.data.pausePolicy === 'pause')
      this.pauseSound();
    else
      this.stopSound();
    this.removeEventListener();
  },

  play() {
    if (this.data.autoplay)
      this.playSound();
    else if (this.isPaused)
      this.resumeSound();
    this.updateEventListener();
  },

  remove: function () {
    var i;
    var sound;

    this.removeEventListener();

    if (this.el.getObject3D(this.attrName)) {
      this.el.removeObject3D(this.attrName);
    }

    try {
      for (i = 0; i < this.pool.children.length; i++) {
        sound = this.pool.children[i];
        sound.disconnect();
      }
    } catch (e) {
      // disconnect() will throw if it was never connected initially.
      console.warn('micosmo:component:misound:remove: Audio source not properly disconnected');
    }
  },

  /**
  *  Update listener attached to the user defined on event.
  */
  updateEventListener: function (oldEvt) {
    var el = this.el;
    if (oldEvt) { el.removeEventListener(oldEvt, this.playSoundBound); }
    el.addEventListener(this.data.on, this.playSoundBound);
  },

  removeEventListener: function () {
    this.el.removeEventListener(this.data.on, this.playSoundBound);
  },

  /**
   * Removes current sound object, creates new sound object, adds to entity.
   *
   * @returns {object} sound
   */
  setupSound: function () {
    var el = this.el;
    var i;
    var sceneEl = el.sceneEl;
    var sound;

    if (this.pool.children.length > 0) {
      this.stopSound();
      el.removeObject3D('sound');
    }

    // Only want one AudioListener. Cache it on the scene.
    var listener = this.listener = sceneEl.audioListener || new THREE.AudioListener();
    sceneEl.audioListener = listener;

    if (sceneEl.camera) {
      sceneEl.camera.add(listener);
    }

    // Wait for camera if necessary.
    sceneEl.addEventListener('camera-set-active', function (evt) {
      evt.detail.cameraEl.getObject3D('camera').add(listener);
    });

    // Create [poolSize] audio instances and attach them to pool
    this.pool = new THREE.Group();
    for (i = 0; i < this.data.poolSize; i++) {
      sound = this.data.positional
        ? new THREE.PositionalAudio(listener)
        : new THREE.Audio(listener);
      this.pool.add(sound);
    }
    el.setObject3D(this.attrName, this.pool);

    this.nPlaying = 0;
    for (i = 0; i < this.pool.children.length; i++) {
      sound = this.pool.children[i];
      sound.onEnded = fOnEnded(this, sound);
    }
  },

  /**
   * Pause all the sounds in the pool.
   */
  pauseSound: function () {
    if (!this.isPlaying || this.isPaused)
      return;

    var i;
    var sound;
    this.isPlaying = false;
    for (i = 0; i < this.pool.children.length; i++) {
      sound = this.pool.children[i];
      if (!sound.source || !sound.source.buffer || !sound.isPlaying || sound.isPaused) {
        continue;
      }
      sound.isPaused = true;
      sound.pause();
    }
    this.isPaused = true;
  },

  /**
   * Resume all the sounds in the pool.
   */
  resumeSound() {
    if (this.isPlaying || !this.isPaused)
      return;
    this.isPaused = false;
    this.isPlaying = true;
    for (let i = 0; i < this.pool.children.length; i++) {
      const sound = this.pool.children[i];
      if (sound.isPaused) {
        sound.play();
        sound.isPaused = false;
      }
    }
  },

  /**
   * Look for an unused sound in the pool and play it if found.
   */
  playSound: function (processSound) {
    if (this.isPaused)
      this.stopSound();
    else {
      if (this.nPlaying >= this.pool.children.length) {
        if (this.nPlaying < this.data.maxPoolSize) {
          const listener = this.pool.children[0].listener;
          const audio = this.data.positional ? new THREE.PositionalAudio(listener) : new THREE.Audio(listener);
          this.pool.add(audio);
          audio.onEnded = fOnEnded(this, audio);
        } else if (this.data.poolPolicy === 'error') {
          throw new Error('micosmo:component:misound:playSound: Maximum sound instances exceeded');
        } else if (this.data.poolPolicy === 'discard') {
          const iAudio = findLongestRunningAudio(this);
          const audio = this.pool.children[iAudio];
          audio.stop();
          this.nPlaying--;
        } else if (this.data.poolPolicy === 'ignore')
          return;
      }
    }
    if (this.data.offset !== 0) {
      for (let i = 0; i < this.pool.children.length; i++) {
        const sound = this.pool.children[i];
        if (!sound.isPlaying && !sound.isPaused)
          sound.offset = this.data.offset;
      }
    }

    var found, i, sound;
    if (!this.loaded) {
      console.warn('micosmo:component:misound:playSound: Sound not loaded yet. It will be played once it finished loading');
      this.mustPlay = true;
      return;
    }

    found = false;
    this.isPlaying = true;
    const data = this.data;
    for (i = 0; i < this.pool.children.length; i++) {
      sound = this.pool.children[i];
      if (!sound.isPlaying && sound.buffer && !found) {
        if (processSound) { processSound(sound); }
        if (data.offset !== 0)
          sound.offset = data.offset; // Set the starting offset for the audio.
        if (data.repeat.count > 0)
          sound._repeat = copyValues(data.repeat);
        sound.setVolume(this.state.volume);
        sound.play();
        sound.isPaused = false;
        found = true;
        continue;
      }
    }

    if (!found) {
      console.warn('micosmo:component:misound:playSound: All sound instances are playing. ');
      return;
    }
    this.mustPlay = false;
    this.nPlaying++;
  },

  /**
   * Stop all the sounds in the pool.
   */
  stopSound: function () {
    var i, sound;
    this.isPlaying = false;
    this.isPaused = false;
    for (i = 0; i < this.pool.children.length; i++) {
      sound = this.pool.children[i];
      if (!sound.source || !sound.source.buffer) { return; }
      sound.stop();
      sound.offset = 0;
      delete sound._repeat;
    }
    if (this.nPlaying > 0) {
      const detail = self.evtDetail;
      detail.reason = 'stop';
      self.el.emit('sound-ended', detail, false); // Make sure listeners know when sounds have stopped
      this.nPlaying = 0;
    }
  },

  getPlaybackRate() {
    return this.state.playbackRate || 1;
  },

  setPlaybackRate(rate) {
    this.state.playbackRate = rate;
    for (let i = 0; i < this.pool.children.length; i++) {
      const sound = this.pool.children[i];
      if (sound.isPlaying) {
        // May set the playback rate multiple times before a pause so need to adjust
        // the offset each time its changed. This is not handled properly in THREE.Audio
        // Does mean resetting the startTime. Yuk
        sound.offset += (sound.context.currentTime - sound.startTime) * sound.playbackRate;
        sound.startTime = sound.context.currentTime;
      }
      sound.setPlaybackRate(rate);
    }
  },

  getVolume() {
    return this.state.volume;
  },

  setVolume(v) {
    this.state.volume = v || (v = this.data.volume);
    for (let i = 0; i < this.pool.children.length; i++)
      this.pool.children[i].setVolume(v);
    return v
  },
});

function fOnEnded(self, audio) {
  return function () {
    audio.stop(); // Need to clear the sound offset when the sound has ended.
    if (audio._repeat) {
      if (--audio._repeat.count > 0) {
        if (self.data.offset !== 0)
          audio.offset = self.data.offset; // Set the starting offset for the audio.
        audio.setVolume(audio.getVolume() - audio._repeat.fade);
        startProcess(msWaiter(audio._repeat.interval, () => {
          if (self.isPaused) {
            audio.play();
            audio.pause();
            audio.isPaused = true;
          } else if (!self.isPlaying)
            return;
          audio.play();
        }));
        return;
      }
      delete audio._repeat;
    }
    if (--self.nPlaying <= 0) {
      const detail = self.evtDetail;
      detail.reason = 'end';
      self.el.emit('sound-ended', detail, false); // Only emit once all sounds have stopped playing.
      self.nPlaying = 0;
      self.isPlaying = false;
    }
  };
};

function findLongestRunningAudio(sound) {
  let iAudio = 0;
  let longTime = sound.pool.children[0].context.currentTime;
  for (let i = 1; i < sound.pool.children.length; i++) {
    const audio = sound.pool.children[i];
    if (audio.context.currentTime > longTime) {
      iAudio = i;
      longTime = audio.context.currentTime;
    }
  }
  return iAudio;
}
