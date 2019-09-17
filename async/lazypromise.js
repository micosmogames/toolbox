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
const { Promises } = require('./lib/utils');

const LazyPromisePrototype = _LazyPromisePrototype();

module.exports = {
  LazyPromise,
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
          owner: This,
          get link() { return This.promise }
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
