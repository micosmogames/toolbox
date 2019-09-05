/*
*  lazypromise.js
*  An object that looks like a promise but defers instantiation until the lazy promise
*  is manually reolved or rejected. Allows interfaces to return promises that don't have
*  an implementation for determining resolution, but are dependent on some event.
*/
const { declareMethod, method } = require('@micosmo/core');

var Catch = declareMethod(_Catch);
var Then = declareMethod(_Then);
var Final = declareMethod(_Final);
var Resolve = declareMethod(_Resolve);
var Reject = declareMethod(_Reject);

const LazyPromisePrototype = _LazyPromisePrototype();

module.exports = {
  LazyPromise,
};

// LazyPromise
// Arguments: None
// Has resolve and reject methods to defer the creation of the promise structure.
function LazyPromise() {
  return Object.create(LazyPromisePrototype, {
    handlers: { value: [], enumerable: true },
  });
};

function _LazyPromisePrototype() {
  return Object.create(Object, {
    isaLazyPromise: { value: true, enumerable: true },
    catch: { value: method(Catch), enumerable: true },
    then: { value: method(Then), enumerable: true },
    finally: { value: method(Final), enumerable: true },
    resolve: { value: method(Resolve), enumerable: true },
    reject: { value: method(Reject), enumerable: true },
  });
}

function _Catch(reject) {
  const chainedPromise = LazyPromise();
  this.handlers.push([chainedPromise, undefined, reject, undefined]);
  return chainedPromise;
};

function _Then(resolve, reject) {
  const chainedPromise = LazyPromise();
  this.handlers.push([chainedPromise, resolve, reject, undefined]);
  return chainedPromise;
};

function _Final(final) {
  const chainedPromise = LazyPromise();
  this.handlers.push([chainedPromise, undefined, undefined, final]);
  return chainedPromise;
};

function _Resolve(v) {
  // Navigate through the then and finally clauses and build a resolved
  // Promise structure.
  buildPromises(Promise.resolve(v), this);
};

function _Reject(v) {
  // Navigate through the then and finally clauses and build a rejected
  // Promise structure.
  buildPromises(Promise.reject(v), this);
};

function buildPromises(promise, lazyPromise) {
  lazyPromise.handlers.forEach(spec => {
    navigateChain(promise, spec);
  });
}

function navigateChain(promise, spec, fNext) {
  const [chainedPromise, resolve, reject, final] = spec;
  var nextPromise;
  if (resolve)
    nextPromise = promise.then(resolve, reject);
  else if (reject)
    nextPromise = promise.catch(reject);
  else
    nextPromise = promise.finally(final);
  buildPromises(nextPromise, chainedPromise);
}
