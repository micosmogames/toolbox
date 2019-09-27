/*
*  startup.js
*
*  Manages the queueing and dispatching of initialisation processes that can only be run when the application and aframe environment is loaded.
*/
"use strict";

import aframe from 'aframe';
import { declareMethods, method } from '@micosmo/core';

declareMethods(systemLoadedListener);

var LoadingScenes = [];
var OnLoadedDoQueue = [];
var AfterLoadedDoQueue = [];

aframe.registerSystem("startup", {
  init() {
    LoadingScenes.push(this.sceneEl);
    this.name = this.sceneEl.id || '<noid>'
    this.fLoadedListener = systemLoadedListener.bind(this);
    this.sceneEl.addEventListener('loaded', this.fLoadedListener);
  },
});

export function onLoadedDo(f) {
  if (typeof f !== 'function')
    throw new Error(`micosmo:system:onLoadedDo: Missing function`);
  if (LoadingScenes.length === 0)
    return f();
  OnLoadedDoQueue.push(f);
}

export function afterLoadedDo(f) {
  if (typeof f !== 'function')
    throw new Error(`micosmo:system:afterLoadedDo: Missing function`);
  if (LoadingScenes.length === 0)
    return f();
  AfterLoadedDoQueue.push(f);
}

method(systemLoadedListener);
function systemLoadedListener() {
  this.sceneEl.removeEventListener('loaded', this.fLoadedListener);
  if (LoadingScenes.length > 1) {
    console.info(`micosmo:system:startup:systemLoadedListener: Processing of 'onLoadedDo' & 'afterLoadedDo' queues for scene '${this.name}' deferred. Multiple scenes loading ...`);
    LoadingScenes.splice(LoadingScenes.indexOf(this.sceneEl), 1);
    if (!this.startupComponent)
      throw new Error(`micosmo:system:startup:systemLoadedListener: Scene '${this.name}' requires a 'startup'`);
    AfterLoadedDoQueue.push(() => this.sceneEl.systems.states.start(this.startupComponent.data.state));
  }
  console.info(`micosmo:system:startup:systemLoadedListener: Processing 'onLoadedDo' & 'afterLoadedDo' queues. Scene(${this.name})`);
  LoadingScenes = [];
  const queue = OnLoadedDoQueue; OnLoadedDoQueue = [];
  queue.forEach(f => f());
  // Run all processing that must occur after all loading activity is complete
  AfterLoadedDoQueue.forEach(f => f());
  AfterLoadedDoQueue = [];
  // Now kick of the initial game state
  if (!this.startupComponent)
    throw new Error(`micosmo:system:startup:systemLoadedListener: Scene '${this.name}' requires a 'startup'`);
  this.sceneEl.systems.states.start(this.startupComponent.data.state);
}

aframe.registerComponent("startup", {
  schema: {
    name: { type: 'string', default: '' },
    state: { type: 'string', default: 'Loading' }
  },
  init() {
    if (this.data.name !== '')
      this.system.name = this.data.name;
    this.system.startupComponent = this;
  },
  update(oldData) {
    if (oldData.state)
      throw new Error(`micosmo:component:startup:update: Component schema cannot be updated`);
  }
});
