// /* global THREE */
import aframe from "aframe";
import { bindEvent } from "aframe-event-decorators";
import * as ticker from './ticker';

const PressTime = 0.1;

aframe.registerComponent("button", {
  schema: {
    pressedColor: { type: "color", default: "red" },
    playCooldown: { type: "number", default: 0.5 }
  },
  init() {
    this.oldColour = this.el.getAttribute("material").color;
    this.isPressed = false;
    this.isCooldown = false;
    this.el.sceneEl.systems.keyboard.tryAddListeners(this);
  },
  play() {
    // Stop button from being immediately pressed after starting.
    this.isCooldown = true;
    ticker.startProcess(ticker.waiter(Math.max(PressTime, this.data.playCooldown), clearCooldown.bind(this)));
  },
  collisionstart: bindEvent(function () {
    this.press();
  }),
  collisionend: bindEvent(function () {
    this.release();
  }),
  press() {
    if (!this.isPressed && !this.isCooldown) {
      const { color, emissive } = this.el.getAttribute("material");
      this.oldColor = color;
      this.oldEmissiveColor = emissive;
      this.el.setAttribute("material", {
        color: this.data.pressedColor,
        emissive: this.data.pressedColor
      });
      this.el.emit("vrbuttondown");
      this.isPressed = true;
    }
  },
  release() {
    this.timer = PressTime;
    this.isCooldown = true;
    this.isPressed = false;
    this.el.emit("vrbuttonup");
    this.el.setAttribute("material", {
      color: this.oldColour,
      emissive: this.oldEmissiveColor
    });
    ticker.startProcess(ticker.waiter(PressTime, clearCooldown.bind(this)));
  },
  keydown(id, key, evt) {
    this.press();
    return true;
  },
  keyup(id, key, evt) {
    this.release();
    return true;
  },
  triggerDown: bindEvent(function () {
    this.press();
  }),
  triggerUp: bindEvent(function () {
    this.release();
  })
});

function clearCooldown() {
  this.isCooldown = false;
}
