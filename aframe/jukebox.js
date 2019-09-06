import aframe from "aframe";
import { createProcess, waiter } from "@micosmo/ticker/aframe-ticker";
import { onLoadedDo } from "./startup";
import { copyValues, equivalentArrays, bind, declareMethod } from "@micosmo/core";

const states = [
  'on',
  'off',
  'pause',
];

aframe.registerComponent("jukebox", {
  schema: {
    soundComponent: { type: "string", default: "sound" },
    tracks: { type: "array" },
    state: { oneof: states, default: "off" },
    currentTrack: { type: "int", default: 0 },
    volume: { type: "number", default: 1 }
  },
  init() {
    this.tracks = [];
    this.sounds = [];
    this.currentSound = undefined;
    this.isPaused = false;

    const self = this;
    this.warpProcess = createProcess({
      name: 'JukeboxWarp',
      onTick: function * (state) {
        yield self.currentSound.warpInStep(self.warpDetail.tmWarpIn, 0.50);
        yield waiter(self.warpDetail.duration - self.warpDetail.tmWarpIn - self.warpDetail.tmWarpOut);
        yield self.currentSound.warpOutStep(self.warpDetail.tmWarpOut, 1);
      }
    });
    onLoadedDo(() => this.loadTracks());
  },
  update(oldData) {
    if (oldData.state !== this.data.state) {
      if (this.data.state === 'on') {
        if (oldData.state === 'pause')
          this.resumeCurrentTrack();
        else if (!this.currentSound) {
          if (this.soundLoaded) {
            this.startCurrentTrack();
            console.info('micosmo:component:jukebox:update: Jukebox switched on');
          }
        }
      } else if (this.data.state === 'pause')
        if (oldData.state === 'on')
          this.pauseCurrentTrack();
        else
          this.oldData.state = this.data.state = oldData.state;
      else if (this.data.state === 'off') {
        this.stopCurrentTrack();
        if (oldData.state === 'on')
          console.info('micosmo:component:jukebox:update: Jukebox switched off');
      }
    }
    if (this.currentSound) {
      if (oldData.currentTrack !== this.data.currentTrack) {
        this.stopCurrentTrack();
        this.startCurrentTrack();
      }
      // Reset the volume of the sound if the volume is set back to 1.
      if (oldData.volume !== this.data.volume)
        this.currentSound.setVolume(this.data.volume === 1 ? undefined : this.data.volume * this.currentSound.data.volume);
    }
    if (oldData.tracks && !equivalentArrays(oldData.tracks, this.data.tracks)) {
      throw new Error(`micosmo:component:jukebox:update: Tracks cannot be modified`);
    } else if (this.tracks.length === 0)
      this.tracks = copyValues(this.data.tracks);
  },
  remove() {
    this.el.setAttribute('jukebox', 'state', 'off');
  },

  stopCurrentTrack() {
    if (this.currentSound) {
      this.currentSound.el.removeEventListener('sound-ended', bind(soundEndedListener, this));
      this.currentSound.stopSound();
    }
    this.currentSound = undefined;
  },
  startNextTrack() {
    if (this.currentSound)
      this.currentSound.stopSound();
    else
      this.selectNextTrack();
  },
  pauseCurrentTrack() {
    if (this.currentSound && !this.isPaused) {
      this.currentSound.pauseSound();
      this.warpProcess.pause();
      this.isPaused = true;
    }
  },
  resumeCurrentTrack() {
    if (this.isPaused) {
      this.currentSound.resumeSound();
      this.warpProcess.resume();
      this.isPaused = false;
    }
  },
  startCurrentTrack() {
    this.currentSound = this.sounds[this.data.currentTrack];
    if (this.data.volume !== 1)
      this.currentSound.setVolume(this.data.volume * this.currentSound.data.volume); // Set relative to the sounds default volume
    // createProcess(waiter(10, () => { this.startNextTrack() })).start();
    this.currentSound.playSound();
    this.currentSound.el.addEventListener('sound-ended', bind(soundEndedListener, this));
    if (this.isPaused)
      this.currentSound.pauseSound();
  },

  startTimeWarp(duration, tmWarpIn, tmWarpOut = tmWarpIn) {
    if (!this.currentSound)
      return;
    this.warpDetail = { duration, tmWarpIn, tmWarpOut };
    this.warpProcess.start();
  },
  endTimeWarp() {
    this.warpProcess.stop();
  },

  selectNextTrack() {
    const totalTracks = this.tracks.length;
    let nTrack = this.data.currentTrack;
    nTrack = nTrack + 1 < totalTracks ? nTrack + 1 : 0;
    this.el.setAttribute('jukebox', { currentTrack: nTrack });
  },

  loadTracks() {
    if (this.tracks.length === 0) {
      // No tracks specified so need to search the element for sound components
      for (const name in this.el.components) {
        if (name.indexOf(this.data.soundComponent) < 0)
          continue;
        const comp = this.el.components[name];
        this.sounds.push(comp)
        this.tracks.push(comp.id);
      }
      if (this.tracks.length === 0)
        throw new Error(`micosmo:component:jukebox: No music tracks have been specified`);
    } else
      this.tracks.forEach((t, idx) => this.getTrack(t, idx))
    // Go through our list of sound components and see if they have loaded. If not we will need
    // to register a 'sound-loaded' listener on the initial track.
    this.sounds.forEach((sound, idx) => {
      if (sound.loaded) {
        if (idx === this.data.currentTrack)
          startJukebox(this);
      } else if (idx === this.data.currentTrack) {
        const listener = () => {
          startJukebox(this);
          sound.el.removeEventListener('sound-loaded', listener);
        }
        sound.el.addEventListener('sound-loaded', listener);
      }
    })
  },

  getTrack(t, idx) {
    const attrName = `${this.data.soundComponent}__${t}`
    const components = document.querySelector(`[${attrName}]`).components;
    this.sounds[idx] = components[attrName];
  }
});

function startJukebox(jb) {
  jb.soundLoaded = true;
  if (jb.data.state === 'on') {
    jb.startCurrentTrack();
    console.info('micosmo:component:jukebox:startJukebox: Jukebox switched on');
  }
}

var soundEndedListener = declareMethod(function () {
  this.selectNextTrack();
});
