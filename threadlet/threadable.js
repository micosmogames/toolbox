/*
*  threadable.js
*
*  Threadables are asynchronous GeneratorFunctions that can be either managed by a Threadlet or
*  called inline. If called inline they are implemented as an async function which returns a Promise.
*  Promises that are yielded or returned from the Generator are waited on, whilst other values from
*  a yield are immediately passed back in the next() Generator call.
*  If managed by a Threadlet all yield and return points give the Threadlet arbitrator the opportunity
*  to reschedule threadlets passed on assigned priorities, timeslice and yield intervals.
*
*  A Threadlet will only manage Threadables and will ignore any non Threadable functions and
*  generators. Threadlet has 3 methods for setting up Threadable generators with parameters.
*
*     . Threadable.invoke(f, ...args)    - Returns a Threadable generator if f is Threadable, otherwise
*                                          just returns the result from f(..args).
*     . Threadable.call(This, f, ..args) - As for invoke but will invoke f.call(This, ...args).
*                                          f can also be a string and resolves to This[f].
*     . Threadable.generator(v, ...args) - Takes any value and returns a Threadable generator.
*                                          Args will be injected to produce Threadable generators
*                                          for Functions and GeneratorFunctions.
*                                          Methods will need to pre-bound.
*                                          If v is a non function type then a generator that
*                                          returns v or [v, ...args] is returned.
*/

const ProtGenFn = Object.getPrototypeOf(function * () { });
const MarkGen = String((function * () { })());

module.exports = {
  Threadable,
};

// Threadable
// Arguments:
//    1. The function (normal or GeneratorFunction)
function Threadable(f) {
  var fThreadable;
  if (typeof f !== 'function')
    throw new Error(`micosmo:threadable:Threadble: Function is required.`);
  if (f.isaThreadable)
    return f;
  if (isaGeneratorFunction(f))
    fThreadable = makeAsyncFunction(f);
  else {
    fThreadable = f;
    f = makeGeneratorFunction(f);
  }
  fThreadable.isaThreadable = true;
  fThreadable.fGenerator = f;
  return fThreadable;
};

Threadable.call = function (This, f, ...args) {
  const ty = typeof f;
  if (ty === 'string') {
    const s = f;
    if (typeof (f = This[s]) !== 'function')
      throw new Error(`micosmo:threadable:Threadble:call: Property '${s}' is not a method.`);
  } else if (ty !== 'function')
    throw new Error(`micosmo:threadable:Threadble:call: Function or property name required.`);
  if (f.isaThreadable) {
    const gi = f.fGenerator.call(This, ...args);
    gi.isaThreadable = true;
    return gi;
  }
  return isaGeneratorFunction(f) ? f.call(This, ...args) : f.call(This, ...args);
}

Threadable.invoke = function(f, ...args) {
  if (typeof f !== 'function')
    throw new Error(`micosmo:threadable:Threadble:invoke: Function required.`);
  if (f.isaThreadable) {
    const gi = f.fGenerator(...args);
    gi.isaThreadable = true;
    return gi;
  }
  return isaGeneratorFunction(f) ? f(...args) : f(...args);
}

Threadable.generator = function(v, ...args) {
  var gi;
  if (isaGenerator(v))
    gi = v;
  else if (isaGeneratorFunction(v))
    gi = (v.isaThreadable ? v.fGenerator : v)(...args);
  else if (typeof v === 'function')
    gi = makeGeneratorFunction(v)(...args);
  else
    gi = (function * () { return args.length === 0 ? v : [v, ...args] })();

  gi.isaThreadable = true;
  return gi;
}

Threadable.sleep = function (s) { return new Promise(resolve => { setTimeout(() => resolve(s), s * 1000) }) }
Threadable.msSleep = function (ms) { return new Promise(resolve => { setTimeout(() => resolve(ms), ms) }) }

// Generator function support services

function makeGeneratorFunction(f) {
  return function * (...args) {
    return f.call(this, ...args);
  }
}

function makeAsyncFunction(fGen) {
  return async function (...args) {
    const gi = fGen.call(this, ...args);
    var resp = gi.next();
    while (!resp.done)
      resp = gi.next(await resp.value);
    return resp.value;
  }
}

function isaGenerator (fi) { return String(fi) === MarkGen }
function isaGeneratorFunction(f) { return Object.getPrototypeOf(f) === ProtGenFn }
