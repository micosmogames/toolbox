/**
 * object.js
 *
 * Object related services and utilities
 *
 * Note: 'use strict' must employed at function scope NOT module scope.
 */

const ProtGenFn = Object.getPrototypeOf(function * () { });
const MarkGen = String((function * () { })());
const fTrue = () => true;
const fFalse = () => false;

const globalThis = (function () { return this })();
const isGlobalThis = globalThis === undefined ? ths => ths === undefined : ths => ths === undefined || ths === globalThis;

var JsEnvType = getJsEnvType();
const isClient = JsEnvType === 'client' ? fTrue : fFalse;
const isServer = JsEnvType === 'server' ? fTrue : fFalse;
const startTimer = isClient() ? startClientTimer : startServerTimer;
const peekTimer = isClient() ? peekClientTimer : peekServerTimer;

module.exports = {
  globalThis,
  isaGenerator,
  isaGeneratorFunction,
  isClient,
  isGlobalThis,
  isServer,
  peekTimer,
  startTimer
}

function isaGenerator (fi) { return String(fi) === MarkGen }
function isaGeneratorFunction(f) { return typeof f === 'function' && Object.getPrototypeOf(f) === ProtGenFn }

function startClientTimer() { return Window.performance.now() }
function peekClientTimer(tmStart) { return Window.performance.now() - tmStart }

function startServerTimer() { return process.hrtime.bigint() }
function peekServerTimer(tmStart) { return Number(process.hrtime.bigint() - tmStart) / 1000000 }

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
