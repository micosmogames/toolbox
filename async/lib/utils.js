/*
 * utils.js
 *
 * Utility functions
 */
"use strict";

const common = require('./common');

module.exports = {
  isaThreadable,
  isPromisable,
  asPromise,
  isaLazyPromise,
  setDefaultCatchHandler,
  Promises: common.Promises
};

function isaThreadable(f) {
  const ty = typeof f;
  return (ty === 'function' || ty === 'object') && f.isaThreadable;
}

function isPromisable(v) {
  return v instanceof Promise || (typeof v === 'object' && v.then) // Accept thenables.
}

function asPromise(v) {
  return v instanceof Promise ? v : (typeof v === 'object' && v.isaLazyPromise) ? v.promise : Promise.resolve(v);
}

function isaLazyPromise(v) {
  return typeof v === 'object' && v.isaLazyPromise;
}

function setDefaultCatchHandler(fReject) {
  if (typeof fReject !== 'function')
    throw new Error(`micosmo:async:setDefaultCatchHandler: Default catch handler must be a Function`);
  common.setDefaultCatchHandler(fReject);
  return fReject;
}
