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

const timeMark = isClient() ? clientTimeMark : serverTimeMark;
const timeInterval = isClient() ? clientTimeInterval : serverTimeInterval;

module.exports = {
  globalThis,
  isaGenerator,
  isaGeneratorFunction,
  isClient,
  isGlobalThis,
  isServer,
  peekTimer,
  peekTimers,
  startTimer: timeMark
}

function isaGenerator (fi) { return String(fi) === MarkGen }
function isaGeneratorFunction(f) { return typeof f === 'function' && Object.getPrototypeOf(f) === ProtGenFn }

function clientTimeMark() { return Window.performance.now() }
function clientTimeInterval(tmMark, tmStart) { return tmMark - tmStart }

function peekTimer(timer) { return timeInterval(timeMark(), timer) }
function peekTimers(...args) { const mark = timeMark(); return args.map(timer => (timer && timeInterval(mark, timer)) || 0) }

function serverTimeMark() { return process.hrtime.bigint() }
function serverTimeInterval(tmMark, tmStart) { return Number(tmMark - tmStart) / 1000000 }

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
