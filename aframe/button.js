import aframe from "aframe";
import { bindEvent } from "aframe-event-decorators";
import { getComponentData } from './lib/utils';
import { declareMethod, bind, method } from "@micosmo/core";
import { startProcess, msWaiter, waiter } from '@micosmo/ticker/aframe-ticker';
import { onLoadedDo } from "@micosmo/aframe/startup";

const PressTime = 0.1;

aframe.registerPrimitive('a-button', {
  defaultComponents: {
    button: {}
  },
  mappings: {
    pressedcolor: 'button.pressedColor',
    playcooldown: 'button.playCooldown',
    key: 'button.key',
    keyid: 'button.keyid',
    events: 'button.events',
    bstyle: 'button.style',
    bgeometry: 'button.geometry',
    bmaterial: 'button.material',
    bcollider: 'button.collider',
    btext: 'button.text',
    bstate: 'button.state',
  }
});

aframe.registerComponent("button", {
  schema: {
    pressedColor: { type: 'color', default: 'red' },
    playCooldown: { type: 'number', default: 0.5 },
    key: { type: 'string', default: '' }, // Only if keymap component not supplied
    keyid: { type: 'string', default: '' },
    events: { type: 'array', default: ['triggerDown', 'triggerUp'] },
    // Style based input
    style: { type: 'string', default: '' }, // Maps to a data group
    geometry: { type: 'string', default: '' }, // Overrides style
    material: { type: 'string', default: '' }, // Overrides style
    collider: { type: 'string', default: '' }, // Overrides style
    text: { type: 'string', default: '' }, // Overrides style
    // State change response. No event raised.
    state: { type: 'string' }, // Of the form <states selector>.<op>.<state>
  },
  init() {
    this.sysDataset = this.el.sceneEl.systems.dataset;
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
    if (oldData.state !== this.data.state) {
      this.stateDetails = undefined;
      if (this.data.state) {
        var s = this.data.state; var i = s.lastIndexOf('.'); var j = s.lastIndexOf('.', i - 1);
        if (i < 2)
          throw new Error(`micosmo:component:button:update: Invalid state expression '${s}'`);
        else if (j < 2)
          this.stateDetails = [s.substring(0, i), s.substring(i + 1), undefined];
        else
          this.stateDetails = [s.substring(0, j), s.substring(j + 1, i), s.substring(i + 1)];
        var el = document.querySelector(this.stateDetails[0]);
        if (!el)
          throw new Error(`micosmo:component:button:update: Invalid states selector '${this.stateDetails[0]}'`);
        if (el.sceneEl !== this.el.sceneEl)
          el = this.el.sceneEl.querySelector(this.stateDetails[0]);
        onLoadedDo(() => { this.stateDetails[0] = el.components.states });
      }
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
      if (!this.stateDetails)
        this.el.emit("vrbuttondown");
      this.isPressed = true;
    }
  },
  release() {
    this.timer = PressTime;
    this.isCooldown = true;
    this.isPressed = false;
    if (this.stateDetails)
      this.stateDetails[0][this.stateDetails[1]](this.stateDetails[2]);
    else
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
  const sysDataset = button.sysDataset;
  const data = button.data;
  const style = button.sysDataset.getDatagroup(data.style);
  if (!button.el.getAttribute('material')) {
    sysDataset.setAttribute(button.el, 'material', data.material, style.getData('material'));
  }
  const compGeom = getComponentData(button.el, 'geometry'); // Will force the geometry component to initialise if present
  let oGeom;
  if (!compGeom && !button.el.getAttribute('gltf-blender-part')) {
    if (style.hasDataFor('geometry') || button.geometry)
      oGeom = sysDataset.setAttribute(button.el, 'geometry', data.geometry, style.getData('geometry'));
    else if (style.hasDataFor('gltf-blender-part') || data['gltf-blender-part'])
      sysDataset.setAttribute(button.el, 'gltf-blender-part', data['gltf-blender-part'], style.getData('gltf-blender-part'));
  }
  if (!button.el.getAttribute('collider')) {
    const oCollider = sysDataset.merge(data.collider, style.getData('collider'));
    const mappings = ['height', 'width', 'depth'];
    if (oGeom) sysDataset.map(oGeom, mappings, oCollider); // Defaults to a 'fill' mapping
    else sysDataset.map(compGeom, mappings, oCollider);
    sysDataset.setAttribute(button.el, 'collider', oCollider);
  }
  if (data.text) // Could end up with text in a separate entity so base it on whether button.text is configured.
    sysDataset.setAttribute(button.el, 'text', data.text, style.getData('text'));
}
