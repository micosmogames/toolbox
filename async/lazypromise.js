/*
*  lazypromise.js
*
*  Implements a wrapper around a Promise to allow the Promise to be settled by the LazyPromise instead of the Promise executor function.
*  The Promise executor either yields up the resolve and reject functions to the LazyPromise if the LazyPromise is yet to be settled, or
*  applies the settlement that is captured within the LazyPromise should this have already occurred.
*
*  The creator of the LazyPromise typically holds the LazyPromise and passes the underlying Promise to interested parties.
*  A LazyPromise is thenable and will resolve to the underlying promise.
*
*  Also implements helper Then, Catch and Finally methods to pass on as then, catch & finally to the underlying Promise.
*  The capitalisation is required as the 'then' method allows the LazyPromise to be thenable.
*  Note that Then, Catch & Finally calls to the LazyPromise update the underlying promise that is held by the LazyPromise.
*  This will not occur if then, catch & finally calls are applied to LazyPromise.promise directly.
*/
const core = require('@micosmo/core');
const fPrivate = core.newPrivateSpace();
const { Promises } = require('./lib/utils');

const LazyPromisePrototype = _LazyPromisePrototype();
const SemaphorePrototype = _SemaphorePrototype();

module.exports = {
  LazyPromise,
  Semaphore
};

// LazyPromise
// Arguments: None
// Has resolve and reject methods to settle the Promise outide of the Promise's executor function.
function LazyPromise() {
  const lazyPromise = Object.create(LazyPromisePrototype, {
    isSettled: { value: false, writable: true, enumerable: true },
    _mustCatch: { value: true, writable: true, enumerable: true },
  });
  assignPromise(lazyPromise, new Promise((resolve, reject) => {
    if (lazyPromise.isSettled) {
      if (lazyPromise.isResolved)
        resolve(lazyPromise.value)
      else
        reject(lazyPromise.value);
    } else {
      lazyPromise._resolve = resolve;
      lazyPromise._reject = reject;
    }
  }));
  lazyPromise.lazyPromise = lazyPromise; // Align with Promises that are attached to LazyPromises
  return lazyPromise;
};

function _LazyPromisePrototype() {
  return Object.create(Object, {
    isaLazyPromise: { value: true, enumerable: true },
    mustCatch: { value: function (bool) { this._mustCatch = bool; return this }, enumerable: true },
    resolve: {
      value: function (v) {
        if (this._mustCatch)
          this.Catch(Promises.reject);
        this.isSettled = true;
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
        if (this._mustCatch)
          this.Catch(Promises.reject);
        this.isSettled = true;
        this.isResolved = false;
        this.value = v
        if (this._reject)
          this._reject(v);
        return this;
      },
      enumerable: true
    },

    then: { value: function (resolve) { resolve(this.promise) }, enumerable: true },
    Then: { value: function (onResolved, onRejected) { return assignPromise(this, this.promise.then(onResolved, onRejected)) }, enumerable: true },
    Catch: { value: function (onRejected) { return assignPromise(this, this.promise.catch(onRejected)) }, enumerable: true },
    Finally: { value: function (onFinally) { return assignPromise(this, this.promise.finally(onFinally)) }, enumerable: true },

    promises: {
      get: function() {
        const This = this;
        return this._promises || (this._promises = {
          then: function (onResolved, onRejected) { This.Then(onResolved, onRejected); return this },
          catch: function (onRejected) { This.Catch(onRejected); return this },
          finally: function (onFinally) { This.Finally(onFinally); return this },
          owner: This
        });
      },
      enumerable: true
    }
  });
}

LazyPromise.resolve = v => LazyPromise().resolve(v);
LazyPromise.reject = v => LazyPromise().reject(v);

function assignPromise(lazyPromise, promise) {
  lazyPromise.promise = promise;
  promise.lazyPromise = lazyPromise;
  return lazyPromise;
}

// Semaphore implementation based on LazyPromises

// Allow return values
function Semaphore(signals) {
  var signalValues = [];
  if (signals !== undefined) {
    if (typeof signals === 'number' && signals > 0)
      signalValues.length = signals;
    else if (Array.isArray(signals))
      signalValues = signals.slice(0);
    else
      throw new Error('micosmo:async:Semaphore: Initial signals must be a number > 0 or an array of signal values');
  }
  const sem = Object.create(SemaphorePrototype);
  return fPrivate.setObject(sem, {
    sem,
    signalValues,
    waiters: [],
  });
};

function _SemaphorePrototype() {
  return Object.create(Object, {
    isaSemaphore: { value: true, enumerable: true },
    signal: {
      value(v) {
        const Private = fPrivate(this);
        if (Private.waiters.length > 0) {
          const waiter = Private.waiters.shift();
          if (waiter.timer)
            clearTimeout(waiter.timer);
          waiter.lazyPromise.resolve(v);
        } else
          Private.signalValues.push(v);
        return this;
      },
      enumerable: true
    },
    wait: {
      value(ms, timeoutValue) {
        const Private = fPrivate(this);
        if (Private.signalValues.length > 0)
          return LazyPromise.resolve(Private.signalValues.shift()).promise;
        const lp = LazyPromise();
        var timer;
        if (ms !== undefined && typeof ms === 'number' && ms > 0)
          timer = setTimeout(() => { removeWaiter(Private, lp); lp.resolve(timeoutValue) }, ms);
        Private.waiters.push({ lazyPromise: lp, timer });
        return lp.promise
      },
      enumerable: true
    }
  });
}

function removeWaiter(Private, lp) {
  const waiters = Private.waiters;
  for (let i = 0; i < waiters.length; i++) {
    if (waiters[i].lazyPromise !== lp)
      continue;
    waiters.splice(i, 1);
    return
  }
}
