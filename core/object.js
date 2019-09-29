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

const ObjectPool = [];
function requestObject() {
  if (ObjectPool.length === 0)
    return {};
  return ObjectPool.shift();
}
function returnObject(o) {
  for (const prop in o) {
    if (o.hasOwnProperty(prop))
      delete o[prop];
  }
  ObjectPool.push(o);
}

const ArrayPool = [];
function requestArray() {
  if (ArrayPool.length === 0)
    return [];
  return ArrayPool.shift();
}
function returnArray(a) {
  a.length = 0;
  ArrayPool.push(a);
}
