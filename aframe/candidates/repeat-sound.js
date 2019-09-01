import aframe from "aframe";
import { bindEvent } from "aframe-event-decorators";

aframe.registerComponent("repeat-sound", {
  schema: {
    times: { type: "int", default: 0 },
    falloffTime: { type: "number", default: 500 }
  },
  init() {
    this.timer = 0;
    this.duration = 0;
    this.sound = undefined;
    this.soundId = undefined;
    this.volume = undefined;
  },
  update(oldData) {
    if (this.data.times !== oldData.times) {
      if (this.data.times > 0 && this.sound) {
        this.el.setAttribute(this.componentName(), "volume", this.volume);
        this.sound.playSound();
      }
      this.timer = 0;
    }
  },
  tick(t, dt) {
    if (this.data.times === 1) {
      this.timer += dt;
      const falloffTime = Math.min(this.data.falloffTime, this.duration);
      const volume =
        this.volume *
        Math.min(this.duration - this.timer, falloffTime) /
        falloffTime;
      this.el.setAttribute(this.componentName(), "volume", volume);
    }
  },
  "sound-ended": bindEvent(function(evt) {
    this.el.setAttribute("repeat-sound", "times", this.data.times - 1);
  }),
  "sound-loaded": bindEvent(function(evt) {
    if (evt.target !== this.el) {
      return; // Don't manage sounds loaded on child elements.
    }
    if (this.sound) {
      console.error(
        `repeat-sound is already managing: ${
          this.soundId
        }, cannot also manage ${evt.detail.id}`
      );
      return;
    }
    this.soundId = evt.detail.id;
    this.sound = evt.target.components[this.componentName()];
    this.duration = this.sound.pool.children[0].buffer.duration * 1000;
    this.volume = this.sound.data.volume;
    if (this.data.times > 0) {
      this.sound.playSound();
    }
  }),
  componentName() {
    return "misound" + (this.soundId ? `__${this.soundId}` : "");
  }
});
