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

module.exports = {
  StringBuilder
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
