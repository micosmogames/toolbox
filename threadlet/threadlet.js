/*
*  threadlet.js
*  Non-blocking pseudo thread model for Javascript based on promises & generator functions.
*
*  The Threadlet worker manages a stack of generators (instances not functions). Yield statements
*  allows the Threadlet to yield control allow other scheduled threadlets, promises and async functions to
*  be executed. Threadlets can be assigned a timeslice in milliseconds that defines how long the
*  Threadlet can cycle without giving up control of the processor. This provides a rudimentary
*  mechanism for prioritizing one threadlet over another.
*
*  If a generator yields another generator, then the current generator is suspended and stacked
*  and the new generator takes control, akin to a function call. If a generator returns a
*  generator then this acts as chain or exec like operation with the new generator replacing
*  the old.
*
*  Generators can also yield and return promises. In this case the threadlet enters a wait state
*  on the promise pending the settlement of the promise.
*
*  Threadlets can be called or exec'ed with normal functions which will be wrapped in a generator. In
*  this case there is no yield capability.
*
*  The yield* statement can also be employed but you have to pass a generator.
*/

const core = require('@micosmo/core');
const { declareMethod } = core;
const fPrivate = core.newPrivateSpace();
const { LazyPromise } = require('./lazypromise');

const ProtGenFn = Object.getPrototypeOf(function * () { });
const MarkGen = String((function * () { })());
const ThreadletPrototype = _ThreadletPrototype();
const DefaultTimeslice = 2;

var idThreadlet = 0;

module.exports = {
  Threadlet,
};

// Threadlet
// Arguments:
//    1. Name of Threadlet or timeslice
//    2. Name followed by timeslice
function Threadlet(...args) {
  args = validateArgs(args);
  const threadlet = Object.create(ThreadletPrototype, {
    id: { value: ++idThreadlet, enumerable: true },
    name: { value: args[0] || `Threadlet:${idThreadlet}`, enumerable: true },
    timeslice: { value: args[1] !== undefined ? args[1] : DefaultTimeslice, enumerable: true },
    endState: { value: 'ready', writable: true, enumerable: true },
    endValue: { value: undefined, writable: true, enumerable: true }
  });
  return fPrivate.setObject(threadlet, {
    threadlet,
    lazyPromise: undefined,
    nextParm: undefined,
    state: 'ready',
    stack: [],
    sot: Date.now() // Start of this timeslice
  });
};

Threadlet.exec = (f, ...args) => Threadlet().exec(f, ...args);
Threadlet.call = (f, ...args) => Threadlet().call(f, ...args);

function validateArgs(args) {
  var [arg0, arg1] = args;
  if (args.length === 1 && typeof arg0 === 'number') {
    arg1 = arg0;
    arg0 = undefined;
  }
  if (arg0 && typeof arg0 !== 'string')
    throw new Error(`micosmo:Threadlet: Name must be a string.`);
  if (arg1 && typeof arg1 !== 'number')
    throw new Error(`micosmo:Threadlet: Timeslice must be a number.`);
  return [arg0, arg1];
}

function _ThreadletPrototype() {
  return Object.create(Object, {
    isaThreadlet: { get() { return true }, enumerable: true },
    exec: {
      value(f, ...args) {
        const Private = fPrivate(this);
        if (Private.state !== 'ready')
          return;
        Private.lazyPromise = LazyPromise();
        runThreadlet(Private, f, args);
        return Private.lazyPromise.catch(this.reject.bind(this));
      },
      enumerable: true
    },
    call: {
      value(f, ...args) {
        const Private = fPrivate(this);
        if (Private.state !== 'ready')
          return;
        runThreadlet(Private, f, args);
        return (Private.lazyPromise = LazyPromise()).promise;
      },
      enumerable: true
    },
    stop: {
      value() {
        const Private = fPrivate(this);
        const state = Private.state;
        if (state === 'ready' || state === 'ending' || state === 'stopping')
          return this;
        if (state === 'paused')
          this.resume();
        Private.state = 'stopping';
        return this;
      },
      enumerable: true
    },
    pause: {
      value() {
        const Private = fPrivate(this);
        const state = Private.state;
        if (state !== 'running')
          return this;
        Private.state = 'paused';
        return this;
      },
      enumerable: true
    },
    resume: {
      value() {
        const Private = fPrivate(this);
        if (Private.state !== 'paused')
          return this;
        runWorker(Private);
        return this;
      },
      enumerable: true
    },
    reject: {
      value(v) {
        if (v instanceof Error) {
          console.warn(`micosmo:threadlet:reject: ${this.name} Error(${v.message}). Returning 'undefined'`);
          console.warn(v.stack);
          v = undefined;
        } else if (v instanceof Promise)
          console.warn(`micosmo:threadlet:reject: ${this.name} Rejected value is a Promise(${v}). Returning the Promise`);
        else {
          console.warn(`micosmo:threadlet:reject: ${this.name} Rejected(${v}). Returning 'undefined'`);
          v = undefined;
        }
        return Promise.resolve(v);
      },
      enumerable: true
    },
    isReady: { get() { return fPrivate(this).state === 'ready' }, enumerable: true },
    isRunning: { get() { return fPrivate(this).state === 'running' }, enumerable: true },
    isPaused: { get() { return fPrivate(this).state === 'paused' }, enumerable: true },
    isEnding: { get() { return fPrivate(this).state === 'ending' }, enumerable: true },
    isStopping: { get() { return fPrivate(this).state === 'stopping' }, enumerable: true },
    hasStopped: { get() { return this.endState === 'stopped' }, enumerable: true },
    hasEnded: { get() { return this.endState === 'ended' }, enumerable: true },
    hasFinished: { get() { return this.endState === 'ended' || this.endState === 'stopped' }, enumerable: true },
    hasFailed: { get() { return this.endState === 'failed' }, enumerable: true },
    state: { get() { return fPrivate(this).state }, enumerable: true }
  });
}

