/*
*  startup.js
*
*  Manages the queueing and dispatching of initialisation processes that can only be run when the application and aframe environment is loaded.
*/
"use strict";

import aframe from 'aframe';
import { declareMethods, method } from '@micosmo/core';
import { AsyncPromise, isPromisable } from '@micosmo/async';

declareMethods(systemLoadedListener);

var LoadingScenes = [];
var OnLoadedDoQueue = [];
var AfterLoadedDoQueue = [];

aframe.registerSystem("startup", {
  init() {
    LoadingScenes.push(this.sceneEl);
    this.name = this.sceneEl.id || 'a-scene'
    this.fLoadedListener = systemLoadedListener.bind(this);
    this.sceneEl.addEventListener('loaded', this.fLoadedListener);
  },
  onLoadedDo,
  afterLoadedDo
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
    AfterLoadedDoQueue.push(() => this.sceneEl.emit('startupComplete', undefined, false));
  }
  console.info(`micosmo:system:startup:systemLoadedListener: Processing 'onLoadedDo' & 'afterLoadedDo' queues. Scene(${this.name})`);
  LoadingScenes = [];
  const onLoadedDoQueue = OnLoadedDoQueue; OnLoadedDoQueue = [];
  const afterLoadedDoQueue = AfterLoadedDoQueue; AfterLoadedDoQueue = [];

  // Run all tasks asynchronously and wait for any promises to settle
  const aprom = AsyncPromise(resolve => {
    // AfterLoadedDo tasks can only run after OnLoadedDo tasks (including promises) have finished
    aprom.promises
      .then(() => Promise.all(processQueue(onLoadedDoQueue)))
      .then(() => {
      // Run all processing that must occur after all loading activity is complete
        aprom.promises
          .then(() => Promise.all(processQueue(afterLoadedDoQueue)))
          .then(() => this.sceneEl.emit('startupComplete', undefined, false));
      });
    resolve();
  });
}

function processQueue(queue) {
  const promiseQueue = [];
  queue.forEach(f => {
    const v = f();
    if (isPromisable(v))
      promiseQueue.push(v);
  });
  return promiseQueue;
}
