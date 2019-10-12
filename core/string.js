/**
 * string.js
 *
 * String related services
 *
 * StringBuilder
 * -------------
 * Constructs a string by collecting the parts into an array. The final result is answered by joining the parts.
 *
 * parseNameValues string format:
 * ------------------------------
 * [: <sep>][ ( <type> ) or ( [ <type ] ) ] <name> : <value>[, <value> , ...] <sep> ...
 *    where:
 *      <type> : s - trim str, rs - raw str, i - int, f - float, b - boolean
 *               v2 - { x, y }, v3 - { x, y, z}, v4 - { x, y, z, w }
 *               Defaults to 's'.
 *      <sep> : Specifies the separator character for the next and subsequent name/value(s) pair.
 *              '::' resets to the separator passed with the fn call. Defaults to ';'.
 *      <name> : The name of the pair
 *      <value> : The value of the pair. If type is of the form '([<type])' then the value is an array
 *                of <type> with values separated by a ','.
 */

'use strict';

const { isOperator } = require('./character');

module.exports = {
  StringBuilder,
  parseNameValues
}

const StringBuilderPrototype = Object.create(Object.prototype, {
  name: { value: 'StringBuilder', enumerable: true }, // Deprecated. Use 'isaStringBuilder'
  isaStringBuilder: { value: true, enumerable: true },
  charAt: { value(idx) { return this.toString()[idx] }, enumerable: true },
  length: { value() { return this.toString().length }, enumerable: true },
  pop: { value() { return this.remove(this.segmentCount() - 1) }, enumerable: true },
  shift: { value() { return this.remove(0) }, enumerable: true },
  substr: { value(...args) { return this.toString().substr(...args) }, enumerable: true },
  substring: { value (...args) { return this.toString().substring(...args) }, enumerable: true },
  splice: { value(...args) { return this.toString().splice(...args) }, enumerable: true }
});

function StringBuilder () {
  let str; const aStrings = [];
  return Object.create(StringBuilderPrototype, {
    append: { value(s) { aStrings.push(typeof s === 'string' ? s : String(s)); str = undefined; return this }, enumerable: true },
    remove: { value(idx) { const a = aStrings.splice(idx, 1); return a[0] }, enumerable: true },
    clear: { value() { aStrings.length = 0; str = undefined; return this }, enumerable: true },
    atGet: { value(idx) { return (aStrings[idx]) }, enumerable: true }, // Returns the string segment at idx position
    atPut: { value(idx, s) { str = undefined; aStrings[idx] = typeof s === 'string' ? s : String(s); return this }, enumerable: true },
    segmentCount: { value() { return aStrings.length }, enumerable: true },
    toString: { value() { return str || (str = aStrings.join('')) }, enumerable: true },
  });
}

function parseNameValues(data, oTgt = Object.create(null), sep = ';') {
  let chSep = sep;
  while (data) {
    data = data.trimStart();
    if (data[0] === ':' && isOperator(data[1])) {
      // New separator character has been set. '::' will reset separator to 'sep' argument.
      chSep = data[1] === '.' ? sep : data[1];
      data = data.substring(2);
    }
    let i = data.indexOf(chSep);
    let s = i < 0 ? data : data.substring(0, i);
    data = i < 0 ? '' : data.substring(i + 1);
    // Now process the content of this name/value pair.
    var ty = 's';
    var tyArray = false;
    if (s[0] === '(') {
      var iStart = 1;
      var iEnd = s.indexOf(')');
      if (iEnd < 0)
        throw new Error(`micosmo:aframe:utils:parse: Missing end ')' for entry type '${s}'`);
      const sRem = s.substring(iEnd + 1);
      if (s[1] === '[') { tyArray = true; iEnd--; iStart = 2 };
      ty = s.substring(iStart, iEnd).trim();
      if (ty === '' || !TypeHandler[ty])
        throw new Error(`micosmo:aframe:utils:parse: Invalid entry type '${ty}'`);
      s = sRem;
    }
    i = s.indexOf(':');
    if (i < 0) {
      if (ty === 's' || ty === 'rs') {
        if ((s = s.trim()) !== '') oTgt[s] = '';
        return oTgt;
      }
      throw new Error(`micosmo:aframe:utils:parse: Invalid value for '${s}'`);
    }
    const name = s.substring(0, i).trim();
    if (name === '')
      throw new Error(`micosmo:aframe:utils:parse: Value '${s}' has an invalid name`);
    s = s.substring(i + 1);
    oTgt[name] = tyArray ? parseValues(s.split(',')) : TypeHandler[ty](s);
  }
  return oTgt;
}

function parseValues(vals, ty) {
  const f = TypeHandler[ty];
  vals.forEach((s, idx) => { vals[idx] = f(s) });
}

var TypeHandler = {
  s(s) { return s.trim() },
  b(s) { return s.trim() === 'true' },
  rs(s) { return s },
  i(s) { return Number.parseInt(s.trim()) },
  f(s) { return Number.parseFloat(s.trim()) },
  v2(s) { return toVector(s, 2) },
  v3(s) { return toVector(s, 3) },
  v4(s) { return toVector(s, 4) }
};

const VectorProps = ['x', 'y', 'z', 'w'];
function toVector(s, sz) {
  const vec = {};
  let count = 0;
  s.trim().split(' ').forEach(v => {
    if (v) vec[VectorProps[count++]] = TypeHandler.n(v);
  });
  for (; count < sz; count++)
    vec[VectorProps[count++]] = 0.0;
  return vec;
}
