/*
*  startup.js
*
*  Manages the queueing and dispatching of initialisation processes that can only be run when the application and aframe environment is loaded.
*/
"use strict";

import aframe from 'aframe';

var flSystemLoaded = false;
var onLoadedDoQueue = [];
var afterLoadedDoQueue = [];
var fLoadedListener;

aframe.registerSystem("startup", {
  init() {
    fLoadedListener = loadedListener.bind(this);
    this.el.addEventListener("loaded", fLoadedListener);
  },
});

export function onLoadedDo(f) {
  if (flSystemLoaded)
    return f();
  onLoadedDoQueue.push(f);
}

export function afterLoadedDo(f) {
  if (flSystemLoaded)
    return f();
  afterLoadedDoQueue.push(f);
}

function loadedListener() {
  console.info(`startup:loadedListener: Processing 'onLoadedDo' & 'afterLoadedDo' queues`);
  this.el.removeEventListener("loaded", fLoadedListener);
  const queue = onLoadedDoQueue;
  onLoadedDoQueue = [];
  flSystemLoaded = true;
  queue.forEach(f => f());
  // Run all processing that must occur after all loading activity is complete
  afterLoadedDoQueue.forEach(f => f());
  afterLoadedDoQueue = [];
}