function runThreadlet(Private, f, args) {
  Private.step = makeThreadableInstance(f, args);
  Private.state = Private.threadlet.endState = 'running';
  runWorker(Private);
  return Private.threadlet;
}

function runWorker(Private) {
  new Promise(worker.bind(Private)).then(yieldThreadlet.bind(Private), threadletFailed.bind(Private));
}

// Note: The worker is bound to the private space of the Threadlet.
var worker = declareMethod(function (resolve, reject) {
  if (this.state !== 'running') {
    // Let the yielder deal with this.
    resolve(this.nextParm);
    return;
  }
  // Manage the generator stack for this threadlet instance.
  const timeslice = this.threadlet.timeslice;
  var value = this.nextParm;
  for (;;) {
    const tm = Date.now();
    var resp;
    try {
      resp = this.step.next(value);
    } catch (vCatch) {
      this.sot = tm;
      reject(vCatch);
      return;
    }
    const dt = tm - this.sot;
    value = resp.value;
    if (resp.done) {
    // From return statement
      if (isaThreadable(value)) {
        this.step = getThreadableInstance(value);
        value = undefined;
      } else if (this.stack.length > 0) {
        this.step = this.stack.pop();
        if (dt < timeslice)
          continue;
      } else
        this.state = 'ending';
    } else if (isaThreadable(value)) {
    // From yield statement
    // Push current generator and replace with response function
      this.stack.push(this.step);
      this.step = getThreadableInstance(value);
      value = undefined;
      if (dt < timeslice)
        continue;
    } else if (dt < timeslice)
      continue; // Nothing to do and have timeslice to burn

    this.sot = tm;
    resolve(value);
    return;
  }
})

// Note: The yielder is bound to the private space of the Threadlet.
var yieldThreadlet = declareMethod(function (value) {
  const threadlet = this.threadlet;
  if (typeof value === 'object' && (value instanceof Promise || value.isaLazyPromise)) {
    value.then(v => yieldThreadlet.call(this, v), v => threadletFailed.call(this, v));
    return;
  }
  const state = this.state;
  if (state === 'running') {
    this.nextParm = value;
    runWorker(this);
    return;
  }
  if (state === 'paused') {
    this.nextParm = value;
    return; // Resume will start the threadlet worker.
  }
  const isStopping = state === 'stopping';
  threadlet.endState = isStopping ? 'stopped' : 'ended';
  threadlet.endValue = isStopping ? undefined : value;
  this.state = 'ready';
  this.stack = [];
  this.lazyPromise.resolve(value);
});

// Note: The rejector is bound to the private space of the Threadlet.
var threadletFailed = declareMethod(function (value) {
  const threadlet = this.threadlet;
  this.state = 'ready';
  this.stack = [];
  threadlet.endState = 'failed';
  threadlet.endValue = value;
  this.lazyPromise.reject(value);
});

// Threadable support services

function makeThreadableInstance(f, args) {
  if (isaThreadable(f))
    return getThreadableInstance(f, args);
  if (isaGeneratorFunction(f))
    return f(...args);
  if (typeof f === 'function')
    return makeGeneratorFunction(f)(...args);
  if (isaGenerator(f))
    return f
  throw new Error(`micosmo:threadlet:makeThreadableInstance: Require a function or generator.`);
}

function getThreadableInstance(f, args) {
  // If we have a GeneratorFunction (fGenerator) then we instaniate the generator,
  // otherwise we already have a generator and can ignore the arguments.
  return f.fGenerator ? (args ? f.fGenerator(...args) : f.fGenerator()) : f;
}

function isaThreadable(f) {
  const ty = typeof f;
  return (ty === 'function' || ty === 'object') && f.isaThreadable;
}

// Generator function support services

function makeGeneratorFunction(f) {
  return function * (...args) {
    return f(...args);
  }
}

function isaGenerator (fi) { return String(fi) === MarkGen }
function isaGeneratorFunction(f) { return Object.getPrototypeOf(f) === ProtGenFn }
