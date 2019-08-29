/*
 *  method.js
 *
 *  Runtime decoraters to explicitly define and uplift functions as methods.
 *
 *  Supports a coding policy that limits the use of 'this' to well defined method functions.
 *  These include object literal property function definitions, module functions declared as methods or
 *  module functions promoted to methods.
 *  All other function definitions should not reference 'this', other than arrow functions that are
 *  defined within the body of a method.
 *
 */
"use strict";

module.exports = {
  asDeclaredMethod,
  checkThis,
  declareMethod,
  isaDeclaredMethod,
  method
};

// Promotes a non-method function to pass 'this' as the first parameter. The function is assumed to interact with
// an object that is accepted as the first argument.
function asDeclaredMethod(f) {
  if (typeof f !== 'function')
    throw new Error('method:asDeclaredMethod: Requires a function');
  return f.isaDeclaredMethod ? f : declareMethod(function (...args) {
    return f(this, ...args);
  });
}

// Checks that a method has a valid 'this'.
// If 'o' is a function then it must be a method and we wrap the method with the checking logic.
// Otherwise we assume that o is a 'this' and we perform and inline check. Must be a value other than
// 'globalThis'.
function checkThis(o) {
  if (typeof o === 'function') {
    const f = o;
    if (!f.isaDeclaredMethod)
      throw new Error(`method:checkThis: Function is not a method`);
    const fMeth = declareMethod(function (...args) {
      if (this === _globalThis())
        throw new Error('method:checkThis: Attempting to call a method as a function. Require o.method(...), method.bind(o)(...) or method.call(o, ...)');
      return f.call(this, ...args);
    });
    fMeth.method = f;
    return fMeth;
  }
  if (o === _globalThis())
    throw new Error(`method:checkThis: 'this' value has not been bound to the function. Require o.function(...), function.bind(o)(...) or function.call(o, ...)`);
  return o;
}

function _globalThis() {
  return this;
}

// Explicit declaration that a function is actually a method that references 'this'.
function declareMethod(f) {
  if (typeof f !== 'function')
    throw new Error('method:declaredMethod: Requires a function');
  f.isaDeclaredMethod = true;
  return f;
}

function isaDeclaredMethod(f) {
  return typeof f === 'function' && f.isaDeclaredMethod === true
}

// The method decorator is intended to explicitly define that the function being assigned to an object property
// must be a method. If the function is not a method then implicitly promoted instance of the function is returned.
function method(f) {
  if (!f)
    throw new Error(`method:method: Function has not been defined. Possible call to 'method' before 'declareMethod'`);
  if (typeof f !== 'function')
    throw new Error(`method:method: Requires a function`);
  return f.isaDeclaredMethod ? f : asDeclaredMethod(f);
}