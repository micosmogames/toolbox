/*
 *  method.js
 *
 *  Helper decorater service to uplift a function to an object method.
 *
 *  Supports a coding policy that limits the use of 'this' to the body of an object literal.
 *  Module level functions are functional only and should not reference the 'this' binding and
 *  therefore must accept a target object as the first parameter. The method function wraps
 *  functional functions and maps the 'this' binding to the first parameter, allowing non
 *  method functions to be referenced within an object.
 *
 */
"use strict";

module.exports = {
  method
};

function method(f) {
  return function (...args) {
    return f(this, ...args);
  }
}
