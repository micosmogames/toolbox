/* global THREE */
import aframe from "aframe";
import { copyValues } from '@micosmo/core';
import { onLoadedDo } from '@micosmo/aframe/startup';
import { startProcess, msWaiter, iterator, msTimer, tryLocateTicker } from '@micosmo/ticker/aframe-ticker';

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
    fade: { default: 0 }, // Proportion of sound duration to apply fading
    repeat: {
      default: {},
      parse: function(v) {
        return typeof v === "object" ? v : (() => {
          const [count, interval] = v.split(',').map(s => Number.parseFloat(s.trim(' ')));
          return {
            count: count || 0,
            interval: interval || 0, // Wait interval im milliseconds
          };
        })();
      },
      stringify: v => `{ count:${v.count}, interval:${v.interval} }`
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
    this.listener = null;
    this.audioLoader = new THREE.AudioLoader();
    this.pool = new THREE.Group();
    this.loaded = false;
    this.mustPlay = false;
    this.state = this.data._state;

    // Don't pass evt because playSound takes a function as parameter.
    this.playSoundBound = () => this.playSound();
    onLoadedDo(() => { this.ticker = tryLocateTicker(this.el) });
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
      var misound = this;

      this.loaded = false;
      this.audioLoader.load(data.src, function (buffer) {
        for (i = 0; i < misound.pool.children.length; i++) {
          sound = misound.pool.children[i];
          sound.setBuffer(buffer);
        }
        misound.loaded = true;

        // Remove this key from cache, otherwise we can't play it again
        THREE.Cache.remove(data.src);
        if (misound.data.autoplay || misound.mustPlay) { misound.playSound(); }
        misound.el.emit('sound-loaded', misound.evtDetail, false);
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
      console.warn(`micosmo:component:misound:remove: Audio source not properly disconnected. Sound(${id(this)}`);
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
      el.removeObject3D(this.attrName);
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
          throw new Error(`micosmo:component:misound:playSound: Maximum sound instances exceeded. Sound(${id(this)})`);
        } else if (this.data.poolPolicy === 'discard') {
          const iAudio = findLongestRunningAudio(this);
          const audio = this.pool.children[iAudio];
          audio.stop();
          this.nPlaying--;
        } else if (this.data.poolPolicy === 'ignore')
          return;
      }
    }

    var found, i, sound;
    if (!this.loaded) {
      console.warn(`micosmo:component:misound:playSound: Sound not loaded yet. It will be played once it finished loading. Sound(${id(this)})`);
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
        sound.setVolume(this.state.volume);
        sound.play();
        if (data.repeat.count > 0)
          sound._repeat = copyValues(data.repeat);
        else if (data.fade)
          startProcess(fadeoutFor(this, sound, sound.buffer.duration, data.fade), this.ticker);
        sound.isPaused = false;
        found = true;
        continue;
      }
    }

    if (!found) {
      console.warn(`micosmo:component:misound:playSound: All sound instances are playing. Sound(${id(this)})`);
      return;
    }
    this.mustPlay = false;
    this.nPlaying++;
  },

  /**
   * Stop all the sounds in the pool, after fading if requested
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
      const detail = this.evtDetail;
      detail.reason = 'stop';
      this.el.emit('sound-ended', detail, false); // Make sure listeners know when sounds have stopped
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

  getDuration() {
    return this.pool.children.length && this.pool.children[0].buffer ? this.pool.children[0].buffer.duration : 0;
  }
});

function fOnEnded(misound, audio) {
  return function () {
    audio.stop(); // Need to clear the sound offset when the sound has ended.
    if (repeatSound(misound, audio))
      return;
    if (--misound.nPlaying <= 0) {
      const detail = misound.evtDetail;
      detail.reason = 'end';
      misound.el.emit('sound-ended', detail, false); // Only emit once all sounds have stopped playing.
      misound.nPlaying = 0;
      misound.isPlaying = false;
    }
  };
};

function repeatSound(misound, audio) {
  if (!audio._repeat)
    return false;
  const fFadeout = fadeoutFor(misound, audio, audio.buffer.duration, misound.data.fade);
  if (--audio._repeat.count > 0) {
    if (misound.data.offset !== 0)
      audio.offset = misound.data.offset; // Set the starting offset for the audio.
    if (audio._repeat.count === 1 && misound.data.fade > 0) {
      startProcess(iterator(msWaiter(audio._repeat.interval), () => { audio.play() }, fFadeout), misound.ticker);
    } else
      startProcess(msWaiter(audio._repeat.interval, () => { audio.play() }), misound.ticker);
    return true;
  }
  delete audio._repeat;
  return false;
}

function fadeoutFor(misound, audio, duration, fade) {
  duration = duration * 1000;
  return iterator(msTimer(duration, (tm, dt, remain) => {
    audio.setVolume(misound.state.volume * (1 - (duration - remain * fade) / duration));
    return 'more';
  }), () => { audio.setVolume(misound.state.volume) });
}
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

function id(misound) {
  return misound.id || !misound.el.id ? misound.attrName : `Element:${misound.el.id}`;
}
