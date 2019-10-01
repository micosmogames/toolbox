import aframe from "aframe";
import { bindEvent } from "aframe-event-decorators";
import { declareMethod, bind, method, copyValues } from "@micosmo/core";
import { startProcess, msWaiter, waiter } from '@micosmo/ticker/aframe-ticker';

const PressTime = 0.1;

aframe.registerComponent("button", {
  schema: {
    style: { type: 'string', default: '' }, // Maps to a data group
    pressedColor: { type: 'color', default: 'red' },
    height: { type: 'number', default: 0.0 }, // Overrides style
    width: { type: 'number', default: 0.0 }, // Overrides style
    depth: { type: 'number', default: 0.0 }, // Overrides style
    blenderPart: { type: 'string', default: '' }, // Overrides style. Form <src>:<part>
    playCooldown: { type: 'number', default: 0.5 },
    key: { type: 'string', default: '' }, // Only if keymap component not supplied
    keyid: { type: 'string', default: '' },
    events: { type: 'array', default: ['triggerDown', 'triggerUp'] },
    text: { type: 'string', default: '' }, // Requires a style. Creates a child element if there is a text value
    textPosition: { type: 'string', default: '' }, // Only if we create a text element
    textScale: { type: 'string', default: '' }, // Only if we create a text element
  },
  init() {
    this.isPressed = false;
    this.isCooldown = false;
    this.buttonBuilt = false;
  },
  update(oldData) {
    if (!this.buttonBuilt && this.data.style) {
      buildButton(this);
      this.buttonBuilt = true;
    }
    if (oldData.key !== this.data.key) {
      if (!this.el.getAttribute('keymap') && this.data.key)
        this.el.setAttribute('keymap', this.data.key); // Has to be done before we try and add listeners
    }
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
      color: this.oldColor,
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

function buildButton(button) {
  const data = button.data;
  const style = button.el.sceneEl.systems.dataset.getDatagroup(data.style);
  const geom = button.el.getAttribute('geometry');
  const gltfPart = button.el.getAttribute('gltf-blender-part');
  const collider = button.el.getAttribute('collider');
  const material = button.el.getAttribute('material');
  const oSize = {};
  if (data.height) oSize.height = data.height;
  if (data.depth) oSize.depth = data.depth;
  if (data.width) oSize.width = data.width;
  if (!material)
    button.el.setAttribute('material', style.getData('material'));
  if (!geom && !gltfPart) {
    if (style.hasDataFor('geometry')) {
      const oGeom = copyValues(oSize, style.copyData('geometry'));
      button.el.setAttribute('geometry', oGeom);
      if (!oSize.height) oSize.height = oGeom.height;
      if (!oSize.depth) oSize.depth = oGeom.depth;
      if (!oSize.width) oSize.width = oGeom.width;
    } else {
      const oPart = style.copyData('gltf-blender-part');
      if (data.blenderPart) {
        const vals = data.blenderPart.split(':');
        oPart.src = vals[0]; oPart.part = vals[1];
      }
      button.el.setAttribute('gltf-blender-part', oPart);
    }
  }
  if (!collider)
    button.el.setAttribute('collider', copyValues(oSize, style.copyData('collider')));
  if (data.text) {
    const el = document.createElement('a-entity');
    const oText = style.copyData('text'); oText.value = data.text;
    el.setAttribute('text', oText);
    const oAlign = style.getData('textalignment')
    const pos = data.textPosition || oAlign.position; if (pos) el.setAttribute('position', pos);
    const scale = data.textScale || oAlign.scale; if (scale) el.setAttribute('scale', scale);
    button.el.appendChild(el);
  }
}
