// /* global THREE */

import aframe from "aframe";
import { bindEvent } from "aframe-event-decorators";
import * as ticker from "./ticker";

const states = [
  'on',
  'off',
  'pause',
];

const BasePlaybackRate = 1;
const WarpPlaybackRate = 0.50;
const WarpFadeDuration = 750;
const WarpFadePerTick = (1 - WarpPlaybackRate) / WarpFadeDuration;

aframe.registerComponent("jukebox", {
  schema: {
    tracks: { type: "array" },
    state: { oneof: states, default: "off" },
    currentTrack: { type: "int", default: 0 },
    volume: { type: "number", default: 1 }
  },
  init() {
    this.players = [];
    this.currentPlayer = undefined;
    this.playbackRate = BasePlaybackRate;

    const self = this;
    this.warpProcess = ticker.createProcess({
      name: 'JukeboxWarp',
      onTick: function * (state) {
        yield ticker.timer(0.500, (tm, dt) => {
          self.currentPlayer.setPlaybackRate(self.playbackRate -= dt * WarpFadePerTick);
          return 'more';
        });
        yield ticker.waiter(self.warpDuration - 1);
        yield ticker.timer(0.500, (tm, dt) => {
          self.currentPlayer.setPlaybackRate(self.playbackRate += dt * WarpFadePerTick);
          return 'more';
        });
      },
      onEnd() {
        self.currentPlayer.setPlaybackRate(self.playbackRate = BasePlaybackRate)
      }
    });
  },
  update(oldData) {
    if (oldData.state !== this.data.state) {
      if (this.data.state === 'on') {
        if (oldData.state === 'pause')
          this.resumeCurrentTrack();
        else if (!this.currentPlayer) {
          if (this.soundLoaded) {
            this.startCurrentTrack();
            console.info('jukebox:update: Jukebox switched on');
          } else
            this.oldData.state = this.data.state = 'off';
        }
      } else if (this.data.state === 'pause')
        if (oldData.state === 'on')
          this.pauseCurrentTrack();
        else
          this.oldData.state = this.data.state = oldData.state;
      else if (this.data.state === 'off') {
        this.stopCurrentTrack();
        if (oldData.state === 'on')
          console.info('jukebox:update: Jukebox switched off');
      }
    }
    if (this.currentPlayer) {
      if (oldData.currentTrack !== this.data.currentTrack) {
        this.stopCurrentTrack();
        this.startCurrentTrack();
      }
      if (oldData.volume !== this.data.volume) {
        if (this.currentPlayer)
          this.currentPlayer.setVolume(this.data.volume);
      }
    }
  },

  stopCurrentTrack() {
    if (this.currentPlayer)
      this.currentPlayer.stopSound();
    this.currentPlayer = undefined;
  },
  pauseCurrentTrack() {
    if (this.currentPlayer) {
      this.currentPlayer.pauseSound();
      this.warpProcess.pause();
    }
  },
  resumeCurrentTrack() {
    this.currentPlayer.resumeSound();
    this.warpProcess.resume();
  },
  startCurrentTrack() {
    this.currentPlayer = this.players[this.data.currentTrack];
    this.currentPlayer.setPlaybackRate(this.playbackRate);
    this.currentPlayer.setVolume(this.data.volume);
    // ticker.Process('InterruptSound', [10000], () => this.selectNextTrack()).attach();
    this.currentPlayer.playSound();
  },

  startTimeWarp: bindEvent({ target: '[game-state]' }, function (evt) {
    if (this.currentPlayer) {
      this.warpDuration = evt.detail.duration;
      this.warpProcess.start();
    }
  }),
  endTimeWarp: bindEvent({ target: '[game-state]' }, function () {
    this.warpProcess.stop();
  }),

  "sound-loaded": bindEvent(function (evt) {
    // Switch on the jukebox once the primary track has loaded
    if (this.data.state === 'on' || evt.detail.id !== this.data.tracks[this.data.currentTrack])
      return;
    this.soundLoaded = true;
    const state = document.querySelector('[game-state]').getAttribute('game-state').state;
    if (state !== 'Loading' && state !== 'MainMenu')
      this.el.setAttribute("jukebox", { state: "on" });
  }),
  "sound-ended": bindEvent(function (evt) {
    this.selectNextTrack();
  }),

  selectNextTrack() {
    const totalTracks = this.data.tracks.length;
    let nTrack = this.data.currentTrack;
    nTrack = nTrack + 1 < totalTracks ? nTrack + 1 : 0;
    this.el.setAttribute('jukebox', { currentTrack: nTrack });
  },

  loaded: bindEvent(function () {
    this.data.tracks.forEach((t, idx) => this.getTrack(t, idx));
  }),

  getTrack(t, idx) {
    const attrName = `sound__${t}`
    const components = document.querySelector(`[${attrName}]`).components;
    this.players[idx] = components[attrName];
  }
});
