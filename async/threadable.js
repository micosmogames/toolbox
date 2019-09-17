/*
*  threadable.js
*
*  Threadables are asynchronous GeneratorFunctions that can be either managed by a Threadlet or
*  called inline. If called inline they are implemented as an async function which returns a Promise.
*  All returned or yielded values are waited on which will block the async function if the value
*  is a Promise or Thenable.
*  If managed by a Threadlet all yield and return points give the Threadlet scheduler the opportunity
*  to reschedule threadlets passed on assigned priorities, timeslice and yield intervals.
*
*  A Threadlet will only manage Threadables and will ignore any non Threadable functions and
*  generators. Threadlet has 3 methods for setting up Threadable generators with parameters.
*
*     . threadable.with(...args)    - Returns a generator instance for the Threadable.
*     . threadable.bindWith(This, ..args) - As above but binds This to the Threadable
*     . Threadable.with(v, ...args) - Takes any value and returns a Threadable generator.
*                                     Args will be injected to produce Threadable generators
*                                     for Functions and GeneratorFunctions.
*                                     If v is a non function type then a generator that
*                                     returns v or [v, ...args] is returned.
*     . Threadable.bindWith(This, v, ...args) - As above but binds This if v is a function.
*/
const { isaGeneratorFunction, isaGenerator } = require('@micosmo/core/function');

module.exports = {
  Threadable,
};

// Threadable
// Arguments:
//    1. Any function type
function Threadable(f) {
  var fThreadable;
  if (typeof f !== 'function')
    throw new Error(`micosmo:async:Threadable: Function is required.`);
  if (f.isaThreadable)
    return f;
  if (isaGeneratorFunction(f))
    fThreadable = makeThreadbleDriver(f);
  else {
    fThreadable = f;
    f = makeGeneratorFunction(f);
  }
  Object.defineProperties(fThreadable, {
    isaThreadable: { value: true, enumerable: true },
    fGenerator: { value: f, enumerable: true },
    with: { value(...args) { return setThreadable(f(...args)) }, enumerable: true },
    bindWith: { value(This, ...args) { return setThreadable(f.bind(This)(...args)) }, enumerable: true }
  });
  return fThreadable;
};

Threadable.with = function(v, ...args) {
  const gf = asGeneratorFunction(v);
  return setThreadable(gf ? gf(...args) : v);
}

Threadable.bindWith = function (This, v, ...args) {
  const gf = asGeneratorFunction(v);
  return setThreadable(gf ? gf.bind(This)(...args) : v);
}

function asGeneratorFunction (v) {
  if (isaGenerator(v))
    return;
  if (isaGeneratorFunction(v))
    return v;
  return typeof v === 'function'
    ? (v.isaThreadable ? v.fGenerator : makeGeneratorFunction(v))
    : function * (...args) { return args.length === 0 ? v : [v, ...args] };
}

Threadable.sleep = function (s) { return new Promise(resolve => { setTimeout(() => resolve(s), s * 1000) }) }
Threadable.msSleep = function (ms) { return new Promise(resolve => { setTimeout(() => resolve(ms), ms) }) }

// Generator function support services

function makeGeneratorFunction(f) {
  return function * (...args) {
    return f.call(this, ...args);
  }
}

function makeThreadbleDriver(fGen) {
  return (...args) => threadbleDriver(fGen, args);
}

async function threadbleDriver(fGen, args) {
  const stack = [fGen.call(this, ...args)];
  var resp, value;
  while (stack.length > 0) {
    var gi = stack.shift();
    for (;;) {
      resp = gi.next(value);
      value = resp.value;
      if (typeof value === 'function')
        value = value.isaThreadable ? value() : value; // Get back a Promise from Threadable
      else if (isaGenerator(value) && value.isaThreadable) {
        if (!resp.done)
          stack.push(gi);
        gi = value; value = undefined;
        continue;
      }
      if (resp.done)
        break;
      value = await value;
    }
  }
  return value;
}

function setThreadable(o) {
  if (!o.isaThreadable)
    Object.defineProperty(o, 'isaThreadable', { value: true, enumerable: true });
  return o;
}
