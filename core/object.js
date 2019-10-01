/**
 * object.js
 *
 * Object related services and utilities
 *
 * Note: 'use strict' must be employed at function scope NOT module scope.
 */
const fTrue = () => true;
const fFalse = () => false;

const globalThis = (function () { return this })();
const isGlobalThis = globalThis === undefined ? ths => ths === undefined : ths => ths === undefined || ths === globalThis;

var JsEnvType = getJsEnvType();
const isClient = JsEnvType === 'client' ? fTrue : fFalse;
const isServer = JsEnvType === 'server' ? fTrue : fFalse;
var returnArray = returnObject;

module.exports = {
  globalThis,
  isClient,
  isGlobalThis,
  isServer,
  requestObject,
  returnObject,
  requestArray,
  returnArray
}

function getJsEnvType() {
  var env
  try { env = Window } catch (err) { };
  if (env)
    return 'client';
  try { env = process } catch (err) { };
  if (env)
    return 'server';
  throw new Error('micosmo:core:getJsEnv: Unable to determine environment type')
}

const SymPool = Symbol('MicosmoPool');
const ObjectPool = [];
function requestObject() {
  const o = ObjectPool.length === 0 ? {} : ObjectPool.shift();
  o[SymPool] = false;
  return o;
}
function returnObject(o) {
  if (typeof o !== 'object' || o === null || !o.hasOwnProperty(SymPool))
    return;
  (Array.isArray(o) ? _returnArray : _returnObject)(o, Promise.resolve());
}
function _returnObject(o, promise) {
  promise = promise.then(() => {
    o[SymPool] = true;
    for (const prop in o) {
      if (!o.hasOwnProperty(prop))
        continue;
      const v = o[prop];
      if (typeof v === 'object' && v !== null && v.hasOwnProperty(SymPool) && !v[SymPool])
        promise = (Array.isArray(v) ? _returnArray : _returnObject)(v, promise);
      delete o[prop];
    }
    ObjectPool.push(o);
  });
  return promise;
}

const ArrayPool = [];
function requestArray() {
  const a = ArrayPool.length === 0 ? [] : ArrayPool.shift();
  a[SymPool] = false;
  return a;
}
function _returnArray(a, promise) {
  promise.then(() => {
    a[SymPool] = true;
    for (let i = a.length; i; i--) {
      const v = a.shift();
      if (typeof v === 'object' && v !== null && v.hasOwnProperty(SymPool) && !v[SymPool])
        promise = (Array.isArray(v) ? _returnArray : _returnObject)(v, promise);
    }
    ArrayPool.push(a);
  });
  return promise;
}
