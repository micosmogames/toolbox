import aframe from "aframe";
import { bindEvent } from "aframe-event-decorators";
import { getComponentData } from './lib/utils';
import { declareMethod, bind, method } from "@micosmo/core";
import { startProcess, msWaiter, waiter } from '@micosmo/ticker/aframe-ticker';

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
  const style = button.sysDataset.getDatagroup(data.style);
  const compGeom = getComponentData(button.el, 'geometry'); // Will force the geometry component to initialise if present
  const compGltfPart = button.el.getAttribute('gltf-blender-part');
  const compCollider = button.el.getAttribute('collider');
  const compMaterial = button.el.getAttribute('material');
  if (!compMaterial) {
    button.el.setAttribute('material', '');
    button.el.setAttribute('material',
      button.sysDataset.merge(button.sysDataset.parse(data.material, style.getData('material'))));
  }
  let oGeom;
  if (!compGeom && !compGltfPart) {
    if (style.hasDataFor('geometry') || button.geometry) {
      button.el.setAttribute('geometry',
        (oGeom = button.sysDataset.merge(button.sysDataset.parse(data.geometry), style.getData('geometry'))));
    } else if (style.hasDataFor('gltf-blender-part') || data['gltf-blender-part'])
      button.el.setAttribute('gltf-blender-part',
        button.sysDataset.merge(button.sysDataset.parse(data['gltf-blender-part'], style.getData('gltf-blender-part'))));
  }
  if (!compCollider) {
    const oCollider = button.sysDataset.merge(button.sysDataset.parse(data.collider), style.getData('collider'));
    const mappings = ['height', 'width', 'depth'];
    if (oGeom) button.sysDataset.map(oGeom, mappings, oCollider); // Defaults to a 'fill' mapping
    else button.sysDataset.map(compGeom, mappings, oCollider);
    button.el.setAttribute('collider', oCollider);
  }
  if (data.text)
    button.el.setAttribute('text',
      button.sysDataset.merge(button.sysDataset.parse(data.text), style.getData('text')));
}
