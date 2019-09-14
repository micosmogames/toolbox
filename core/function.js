/**
 * function.js
 *
 * Fucntion related services and utilities
 */
const ProtGenFn = Object.getPrototypeOf(function * () { });
const MarkGen = String((function * () { })());

module.exports = {
  bind: require('./bind').bind,
  isaGenerator,
  isaGeneratorFunction
}

function isaGenerator (fi) { return String(fi) === MarkGen }
function isaGeneratorFunction(f) { return typeof f === 'function' && Object.getPrototypeOf(f) === ProtGenFn }
