/**
 * function.js
 *
 * Fucntion related services and utilities
 */
const BoundFunctions = new WeakMap();

const ProtGenFn = Object.getPrototypeOf(function * () { });
const MarkGen = String((function * () { })());

module.exports = {
  bind,
  isaGenerator,
  isaGeneratorFunction
}

// Alternate to f.bind(o) that returns the same bound function for the same input.
function bind(f, o) {
  let t; const bindings = BoundFunctions.get(o) || (BoundFunctions.set(o, (t = new WeakMap())), t);
  return bindings.get(f) || (bindings.set(f, (t = f.bind(o))), t);
}

function isaGenerator (fi) { return String(fi) === MarkGen }
function isaGeneratorFunction(f) { return typeof f === 'function' && Object.getPrototypeOf(f) === ProtGenFn }
