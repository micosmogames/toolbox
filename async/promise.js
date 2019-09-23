/*
*  promise.js
*
*  Promise proxy objects that provide management services around a Promise.
*     Contract       - Object that can capture promise handlers that can be applied to managed promises or native promises at a later stage.
*                      Supports 3 classes:
*                         whenSealed: Applied to a promise as soon as it is created by sealing the contract.
*                         whenResolved : Applied to a promise when the promise has been resolved.
*                         whenRejected : Applied to a promise when a promise has been rejected.
*     SealedContract - Basic object structure that represents a native promise and and the handlers that have been applied to the promise.
*                      Automatically manages the promise chain from a single object reference preventing a split chain. Will also add
*                      a default rejection handler to the bottom of the chain when resloved or rejected. All SealedContract types
*                      are 'thenable', meaning that they can be substituted for a promise and will resolve down to the underlying native
*                      promise.
*     ProxyPromise   - Is the public form of a SealedContract.
*     AsyncPromise   - Public form of a SealedContract that ensures that the executor function is not run synchronously with the creation
*                      of the Promise object.
*     LazyPromise    - Variant of a SealedContract where there is no executor function specified. Instead the LazyPromise installs a
*                      default executor that will harvest the 'reject' and 'resolve' functions to allow the owner of the LazyPromise
*                      or any holder of the LazyPromise to directly control when the Promise is resolved or rejected.
*     Promises      -  Objects and services to manage promise 'then', 'catch' and 'finally' handlers as well enable objects that behave
*                      similar to SealedContracts to be both 'thenable' and accept 'then', 'catch' and 'finally' requests.
*                      Promises function provides a generic way of addressing the promises layer ('then', 'catch' and 'finally' interface)
*                      of a native or proxy Promise. This includes applying handlers to the SealContract that is attached to and who created
*                      a native Promise. There are two object forms, 'Recorder' that is used to record handlers rather than apply them such
*                      as for a Contract, and 'Applier' that will apply the handlers to a proxied promise such as SealedContracts.
*                      NOTE: Handlers can be directly applied to a native promise however if the promise is attached to SealedContract
*                            then this will potentially create a split promise chain.
*/
"use strict"

const { declareMethod, method } = require('@micosmo/core/method');
const { isPromisable } = require('./lib/utils');

var CatchHandler = DefaultCatchHandler;
const ExcecutorIsSynchronous = checkExecutorIsSynchronous();

module.exports = {
  Contract,
  Promises,
  ProxyPromise,
  AsyncPromise,
  LazyPromise,
  ExcecutorIsSynchronous,
  setDefaultCatchHandler
};

const ContractPrototype = _ContractPrototype();

function Contract(owner, fFinally) {
  if (typeof owner === 'function') {
    fFinally = owner; owner = undefined;
  } else if (fFinally && typeof fFinally !== 'function')
    throw new Error(`micosmo:async:Contract Finally must be a function`);
  const contract = Object.create(ContractPrototype);
  return Object.defineProperties(contract, {
    owner: { value: owner, enumerable: true },
    whenSealed: { value: Promises.Recorder(contract, owner), enumerable: true },
    whenResolved: { value: Promises.Recorder(contract, owner), enumerable: true },
    whenRejected: { value: Promises.Recorder(contract, owner), enumerable: true },
    whenSettled: { value: Promises.Recorder(contract, owner), enumerable: true },
    finally: { get() { return fFinally } }
  });
};

function _ContractPrototype() {
  return Object.create(Object, {
    isaContract: { value: true, enumerable: true },
    seal: { value: declareMethod(seal), enumerable: true },
    asyncSeal: { value: declareMethod(asyncSeal), enumerable: true },
  });
}

method(seal);
function seal(fExecutor) {
  return fExecutor ? ProxyPromise(fExecutor, this) : LazyPromise(this);
}

method(asyncSeal);
function asyncSeal(fExecutor) {
  return fExecutor ? AsyncPromise(fExecutor, this) : LazyPromise(this);
}

// NOTE: All SealedContract types are 'thenable' and can be pass wherever a Promise can be passed.
const SealedContractPrototype = _SealedContractPrototype();

function SealedContract(fExecutor, contract = EmptyContract) {
  return _SealedContract(new Promise(fExecutor), contract);
}

function ProxyPromise(fExecutor, contract = EmptyContract) {
  var sealedContract;
  sealedContract = SealedContract(fExecutor, contract);
  Object.defineProperty(sealedContract, 'isaProxyPromise', { value: true, enumerable: true });
  return sealedContract;
}

function AsyncPromise(fExecutor, contract = EmptyContract) {
  var sealedContract;
  if (ExcecutorIsSynchronous) {
    var fResolve, fReject;
    sealedContract = _SealedContract(new Promise((resolve, reject) => { fResolve = resolve; fReject = reject }), contract);
    Promise.resolve('pending').then(() => fExecutor(fResolve, fReject));
  } else
    sealedContract = SealedContract(fExecutor, contract);
  Object.defineProperty(sealedContract, 'isanAsyncPromise', { value: true, enumerable: true });
  return sealedContract;
}

