/**
 * string.js
 *
 * String related services
 *
 * StringBuilder
 * -------------
 * Constructs a string by collecting the parts into an array.
 * The final result is answered by joining the parts.
 */

'use strict';

const { isOperator } = require('./character');

module.exports = {
  StringBuilder,
  parseNameValues
}

function StringBuilder () {
  let str; let aStrings = [];
  return (Object.freeze({
    name: 'StringBuilder',
    append(o) {
      aStrings.push(String(o));
      str = undefined;
      return (this);
    },
    pop() {
      str = undefined;
      return (aStrings.pop());
    },
    clear() {
      aStrings = [];
      str = undefined;
      return (this);
    },
    atGet(idx) {
      return (this.toString()[idx]);
    },
    length() {
      return (this.toString().length);
    },
    segmentCount() {
      return (aStrings.length);
    },
    toString() {
      return (str || (str = aStrings.join('')));
    },
    substr(...args) {
      return (this.toString().substr(...args));
    },
    substring(...args) {
      return (this.toString().substring(...args));
    },
    splice(...args) {
      return (this.toString().splice(...args));
    }
  }));
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
  n(s) { return Number.parseFloat(s.trim()) },
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
