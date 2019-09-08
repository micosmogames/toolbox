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
*/
const LazyPromisePrototype = _LazyPromisePrototype();

module.exports = {
  LazyPromise,
};

// LazyPromise
// Arguments: None
// Has resolve and reject methods to settle the Promise outide of the Promise's executor function.
function LazyPromise() {
  const lazyPromise = Object.create(LazyPromisePrototype);
  lazyPromise.isSettled = false;
  lazyPromise.promise = new Promise((resolve, reject) => {
    if (lazyPromise.isSettled) {
      if (lazyPromise.isResolved)
        resolve(lazyPromise.value)
      else
        reject(lazyPromise.value);
    } else {
      lazyPromise._resolve = resolve;
      lazyPromise._reject = reject;
    }
  });
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
      },
      enumerable: true
    },
    then: { value: function (resolve) { resolve(this.promise) }, enumerable: true },
    Then: { value: function (onResolved, onRejected) { return this.promise.then(onResolved, onRejected) }, enumerable: true },
    Catch: { value: function (onRejected) { return this.promise.catch(onRejected) }, enumerable: true },
    Finally: { value: function (onFinally) { return this.promise.finally(onFinally) }, enumerable: true },
  });
}
