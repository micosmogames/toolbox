/*
*  threadable.js
*
*  Functions that can be managed by a Threadlet. Threadables can be called either directly or
*  managed by a Threadlet when yielded or returned from a Threadable. However Threadables can only
*  be called directly if the threadable does not yield a Promise. This requires the support
*  of a Threadlet and an error will be thrown if this is detected. Threadables can return
*  Promises at any time.
*
*  A Threadlet will only manage Threadables and will ignore any non Threadable functions and
*  generators. Threadlet has 3 methods for setting up Threadable generators with parameters.
*     * Threadable.invoke(f, ...args) - Returns a Threadable generator if f is Threadable, otherwise
*                                       just returns the result from f(..args).
*     * Threadable.call(This, f, ..args) - As for invoke but will invoke f.call(This, ...args).
*                                          f can also be a string and resolves to This[f].
*     * Threadable.generator(v, ...args) - Takes any value and returns a Threadable generator.
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
    fThreadable = makeThreadletSimulator(f);
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
  else {
    const values = [v, ...args]
    gi = (function * () { return values.length === 1 ? values[0] : values })();
  }
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

function makeThreadletSimulator(fGen) {
  return function(...args) {
    const gi = fGen.call(this, ...args);
    var resp = gi.next();
    while (!resp.done) {
      const v = resp.value;
      if (typeof v === 'object' && (v instanceof Promise || v.isaLazyPromise))
        throw new Error(`micosmo:threadable:Threadble: Threadable has yielded a Promise from a direct call. Requires a Threadlet`);
      resp = gi.next(v);
    }
    return resp.value;
  }
}

function isaGenerator (fi) { return String(fi) === MarkGen }
function isaGeneratorFunction(f) { return Object.getPrototypeOf(f) === ProtGenFn }
