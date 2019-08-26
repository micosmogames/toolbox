/* global THREE */
// Aframe Sound component patches.

export const soundProtPatch = {
  getPlaybackRate() {
    return this.pool.children[0].getPlaybackRate();
  },
  setPlaybackRate(rate) {
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
    return this.data.volume;
  },
  setVolume(v) {
    for (let i = 0; i < this.pool.children.length; i++)
      this.pool.children[i].setVolume(v);
    this.data.volume = this.oldData.volume = v;
    return v
  },
  setupSound() {
    this.__patched__.setupSound.call(this);
    // Need to clear the sound offset when the sound has ended.
    // Wrap the onEnded function of Sound.
    this.nPlaying = 0;
    for (let i = 0; i < this.pool.children.length; i++) {
      const sound = this.pool.children[i];
      sound.onEnded = fOnEnded(this, sound);
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
  stopSound() {
    this.__patched__.stopSound.call(this);
    this.isPaused = false;
    this.nPlaying = 0;
    for (let i = 0; i < this.pool.children.length; i++)
      this.pool.children[i].offset = 0;
  },
  playSound(processSound) {
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
          throw new Error('component:sound: Maximum sound instances exceeded');
        } else if (this.data.poolPolicy === 'discard') {
          const iAudio = findLongestRunningAudio(this);
          const audio = this.pool.children[iAudio];
          audio.stop();
          this.nPlaying--;
        }
      }
    }
    if (this.data.offset !== 0) {
      for (let i = 0; i < this.pool.children.length; i++) {
        const sound = this.pool.children[i];
        if (!sound.isPlaying && !sound.isPaused)
          sound.offset = this.data.offset;
      }
    }
    this.__patched__.playSound.call(this, processSound);
    this.nPlaying++;
  },
  pauseSound() {
    if (!this.isPlaying || this.isPaused)
      return;
    this.__patched__.pauseSound.call(this);
    this.isPaused = true;
  },
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

function fOnEnded(sound, audio) {
  const f = audio.onEnded;
  return function () {
    audio.stop();
    f.call(audio);
    if (--sound.nPlaying <= 0) {
      sound.nPlaying = 0;
      sound.isPlaying = false;
    }
  };
}

export function soundSchemaPatch(prot) {
  const schema = prot.schema;
  schema.offset = {
    default: 0,
    parse: schema.poolSize.parse,
    stringify: schema.poolSize.stringify,
    type: 'number'
  };
  schema.maxPoolSize = {
    default: 1,
    parse: schema.poolSize.parse,
    stringify: schema.poolSize.stringify,
    type: 'number'
  };
  schema.poolPolicy = {
    default: 'warn', // 'warn', 'error', 'discard'
    parse: schema.on.parse,
    stringify: schema.on.stringify,
    type: 'string',
    oneOf: ['warn', 'error', 'discard']
  };
  schema.pausePolicy = {
    default: 'pause', // 'pause', 'stop'
    parse: schema.on.parse,
    stringify: schema.on.stringify,
    type: 'string',
    oneOf: ['pause', 'stop']
  };
}
