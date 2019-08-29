/*
 *  bind.js
 *  Alternate to f.bind(o) that returns the same bound function for the same input.
 */
"use strict";

module.exports = {
  bind
};

const BoundFunctions = new WeakMap();

function bind(f, o) {
  let t; const bindings = BoundFunctions.get(f) || (BoundFunctions.set(f, (t = new WeakMap())), t);
  return bindings.get(o) || (bindings.set(o, (t = f.bind(o))), t);
}
