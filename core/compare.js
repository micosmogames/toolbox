/**
 * compare.js
 *
 * Value comparison services
 */

'use strict';

module.exports = {
  equivalent,
  equivalentArrays,
  equivalentObjects
}

function equivalent(v1, v2) {
  return v1 === v2 ? true : Equivalent[typeof v1](v1, v2);
}

function equivalentArrays(a1, a2, map) {
  if (a1 === a2)
    return true;
  if (a1.length !== a2.length)
    return false;
  return checkMapFirst(a1, a2, map, map => {
    for (let i = 0; i < a1.length; i++) {
      const v1 = a1[i]; const v2 = a2[i];
      if (v1 !== v2 && !Equivalent[typeof v1](v1, v2, map))
        return false;
    }
    return true;
  });
}

function equivalentObjects(o1, o2, map) {
  if (o1 === o2)
    return true;
  if (Object.getPrototypeOf(o1) !== Object.getPrototypeOf(o2))
    return false;
  return checkMapFirst(o1, o2, map, map => {
    const keys1 = Object.keys(o1); const keys2 = Object.keys(o2);
    if (!equivalentKeys(keys1.sort(), keys2.sort()))
      return false;
    for (const key of keys1) {
      const v1 = o1[key]; const v2 = o2[key];
      if (v1 !== v2 && !Equivalent[typeof v1](v1, v2, map))
        return false;
    }
    return true;
  });
}

function equivalentKeys(a1, a2) {
  for (let i = 0; i < a1.length; i++) {
    if (a1[i] !== a2[i])
      return false
  }
  return true;
}

function checkMapFirst(v1, v2, map, fEquivalent) {
  if (!map) {
    map = new Map(); map.set(v1, [v2]); map.set(v2, [v1]);
    return fEquivalent(map);
  }
  var mv = map.get(v1);
  if (mv) {
    if (mv.includes(v2))
      return true; // Just answer true as this comparison has already occurred or is occurring
    mv.push(v2);
  } else
    map.set(v1, [v2]);

  mv = map.get(v2);
  if (mv) {
    mv.push(v1);
  } else
    map.set(v2, [v1]);
  return fEquivalent(map);
}

var fFalse = () => false;
var Equivalent = {
  string: fFalse,
  function: fFalse,
  number: fFalse,
  bigint: fFalse,
  boolean: fFalse,
  symbol(v1, v2) { return typeof v2 === 'symbol' ? v1.toString() === v2.toString() : false },
  undefined(v1, v2) { return v2 === null },
  object(v1, v2, map) {
    if (v1 === null)
      return v2 === undefined;
    if (Array.isArray(v1))
      return Array.isArray(v2) ? equivalentArrays(v1, v2, map) : false;
    return typeof v2 === 'object' ? equivalentObjects(v1, v2, map) : false;
  }
}
