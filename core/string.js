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

const { isOperator, isWhitespace } = require('./character');

module.exports = {
  StringBuilder,
  parseNameValues,
  skip,
  skipRight,
  skipLeft
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
  for (let iData = 0, iSep = 0; iData < data.length; iData = iSep + 1) {
    iData = skipRight(data, iData);
    if (data[iData] === ':' && isOperator(data[iData + 1])) {
      // New separator character has been set. '::' will reset separator to 'sep' argument.
      iData++; chSep = data[iData] === '.' ? sep : data[iData]; iData++;
    }
    if ((iSep = data.indexOf(chSep, iData)) < 0) iSep = data.length;
    // Now process the content of this name/value pair.
    var tyHand = TypeHandler.s;
    var tyArray = false;
    if (data[iData] === '(') {
      var iStart = iData + 1;
      var iEnd = data.indexOf(')', iData);
      if (iEnd < 0)
        throw new Error(`micosmo:core:string:parseNameValues: Missing ')' for value type '${data.substring(iData)}'`);
      iData = iEnd + 1; iStart = skipRight(data, iStart);
      if (data[iStart] === '[') {
        tyArray = true; iStart++; const i = data.indexOf(']', iStart);
        if (i < 0 || i > iEnd)
          throw new Error(`micosmo:core:string:parseNameValues:: Missing ']' for value type '${data.substring(iStart - 2)}'`);
        iEnd = i;
      }
      [iStart, iEnd] = skip(data, iStart, iEnd - 1);
      tyHand = TypeHandler[data[iStart]]; // Match on first ty character.
      if (tyHand && iEnd === iStart + 1)
        tyHand = tyHand[data[iEnd]]; // Match on second ty character if present.
      if (!tyHand || typeof tyHand !== 'function' || iEnd - iStart > 1)
        throw new Error(`micosmo:core:string:parseNameValues: Invalid value type '${data.substring(iStart, iEnd + 1)}'`);
    }
    const i = data.indexOf(':', iData);
    if (i < 0) {
      if (tyHand === TypeHandler.s || tyHand === TypeHandler.r.s) {
        const name = getString(data, iData, iSep - 1);
        if (name) oTgt[name] = '';
        return oTgt;
      }
      throw new Error(`micosmo:core:string:parseNameValues: Invalid value for '${data.substring(iData, iSep)}'`);
    }
    const name = getString(data, iData, i - 1);
    if (!name)
      throw new Error(`micosmo:core:string:parseNameValues: Missing name for value '${data.substring(i, iSep)}'`);
    oTgt[name] = tyArray ? parseValues(data, tyHand, i + 1, iSep - 1) : tyHand(data, i + 1, iSep - 1);
  }
  return oTgt;
}

function skipRight(s, iStart = 0) {
  for (; iStart < s.length && isWhitespace(s[iStart]); iStart++);
  return iStart;
}

function skipLeft(s, iEnd = s.length - 1) {
  for (; iEnd >= 0 && isWhitespace(s[iEnd]); iEnd--);
  return iEnd;
}

const SkipRetVals = [];
function skip(s, iStart, iEnd) {
  SkipRetVals[0] = skipRight(s, iStart); SkipRetVals[1] = skipLeft(s, iEnd);
  return SkipRetVals;
}

function parseValues(data, tyHand, iStart, iEnd) {
  const vals = [];
  for (let i = data.indexOf(',', iStart); i <= iEnd; iStart = i + 1, i = data.indexOf(',', iStart)) {
    if (i < 0) { vals.push(tyHand(data, iStart, iEnd)); break }
    vals.push(tyHand(data, iStart, i - 1));
  }
  return vals;
}

function getString(s, iStart, iEnd) {
  iStart = skipRight(s, iStart); iEnd = skipLeft(s, iEnd);
  return iStart > 0 || iEnd < s.length - 1 ? s.substring(iStart, iEnd + 1) : s;
}

var TypeHandler = {
  s(s, iStart, iEnd) { return getString(s, iStart, iEnd) },
  b(s, iStart) { iStart = skipRight(s, iStart); let i = 0; while (i < 4 && s[iStart++] === 'true'[i++]); return i === 4 },
  r: {
    s(s, iStart, iEnd) { return iStart > 0 || iEnd < s.length - 1 ? s.substring(iStart, iEnd + 1) : s },
  },
  i(s, iStart, iEnd) { return parseInt(getString(s, iStart, iEnd)) },
  f(s, iStart, iEnd) { return parseFloat(getString(s, iStart, iEnd)) },
  v: {
    '2'(s, iStart, iEnd) { return toVector(s, iStart, iEnd, 2) },
    '3'(s, iStart, iEnd) { return toVector(s, iStart, iEnd, 3) },
    '4'(s, iStart, iEnd) { return toVector(s, iStart, iEnd, 4) }
  }
};

const VectorProps = ['x', 'y', 'z', 'w'];
function toVector(s, iStart, iEnd, sz) {
  const vec = {};
  let count = 0;
  for (let i = s.indexOf(' ', iStart); i <= iEnd && count < sz; iStart = i + 1, i = s.indexOf(' ', iStart)) {
    if (i < 0) { if (iStart <= iEnd) vec[VectorProps[count++]] = TypeHandler.f(s, iStart, iEnd); break }
    if (iStart > i - 1) continue;
    vec[VectorProps[count++]] = TypeHandler.f(s, iStart, i - 1);
  }
  for (; count < sz; vec[VectorProps[count++]] = 0.0);
  return vec;
}
