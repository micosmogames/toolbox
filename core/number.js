/**
 * number.js
 *
 * Number related services
 */

'use strict';

module.exports = {
  randomInt
}

function randomInt(x1, x2) {
  const delta = Math.abs(x2 - x1);
  const r = Math.random() * (delta + 1);
  const ri = Math.trunc(r);
  return ri + Math.min(x1, x2);
}
