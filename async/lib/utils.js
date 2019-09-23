/*
 * utils.js
 *
 * Utility functions
 */
"use strict";

module.exports = {
  isaThreadable,
  isPromisable,
  asPromise,
  isaSealedContract,
  isaProxyPromise,
  isanAsyncPromise,
  isaLazyPromise,
};

function isaThreadable(f) {
  const ty = typeof f;
  return (ty === 'function' || ty === 'object') && f.isaThreadable;
}

function isPromisable(v) {
  return v instanceof Promise || (typeof v === 'object' && v.then) // Accept thenables.
}

function asPromise(v) {
  return v instanceof Promise ? v : (typeof v === 'object' && v.isaSealedContract) ? v.promise : Promise.resolve(v);
}

function isaSealedContract(v) {
  return typeof v === 'object' && v.isaSealedContract;
}

function isaProxyPromise(v) {
  return typeof v === 'object' && v.isaProxyPromise;
}

function isanAsyncPromise(v) {
  return typeof v === 'object' && v.isanAsyncPromise;
}

function isaLazyPromise(v) {
  return typeof v === 'object' && v.isaLazyPromise;
}
