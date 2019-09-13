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
 *  Coding style:
 *
 *      declareMethods(meth1, meth2, ...); // At top of module
 *      ...
 *      const myObject = {
 *        meth1: method(meth1), // Requires that 'meth1' is a method and has been declared
 *        meth2: checkThis(method(meth2)), // 'meth2' must be a method and makes sure that when called there is a valid 'this'
 *        meth3: asDeclaredMethod(f1), // Promotes 'f1' to be a method. Maps 'this' to arg0
 *        ...
 *      };
 *      ...
 *      method(meth1); // Defines the function 'meth1' as a method and makes sure that it is declared
 *      function meth1() {
 *        ...
 *      }
 *
 */
'use strict';

const { isGlobalThis } = require('./object');

module.exports = {
  asDeclaredMethod,
  checkThis,
  declareMethods,
  declareMethod,
  isaDeclaredMethod,
  method
};

// Promotes a non-method function to pass 'this' as the first parameter. The function is assumed to interact with
// an object that is accepted as the first argument.
function asDeclaredMethod(f) {
  if (typeof f !== 'function')
    throw new Error('micosmo:method:asDeclaredMethod: Requires a function');
  return f.isaDeclaredMethod ? f : declareMethod(function (...args) {
    return f(this, ...args);
  });
}

// Checks that a method has a valid 'this'.
// If 'o' is a function then if not a method it will first be promoted to a method and we wrap the method with the checking logic.
// Otherwise we assume that o is a 'this' and we perform and inline check. Must be a value other than 'globalThis'.
// The optional flAllowFunctions argument treats functions as a value.
function checkThis(v, flAllowFunctions = false) {
  const msg = 'Attempting to call a method as a function. Require o.method(...), method.bind(o)(...) or method.call(o, ...)';
  if (typeof v === 'function' && !flAllowFunctions) {
    var f = v;
    if (f.method)
      return f; // Already wrapped
    if (!f.isaDeclaredMethod)
      f = asDeclaredMethod(f);
    const fMeth = declareMethod(function (...args) {
      if (isGlobalThis(this))
        throw new Error(`micosmo:method:checkThis: ${msg}`);
      return f.call(this, ...args);
    });
    fMeth.method = f;
    return fMeth;
  }
  if (isGlobalThis(v))
    throw new Error(`micosmo:method:checkThis: Inline - ${msg}`);
  return v;
}

// Explicit declaration that a function is actually a method that references 'this'.
function declareMethod(f) {
  if (typeof f !== 'function')
    throw new Error('micosmo:method:declaredMethod: Requires a function');
  f.isaDeclaredMethod = true;
  return f;
}

// Explicit declare one or more methods. This is typically placed at the top of a module.
function declareMethods(...args) {
  args.forEach(f => declareMethod(f))
}

function isaDeclaredMethod(f) {
  return typeof f === 'function' && f.isaDeclaredMethod === true
}

// The method decorator is intended to explicitly define that the function being assigned to an object property
// must be a method. As of 0.2.0 no longer promotes functions to methods, instead generates an error.
function method(f) {
  if (!f)
    throw new Error(`micosmo:method:method: Function has not been defined. Possible call to 'method' before 'declareMethod' or 'declareMethods'`);
  if (typeof f !== 'function')
    throw new Error(`micosmo:method:method: Requires a function`);
  if (!f.isaDeclaredMethod)
    throw new Error(`micosmo:method:method: Function has not been declared as a method. Func(${f})`);
  return f;
}
