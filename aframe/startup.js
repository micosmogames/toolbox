/*
*  startup.js
*
*  Manages the queueing and dispatching of initialisation processes that can only be run when the application and aframe environment is loaded.
*/
"use strict";

import aframe from 'aframe';
import { declareMethods, method } from '@micosmo/core';

declareMethods(systemLoadedListener, componentLoadedListener);

var LoadingScenes = new Set();

aframe.registerSystem("startup", {
  init() {
    LoadingScenes.add(this.sceneEl);
    this.name = this.sceneEl.id || '<unknown>'
    this.fLoadedListener = systemLoadedListener.bind(this);
    this.sceneEl.addEventListener('loaded', this.fLoadedListener);
    this.onLoadedDoQueue = [];
    this.afterLoadedDoQueue = [];
  },
});

export function onLoadedDo(f, el) {
  const [f1, sceneEl] = checkLoadedArgs(f, el, 'onLoadedDo');
  if (!sceneEl || sceneEl.hasLoaded)
    return f1();
  sceneEl.systems.startup.onLoadedDoQueue.push(f1);
}

export function afterLoadedDo(f, el) {
  const [f1, sceneEl] = checkLoadedArgs(f, el, 'afterLoadedDo');
  if (!sceneEl || sceneEl.hasLoaded)
    return f1();
  sceneEl.systems.startup.afterLoadedDo.push(f1);
}

function checkLoadedArgs(f, el, fn) {
  if (typeof f !== 'function') {
    if (typeof el !== 'function')
      throw new Error(`micosmo:system:${fn}: Missing function`);
    if (typeof f !== 'object' || !f.sceneEl)
      throw new Error(`micosmo:system:${fn}: Invalid entity`);
    return [el.sceneEl, f];
  } else if (el) {
    if (typeof el !== 'object' || !el.sceneEl)
      throw new Error(`micosmo:system:${fn}: Invalid entity`);
    return [f, el.sceneEl];
  }
  if (LoadingScenes.length > 1)
    throw new Error(`micosmo:system:${fn}: Require entity parameter for concurrent load of two scenes`);
  return [f, LoadingScenes[0]]; // Returns undefined for sceneEl if array empty
}

method(systemLoadedListener);
function systemLoadedListener() {
  console.info(`micosmo:system:startup:systemLoadedListener: Processing 'onLoadedDo' & 'afterLoadedDo' queues. Scene(${this.name})`);
  this.sceneEl.removeEventListener('loaded', this.fLoadedListener);
  LoadingScenes.delete(this.sceneEl);
  const queue = this.onLoadedDoQueue;
  this.onLoadedDoQueue = [];
  queue.forEach(f => f());
  // Run all processing that must occur after all loading activity is complete
  this.afterLoadedDoQueue.forEach(f => f());
  this.afterLoadedDoQueue = [];
}

aframe.registerComponent("startup", {
  schema: {
    name: { type: 'string', default: '' },
    state: { type: 'string', default: 'Loading' }
  },
  init() {
    if (this.data.name !== '')
      this.system.name = this.data.name;
    this.fLoadedListener = componentLoadedListener.bind(this);
    this.sceneEl.addEventListener('loaded', this.fLoadedListener);
  },
  update(oldData) {
    if (oldData)
      throw new Error(`micosmo:component:startup:update: Component cannot be updated`);
  }
});

method(componentLoadedListener);
function componentLoadedListener() {
  this.sceneEl.removeEventListener('loaded', this.fLoadedListener);
  this.sceneEl.systems.game.start(this.state);
}
