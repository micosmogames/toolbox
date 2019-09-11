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
  const lazyPromise = Object.create(LazyPromisePrototype);
  lazyPromise.isSettled = false;
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
  lazyPromise.isSettled = false;
  return lazyPromise;
};

function _LazyPromisePrototype() {
  return Object.create(Object, {
    isaLazyPromise: { value: true, enumerable: true },
    resolve: {
      value: function (v) {
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
  });
}

LazyPromise.resolve = v => LazyPromise().resolve(v);
LazyPromise.reject = v => LazyPromise().reject(v);

function assignPromise(lazyPromise, promise) {
  lazyPromise.promise = promise;
  promise.lazyPromise = lazyPromise;
  return promise;
}

function Semaphore(signals) {
  if (signals !== undefined && (typeof signals !== 'number' || signals <= 0))
    throw new Error('micosmo:async:Semaphore: Number of signals must be a number > 0');
  const sem = Object.create(SemaphorePrototype);
  return fPrivate.setObject(sem, {
    sem,
    signalCount: signals || 0,
    waiters: [],
  });
};

function _SemaphorePrototype() {
  return Object.create(Object, {
    isaSemaphore: { value: true, enumerable: true },
    signal: {
      value() {
        const Private = fPrivate(this);
        if (Private.waiters.length > 0) {
          const waiter = Private.waiters.shift();
          if (waiter.timer)
            clearTimeout(waiter.timer);
          waiter.lazyPromise.resolve();
        } else
          Private.signalCount++;
        return this;
      },
      enumerable: true
    },
    wait: {
      value() {
        const Private = fPrivate(this);
        if (Private.signalCount > 0) {
          Private.signalCount--;
          return LazyPromise.resolve().promise;
        }
        const lp = LazyPromise();
        Private.waiters.push({ lazyPromise: lp });
        return lp.promise
      },
      enumerable: true
    },
    waitFor: {
      value(ms) {
        if (typeof ms !== 'number' || ms <= 0)
          return this.wait();
        const Private = fPrivate(this);
        if (Private.signalCount > 0) {
          Private.signalCount--;
          return LazyPromise.resolve().promise;
        }
        const lp = LazyPromise();
        const timer = setTimeout(() => { removeWaiter(Private, lp); lp.resolve() }, ms);
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
