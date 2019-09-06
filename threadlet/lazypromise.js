/*
*  lazypromise.js
*
*  Implements a wrapper around a Promise to allow the Promise to be settled by the LazyPromise instead of the Promise executor function.
*  The Promise executor either yields up the resolve and reject functions to the LazyPromise if the LazyPromise is yet to be settled, or
*  applies the settlement that is captured within the LazyPromise should this have already occurred.
*
*  The creator of the LazyPromise typically holds the LazyPromise and passes the underlying Promise to interested parties.
*
*  Also implements the then, catch and finally methods to pass on to the underlying Promise.
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
        if (this._resolve)
          this._resolve(v);
        else {
          this.isSettled = true;
          this.isResolved = true;
          this.value = v
        }
      },
      enumerable: true
    },
    reject: {
      value: function (v) {
        if (this._reject)
          this._reject(v);
        else {
          this.isSettled = true;
          this.isResolved = false;
          this.value = v
        }
      },
      enumerable: true
    },
    then: { value: function (...args) { return this.promise.then(...args) }, enumerable: true },
    catch: { value: function (...args) { return this.promise.catch(...args) }, enumerable: true },
    finally: { value: function (...args) { return this.promise.finally(...args) }, enumerable: true },
  });
}