function _SealedContract(promise, contract, prototype = SealedContractPrototype, ...mixins) {
  return __SealedContract(Object.create(prototype), promise, contract, ...mixins);
}

function __SealedContract(sealedContract, promise, contract, ...mixins) {
  Object.defineProperties(sealedContract, {
    isSettled: { value: false, writable: true, configurable: true },
    contract: { value: contract, enumerable: true },
    promise: { value: promise, writable: true, enumerable: true },
    promises: { value: Promises.Applier(sealedContract), enumerable: true },
    // Just save the original promise for now and throw away once settled.
    // Only want to hold the promise chain while the promise is pending.
    _root: { value: promise, writable: true }
  });
  mixins.forEach(mixin => Object.defineProperties(sealedContract, mixin));
  promise.sealedContract = sealedContract.sealedContract = sealedContract; // Allow easy checking for sealedContracts
  if (contract !== EmptyContract) {
    sealedContract.promises.then(v => applyWhenResolved(v, sealedContract), v => applyWhenRejected(v, sealedContract));
    contract.whenSealed.apply(sealedContract);
  } else
    sealedContract.promises.then(
      v => { appendDefaultRejectHandler(sealedContract); return v },
      v => { appendDefaultRejectHandler(sealedContract); throw v });
  return sealedContract;
}

function _SealedContractPrototype() {
  return Object.create(Object, {
    isaSealedContract: { value: true, enumerable: true },
    rootPromise: { get() { return this._root instanceof Promise ? this._root : (this._root = Promise.resolve(this._root)) }, enumerable: true },
    then: { value: function (resolve) { resolve(this.promise) }, enumerable: true },
    nextPromise: {
      value: function (promise) {
        promise.sealedContract = this;
        this.promise = promise;
      },
      enumerable: true
    },
    applyDefaultCatch: { value: function () { if (this.isSettled) this.promises.catch(Promises.reject) }, enumerable: true }
  })
}

function applyWhenResolved(v, sealedContract) {
  // Just save the resolved value for the rootPromise and we will create a replacement Promise if needed.
  sealedContract._root = v;
  const contract = sealedContract.contract;
  contract.whenResolved.apply(sealedContract);
  contract.whenSettled.apply(sealedContract);
  appendDefaultRejectHandler(sealedContract);
  return v;
}

function applyWhenRejected(v, sealedContract) {
  // In rejection case we will create the replacement rootPromise now.
  sealedContract._root = Promise.reject(v);
  const contract = sealedContract.contract;
  contract.whenRejected.apply(sealedContract);
  contract.whenSettled.apply(sealedContract);
  appendDefaultRejectHandler(sealedContract);
  throw v;
}

function appendDefaultRejectHandler(sealedContract) {
  const promises = sealedContract.promises;
  promises.catch(Promises.reject);
  if (sealedContract.contract.finally) {
    // Can't have just one rejection handler in this case as we always want
    // to run the finally handler.
    promises
      .then(sealedContract.contract.finally)
      .catch(Promises.reject);
  }
  Object.defineProperty(sealedContract, 'isSettled', { value: true, writable: false, configurable: false, enumerable: true });
}

// Has resolve and reject methods to settle the Promise outide of the Promise's executor function.
const LazyPromisePrototype = _LazyPromisePrototype();
function LazyPromise(contract = EmptyContract) {
  const lazyPromise = Object.create(LazyPromisePrototype);
  const fExecutor = ExcecutorIsSynchronous ? lazySyncExecutor(lazyPromise) : lazyAsyncExecutor(lazyPromise);
  return __SealedContract(lazyPromise, new Promise(fExecutor), contract);
};

function _LazyPromisePrototype() {
  return Object.create(SealedContractPrototype, {
    isaLazyPromise: { value: true, enumerable: true },
    resolve: {
      value: function (v) {
        this.isResolved = true;
        this.value = v
        if (this._resolve)
          this._resolve(v);
        return this;
      },
      enumerable: true
    },
    reject: {
      value: function (v) {
        this.isResolved = false;
        this.value = v
        if (this._reject)
          this._reject(v);
        return this;
      },
      enumerable: true
    },
  });
}

function lazySyncExecutor(lazyPromise) {
  return (resolve, reject) => {
    lazyPromise._resolve = resolve;
    lazyPromise._reject = reject;
  };
}

function lazyAsyncExecutor(lazyPromise) {
  return (resolve, reject) => {
    if (lazyPromise.isSettled) {
      if (lazyPromise.isResolved)
        resolve(lazyPromise.value)
      else
        reject(lazyPromise.value);
    } else {
      lazyPromise._resolve = resolve;
      lazyPromise._reject = reject;
    }
  };
}

LazyPromise.resolve = v => LazyPromise().resolve(v);
LazyPromise.reject = v => LazyPromise().reject(v);

