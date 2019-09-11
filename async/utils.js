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
  isaLazyPromise,
  handleRejection,
  thenFor,
  catchFor,
  finallyFor
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

function handleRejection(v, msg) {
  msg = msg ? ` ${msg}.` : '';
  if (v instanceof Error) {
    console.warn(`micosmo:async:reject:${msg} Error(${v.message}). Returning 'undefined'`);
    if (v.stack)
      console.warn(v.stack);
    v = undefined;
  } else if (isPromisable(v))
    console.warn(`micosmo:async:reject:${msg} Rejected value is a Promise or Thenable. Returning resolved value`);
  else {
    console.warn(`micosmo:async:reject:${msg} Rejected(${v}). Returning 'undefined'`);
    v = undefined;
  }
  return Promise.resolve(v);
}

function thenFor(who, fPrivate) {
  return function (...args) {
    var promise, onFulfilled, onRejected;
    isPromisable(args[0]) ? [promise, onFulfilled, onRejected] = args : [onFulfilled, onRejected] = args;
    if (!promise) {
      const Private = fPrivate(this);
      if (typeof onFulfilled !== 'function' || (onRejected && typeof onRejected !== 'function'))
        throw new Error(`micosmo:async:${who}:Then: Function required for onFulfilled and optional function for onRejected.`);
      Private.handlers.push(lazyPromise => lazyPromise.Then(onFulfilled, onRejected));
      return this;
    }
    return promise.lazyPromise ? promise.lazyPromise.Then(onFulfilled, onRejected) : promise.then(onFulfilled, onRejected);
  }
}

function catchFor(who, fPrivate) {
  return function (...args) {
    var promise, onRejected;
    isPromisable(args[0]) ? [promise, onRejected] = args : onRejected = args[0];
    if (!promise) {
      const Private = fPrivate(this);
      if (typeof onRejected !== 'function')
        throw new Error(`micosmo:async:${who}:Catch: Function required for onRejected.`);
      Private.handlers.push(lazyPromise => lazyPromise.Catch(onRejected));
      return this;
    }
    return promise.lazyPromise ? promise.lazyPromise.Catch(onRejected) : promise.catch(onRejected);
  };
}

function finallyFor(who, fPrivate) {
  return function (...args) {
    var promise, onFinally;
    isPromisable(args[0]) ? [promise, onFinally] = args : onFinally = args[0];
    if (!promise) {
      const Private = fPrivate(this);
      if (typeof onFinally !== 'function')
        throw new Error(`micosmo:async:${who}:Finally: Function required for onFinally.`);
      Private.handlers.push(lazyPromise => lazyPromise.Finally(onFinally));
      return this;
    }
    return promise.lazyPromise ? promise.lazyPromise.Finally(onFinally) : promise.finally(onFinally);
  };
}
