import aframe from "aframe";
import { bindEvent } from "aframe-event-decorators";
import { declareMethod, bind, method } from "@micosmo/core";
import { startProcess, msWaiter, waiter } from '@micosmo/ticker/aframe-ticker';

const PressTime = 0.1;

aframe.registerComponent("button", {
  schema: {
    pressedColor: { type: "color", default: "red" },
    playCooldown: { type: "number", default: 0.5 },
    keyid: { type: 'string', default: '' },
    events: { type: 'array', default: ['triggerDown', 'triggerUp'] }
  },
  init() {
    this.oldColour = this.el.getAttribute("material").color;
    this.isPressed = false;
    this.isCooldown = false;
  },
  update(oldData) {
    if (oldData.keyid !== this.data.keyid) {
      removeKeyListeners(this, oldData.keyid);
      addKeyListeners(this, this.data.keyid);
    }
    if (oldData.events !== this.data.events) {
      removeEventListeners(this, oldData.events);
      addEventListeners(this, this.data.events);
    }
  },
  remove() {
    removeKeyListeners(this, this.data.keyid);
    removeEventListeners(this, this.data.events);
  },
  play() {
    // Stop button from being immediately pressed after starting.
    this.isCooldown = true;
    startProcess(waiter(Math.max(PressTime, this.data.playCooldown), clearCooldown.bind(this)));
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
    startProcess(waiter(PressTime, clearCooldown.bind(this)));
  }
});

var clearCooldown = declareMethod(function () {
  this.isCooldown = false;
});

const keydown = declareMethod(function () {
  this.press();
  return true;
});
const keyup = declareMethod(function () {
  this.release();
  return true;
});

function removeKeyListeners(button, keyid) {
  if (!keyid)
    return;
  this.el.sceneEl.systems.keyboard.removeListeners(button, keyid === '' ? [] : [keyid]);
  const sfx = keyid === '' ? '' : `_${keyid}`;
  delete button[`keydown${sfx}`];
  delete button[`keyup${sfx}`];
}

function addKeyListeners(button, keyid) {
  const sfx = keyid === '' ? '' : `_${keyid}`;
  button[`keydown${sfx}`] = method(keydown);
  button[`keyup${sfx}`] = method(keyup);
  button.el.sceneEl.systems.keyboard.tryAddListeners(button, keyid === '' ? [] : [keyid]);
}

const singleEventListener = declareMethod(function () {
  this.press();
  startProcess(msWaiter(100, () => this.release()));
});

function removeEventListeners(button, events) {
  if (!events)
    return;
  const downEvent = events[0] && events[0] !== '' ? events[0] : undefined;
  const upEvent = events[1] && events[1] !== '' ? events[1] : undefined;
  if (downEvent && upEvent) {
    button.el.removeEventListener(downEvent, bind(button.press, button));
    button.el.removeEventListener(upEvent, bind(button.release, button));
  } else if (downEvent)
    button.el.removeEventListener(downEvent, bind(singleEventListener, button));
  else if (upEvent)
    button.el.removeEventListener(upEvent, bind(singleEventListener, button));
}

function addEventListeners(button, events) {
  const downEvent = events[0] && events[0] !== '' ? events[0] : undefined;
  const upEvent = events[1] && events[1] !== '' ? events[1] : undefined;
  if (downEvent && upEvent) {
    button.el.addEventListener(downEvent, bind(button.press, button));
    button.el.addEventListener(upEvent, bind(button.release, button));
  } else if (downEvent)
    button.el.addEventListener(downEvent, bind(singleEventListener, button));
  else if (upEvent)
    button.el.addEventListener(upEvent, bind(singleEventListener, button));
}
