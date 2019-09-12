/*
 * common.js
 *
 * Common utitlity services
 */
"use strict";

module.exports = {
  Promises,
  setDefaultRejectionHandler
};

var RejectionHandler = DefaultRejectionHandler;
function setDefaultRejectionHandler(fReject) { RejectionHandler = fReject };

const PromisesPrototype = _PromisesPrototype();

function Promises(owner) {
  return Object.create(PromisesPrototype, {
    isaPromises: { value: true, enumerable: true },
    handlers: { value: [], enumerable: true },
    owner: { value: owner, enumerable: true }
  });
};

function _PromisesPrototype() {
  return Object.create(Object, {
    then: {
      value: function (onFulfilled, onRejected) {
        if (typeof onFulfilled !== 'function' || (onRejected && typeof onRejected !== 'function'))
          throw new Error(`micosmo:async:Promises:then: Function required for onFulfilled and optional function for onRejected.`);
        this.handlers.push(lazyPromise => lazyPromise.Then(onFulfilled, onRejected));
        return this;
      },
      enumerable: true
    },
    catch: {
      value: function (onRejected) {
        if (typeof onRejected !== 'function')
          throw new Error(`micosmo:async:Promises:catch: Function required for onRejected.`);
        this.handlers.push(lazyPromise => lazyPromise.Catch(onRejected));
        return this;
      },
      enumerable: true
    },
    finally: {
      value: function (onFinally) {
        if (typeof onFinally !== 'function')
          throw new Error(`micosmo:async:Promises:Finally: Function required for onFinally.`);
        this.handlers.push(lazyPromise => lazyPromise.Finally(onFinally));
        return this;
      },
      enumerable: true
    },
    apply: {
      value: function (lazyPromise) {
        this.handlers.forEach(handler => handler(lazyPromise));
        if (!lazyPromise.isCatchable)
          lazyPromise.Catch(RejectionHandler);
        return this;
      },
      enumerable: true
    },
    clear: {
      value: function (lazyPromise) {
        if (lazyPromise)
          this.apply(lazyPromise);
        this.handlers.splice(0);
        return this;
      },
      enumerable: true
    },
    reject: { value(v, msg) { return RejectionHandler(v, msg) }, enumerable: true },
    defaultReject: { value(v, msg) { return DefaultRejectionHandler(v, msg) }, enumerable: true },
  })
};

Promises.then = function (promise, onFulfilled, onRejected) { return aPromise(promise).then(onFulfilled, onRejected) }
Promises.catch = function (promise, onRejected) { return aPromise(promise).catch(onRejected) }
Promises.finally = function (promise, onFinally) { return aPromise(promise).finally(onFinally) }
Promises.reject = function (v, msg) { return RejectionHandler(v, msg) };
Promises.defaultReject = function (v, msg) { return DefaultRejectionHandler(v, msg) };

function aPromise(promise) {
  if (typeof promise !== 'object')
    return Promise.resolve(promise);
  if (promise instanceof Promise)
    return (promise.lazyPromise && promise.lazyPromise.promises) || promise;
  return promise.promises || Promise.resolve(promise);
}

function DefaultRejectionHandler(v, msg) {
  msg = msg ? ` ${msg}.` : '';
  if (v instanceof Error) {
    console.warn(`micosmo:async:RejectionHandler:${msg} Error(${v.message}). Returning 'undefined'`);
    if (v.stack)
      console.warn(v.stack);
    v = undefined;
  } else if (isPromisable(v))
    console.warn(`micosmo:async:RejectionHandler:${msg} Rejected value is a Promise or Thenable. Returning resolved value`);
  else {
    console.warn(`micosmo:async:RejectionHandler:${msg} Rejected(${v}). Returning 'undefined'`);
    v = undefined;
  }
  return Promise.resolve(v);
}

var isPromisable = function (v) {
  const utils = require('./utils');
  isPromisable = utils.isPromisable;
  return isPromisable(v);
}