function Promises(owner) {
  if (typeof owner !== 'object')
    return Promise.resolve(owner);
  if (owner.sealedContract)
    return owner.sealedContract.promises;
  if (owner instanceof Promise || owner.isaPromises)
    return owner;
  if (owner.promises)
    return owner.promises;
  return Promise.resolve(owner);
};

Promises.reject = function (v, msg) { return CatchHandler(v, msg) };
Promises.miReject = function (v, msg) { return DefaultCatchHandler(v, msg) };

// For objects that record promise handlers such as a Contract.
const PromisesRecorderPrototype = _PromisesRecorderPrototype();
Promises.Recorder = function (owner, parent = owner) {
  return Object.create(PromisesRecorderPrototype, {
    handlers: { value: [], enumerable: true },
    owner: { value: owner, enumerable: true },
    parent: { value: parent, enumerable: true },
  });
};

function _PromisesRecorderPrototype() {
  return Object.create(Object, {
    isaPromises: { value: true, enumerable: true },
    then: {
      value: function (onFulfilled, onRejected) {
        checkThen(onFulfilled, onRejected);
        this.handlers.push({ meth: 'then', args: [onFulfilled, onRejected] });
        return this;
      },
      enumerable: true
    },
    catch: {
      value: function (onRejected) {
        checkCatch(onRejected);
        this.handlers.push({ meth: 'catch', args: [onRejected] });
        return this;
      },
      enumerable: true
    },
    finally: {
      value: function (onFinally) {
        checkFinally(onFinally);
        this.handlers.push({ meth: 'finally', args: [onFinally] });
        return this;
      },
      enumerable: true
    },
    apply: {
      value: function (promise) {
        if (this.handlers.length > 0)
          return promise.isaSealedPromise
            ? sealedPromiseHandlersDo(promise, this.handlers) : promiseHandlersDo(promise, this.handlers);
      },
      enumerable: true
    },
    clear: { value: function () { this.handlers.splice(0); return this }, enumerable: true },
    applyAndClear: { value: function (promise) { const o = this.apply(promise); this.clear(); return o }, enumerable: true }
  })
};

function sealedPromiseHandlersDo(promise, handlers) {
  const promises = promise.promises;
  for (const hand of handlers)
    promises[hand.meth](...hand.args);
  return promise;
}

function promiseHandlersDo (promise, handlers) {
  if (promise.sealedContract)
    return sealedPromiseHandlersDo(promise.sealedContract, handlers).promise;
  for (const hand of handlers)
    promise = promise[hand.meth](...hand.args);
  return promise;
}

// For objects that wrap an underlying promise such as a SealedContract.
// Owner must have a 'promise' property and a nextPromise method.
// WARNING: Expects owner to have a real promise.
const PromisesApplierPrototype = _PromisesApplierPrototype();
Promises.Applier = function (owner, parent = owner) {
  return Object.create(PromisesApplierPrototype, {
    owner: { value: owner, enumerable: true },
    parent: { value: parent, enumerable: true }
  });
};

function _PromisesApplierPrototype() {
  return Object.create(Object, {
    isaPromises: { value: true, enumerable: true },
    then: {
      value: function (onFulfilled, onRejected) {
        checkThen(onFulfilled, onRejected);
        const owner = this.owner; owner.nextPromise(owner.promise.then(onFulfilled, onRejected));
        return this;
      },
      enumerable: true
    },
    catch: {
      value: function (onRejected) {
        if (onRejected === undefined) {
          if (this.owner.applyDefaultCatch) {
            this.owner.applyDefaultCatch();
            return this
          }
          onRejected = Promises.reject;
        }
        checkCatch(onRejected);
        const owner = this.owner; owner.nextPromise(owner.promise.catch(onRejected));
        return this;
      },
      enumerable: true
    },
    finally: {
      value: function (onFinally) {
        checkFinally(onFinally);
        const owner = this.owner; owner.nextPromise(owner.promise.finally(onFinally));
        return this;
      },
      enumerable: true
    },
  })
};

function checkThen(onFulfilled, onRejected) {
  if (typeof onFulfilled !== 'function' || (onRejected && typeof onRejected !== 'function'))
    throw new Error(`micosmo:async:Promises:then: Function required for onFulfilled and optional function for onRejected.`);
}
function checkCatch(onRejected) {
  if (typeof onRejected !== 'function')
    throw new Error(`micosmo:async:Promises:Recorder:catch: Function required for onRejected.`);
}
function checkFinally(onFinally) {
  if (typeof onFinally !== 'function')
    throw new Error(`micosmo:async:Promises:Recorder:finally: Function required for onFinally.`);
}

function setDefaultCatchHandler(fReject) {
  if (typeof fReject !== 'function')
    throw new Error(`micosmo:async:promise:setDefaultCatchHandler: Default catch handler must be a Function`);
  CatchHandler = fReject;
  return fReject;
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

function checkExecutorIsSynchronous() {
  var _fResolve;
  const promise = new Promise(resolve => { _fResolve = resolve });
  return [_fResolve !== undefined, promise][0]; // Yuk, but gets around lint concerns
}

var EmptyContract = Contract();
