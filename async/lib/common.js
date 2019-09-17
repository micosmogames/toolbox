/*
 * common.js
 *
 * Common utitlity services
 */
"use strict";

module.exports = {
  Promises,
  setDefaultCatchHandler
};

var CatchHandler = DefaultCatchHandler;
function setDefaultCatchHandler(fReject) { CatchHandler = fReject };

const PromisesPrototype = _PromisesPrototype();

function Promises(owner) {
  if (typeof owner !== 'object')
    return Promise.resolve(owner);
  if (owner instanceof Promise)
    return (owner.lazyPromise && owner.lazyPromise.promises) || owner;
  return owner.promises || Object.create(PromisesPrototype, {
    isaPromises: { value: true, enumerable: true },
    handlers: { value: [], enumerable: true },
    owner: { value: owner, enumerable: true },
    link: { value: undefined, writable: true, enumerable: true }
  });
};

function _PromisesPrototype() {
  return Object.create(Object, {
    then: {
      value: function (onFulfilled, onRejected) {
        if (typeof onFulfilled !== 'function' || (onRejected && typeof onRejected !== 'function'))
          throw new Error(`micosmo:async:Promises:then: Function required for onFulfilled and optional function for onRejected.`);
        this.handlers.push({ meth: 'then', args: [onFulfilled, onRejected] });
        return this;
      },
      enumerable: true
    },
    catch: {
      value: function (onRejected) {
        if (typeof onRejected !== 'function')
          throw new Error(`micosmo:async:Promises:catch: Function required for onRejected.`);
        this.handlers.push({ meth: 'catch', args: [onRejected] });
        return this;
      },
      enumerable: true
    },
    finally: {
      value: function (onFinally) {
        if (typeof onFinally !== 'function')
          throw new Error(`micosmo:async:Promises:Finally: Function required for onFinally.`);
        this.handlers.push({ meth: 'finally', args: [onFinally] });
        return this;
      },
      enumerable: true
    },
    apply: {
      value: function (promise) {
        if (this.handlers.length > 0)
          this.link = promise.lazyPromise ? lazyPromiseDo(promise.lazyPromise, this.handlers) : promiseDo(promise, this.handlers);
        return this;
      },
      enumerable: true
    },
    clear: {
      value: function (promise) {
        if (promise)
          this.apply(promise);
        this.handlers.splice(0);
        return this;
      },
      enumerable: true
    }
  })
};

Promises.reject = function (v, msg) { return CatchHandler(v, msg) };
Promises.miReject = function (v, msg) { return DefaultCatchHandler(v, msg) };

function lazyPromiseDo(lazyPromise, handlers) {
  var funcs = {
    then(onFulfilled, onRejected) { lazyPromise.Then(onFulfilled, onRejected) },
    catch(onRejected) { lazyPromise.Catch(onRejected) },
    finally(onFinally) { lazyPromise.Finally(onFinally) }
  };
  for (const hand of handlers)
    funcs[hand.meth](...hand.args);
  return lazyPromiseDo.promise;
}

function promiseDo (promise, handlers) {
  var funcs = {
    then(onFulfilled, onRejected) { return promise.then(onFulfilled, onRejected) },
    catch(onRejected) { return promise.catch(onRejected) },
    finally(onFinally) { return promise.finally(onFinally) }
  };
  for (const hand of handlers)
    promise = funcs[hand.meth](...hand.args);
  return promise;
}

function DefaultCatchHandler(v, msg) {
  msg = msg ? ` ${msg}.` : '';
  if (v instanceof Error) {
    console.warn(`micosmo:async:DefaultCatchHandler:${msg} Error(${v.message}). Returning 'undefined'`);
    if (v.stack)
      console.warn(v.stack);
    v = undefined;
  } else if (isPromisable(v))
    console.warn(`micosmo:async:DefaultCatchHandler:${msg} Rejected value is a Promise or Thenable. Returning resolved value`);
  else {
    console.warn(`micosmo:async:DefaultCatchHandler:${msg} Rejected(${v}). Returning 'undefined'`);
    v = undefined;
  }
  return Promise.resolve(v);
}

var isPromisable = function (v) {
  const utils = require('./utils');
  isPromisable = utils.isPromisable;
  return isPromisable(v);
}
