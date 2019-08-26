/* global THREE */
import aframe from "aframe";
import rep from "../lib/replicate";
import * as soundPatch from './soundPatch';

const PatchTag = "__trajectile-patch__";

aframe.registerSystem("patches", {
  init: function () {
    this.waitForLoaded = waitForLoaded.bind(this);
    this.el.addEventListener("loaded", this.waitForLoaded);
    // Prevent THREE from generating warnings when aframe look-at component
    // calls without the required Vector object to fill in
    const prot = patchObject('THREE:getWorldPosition', getWorldPositionPatch,
      Object.getPrototypeOf(Object.getPrototypeOf(this.el.object3D)),
      'Installing missing parameter warning patch');
    realGetWorldPosition = prot.__patched__.getWorldPosition;
  },
});

function waitForLoaded() {
  this.el.removeEventListener("loaded", this.waitForLoaded);
}

// The sound component will already be loaded by now, so we have to patch it straight from the components list.
const protSound = aframe.components.sound.Component.prototype;
patchObject('component:sound', soundPatch.soundProtPatch, protSound, 'Installing fixes and extensions patch');
soundPatch.soundSchemaPatch(protSound);

const realRegisterComponent = aframe.registerComponent;
const registerComponentPatch = {
  registerComponent(name, def, ...args) {
    switch (name) {
    case 'missile':
      patchObject('component:missile:update', missileUpdatePatch, def, 'Installing corrupted data patch');
      break;
    case 'missile-times':
      patchObject('component:missile-times:update', fixTimesUpdateDataPatch, def, 'Installing corrupted data patch');
      break;
    case 'bomber-times':
      patchObject('component:bomber-times:update', fixTimesUpdateDataPatch, def, 'Installing corrupted data patch');
      break;
    default:
      break;
    }
    return realRegisterComponent(name, def, ...args);
  }
};
patchObject('aframe:registerComponent', registerComponentPatch, aframe, 'Installing component registration patcher');

var fixTimesUpdateDataPatch = {
  update(oldData) {
    //  console.log(`Update data for ${this.attrName}`, JSON.stringify(this.data));
    if (!this[PatchTag])
      this[PatchTag] = {
        data: JSON.stringify(this.data),
      };
    else {
      //  console.log(`Bad update data for ${this.attrName}`, JSON.stringify(this.data));
      this.data = JSON.parse(this[PatchTag].data);
      return;
    }
    if (this.__patched__.update)
      this.__patched__.update.call(this, oldData);
  }
};

var missileUpdatePatch = {
  update(oldData) {
    const data = this.data;
    const badNumber = v => v !== 0 && !v;
    const badString = v => v === 'undefined';
    if (badNumber(data.speed) || badString(data.color) || badNumber(data.distance)) {
    //    console.log(this.nMissile, `Bad update data for ${this.attrName}`, JSON.stringify(this.data));
      this.data = this[PatchTag].data;
      this.oldData = this[PatchTag].oldData;
      return;
    }
    if (!this[PatchTag])
      this[PatchTag] = {};
    this[PatchTag].oldData = rep.clone(oldData);
    this[PatchTag].data = rep.clone(this.data);
    this.__patched__.update.call(this, oldData);
  }
};

var realGetWorldPosition;
var getWorldPositionPatch =
{
  getWorldPosition(target) {
  // aframe 0.8.2 compatible getWorldPosition. Waiting for fix to aframe look-at component.
    if (target === undefined)
      target = new THREE.Vector3();
    return realGetWorldPosition.call(this, target);
  }
}

function patchObject(name, from, to, msg) {
  console.info(`Patch:${name}: ${msg}`);
  if (Object.isSealed(to))
    throw new Error(`Patch:${name}: Target object is sealed`);
  const descs = Object.getOwnPropertyDescriptors(from);
  const __patched__ = to.__patched__ || {
    [PatchTag]: true,
  };
  Object.getOwnPropertyNames(descs).forEach(prop => {
    const fromDesc = descs[prop];
    const toDesc = Object.getOwnPropertyDescriptor(to, prop);
    if (toDesc) {
      if (!toDesc.configurable && !toDesc.writable)
        throw new Error(`Patch ${name}: Target object property '${prop}' is not configurable`);
      if (toDesc.value !== undefined)
        __patched__[prop] = toDesc.value;
      if (toDesc.get)
        __patched__[`getter_${prop}`] = toDesc.get;
      if (toDesc.set)
        __patched__[`setter_${prop}`] = toDesc.get;
      if (toDesc.writable) {
        to[prop] = fromDesc.value;
        return;
      }
    }
    Object.defineProperty(to, prop, fromDesc);
  });
  if (!to.__patched__)
    to.__patched__ = __patched__;
  return to;
}
