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

const arb = require('./arbitrator').arbitratorExports(runWorker);
const core = require('@micosmo/core');
const { declareMethod } = core;
const fPrivate = core.newPrivateSpace();
const { Threadable } = require('./threadable');
const { LazyPromise } = require('./lazypromise');

const ThreadletPrototype = _ThreadletPrototype();
const DefaultPriority = arb.Priority.Normal;
const DefaultTimeslice = 2;
const DefaultYieldInterval = 6;

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
  const controls = args[1];
  var [priority, timeslice, yieldInterval] = [Number.parseInt(controls.priority), Number.parseInt(controls.timeslice), Number.parseInt(controls.yieldInterval)];
  const threadlet = Object.create(ThreadletPrototype, {
    id: { value: ++idThreadlet, enumerable: true },
    name: { value: args[0] || `Threadlet:${idThreadlet}`, enumerable: true },
    controls: {
      value: Object.create(null, {
        priority: { value: Math.min(Math.max(Math.abs(priority || DefaultPriority), arb.Priority.High), arb.Priority.Low), enumerable: true },
        timeslice: { value: !isNaN(timeslice) ? Math.max(timeslice, 0) : DefaultTimeslice, enumerable: true },
        yieldInterval: { value: Math.abs(yieldInterval || DefaultYieldInterval), enumerable: true },
      }),
      enumerable: true
    },
    endState: { value: 'ready', writable: true, enumerable: true },
    endValue: { value: undefined, writable: true, enumerable: true }
  });
  console.log(threadlet.controls);
  return fPrivate.setObject(threadlet, {
    threadlet,
    lazyPromise: undefined,
    nextParm: undefined,
    state: 'ready',
    stack: [],
    queue: [],
    workStartTime: undefined,
    workTimer: 0,
  });
};

Threadlet.exec = (f, ...args) => Threadlet().exec(f, ...args);
Threadlet.call = (f, ...args) => Threadlet().call(f, ...args);
Threadlet.Priority = arb.Priority;

function validateArgs(args) {
  var [arg0, arg1] = args;
  if (args.length === 0)
    arg1 = {};
  else if (args.length === 1) {
    arg1 = {};
    if (typeof arg0 === 'object') {
      arg1 = arg0; arg0 = undefined;
    }
  }
  if (arg0 && typeof arg0 !== 'string')
    throw new Error(`micosmo:Threadlet: Name must be a string.`);
  if (typeof arg1 !== 'object')
    throw new Error(`micosmo:Threadlet: Thread controls must be an object.`);
  return [arg0, arg1];
}

function _ThreadletPrototype() {
  return Object.create(Object, {
    isaThreadlet: { get() { return true }, enumerable: true },
    exec: {
      value(f, ...args) {
        const Private = fPrivate(this);
        const lazyPromise = LazyPromise();
        const fRun = () => { Private.lazyPromise = lazyPromise; runThreadlet(this, Private, f, args) };
        Private.state !== 'ready' ? Private.queue.push(fRun) : fRun();
        return lazyPromise.catch(this.reject.bind(this));
      },
      enumerable: true
    },
    call: {
      value(f, ...args) {
        const Private = fPrivate(this);
        const lazyPromise = LazyPromise();
        const fRun = () => { Private.lazyPromise = lazyPromise; runThreadlet(this, Private, f, args) };
        Private.state !== 'ready' ? Private.queue.push(fRun) : fRun();
        return (lazyPromise.promise);
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
        Private.state = 'pausing';
        return this;
      },
      enumerable: true
    },
    resume: {
      value() {
        const Private = fPrivate(this);
        if (Private.state !== 'paused')
          return this;
        Private.state = 'running';
        arb.resumeThreadlet(this, Private);
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
    state: { get() { return fPrivate(this).state }, enumerable: true },
    endState: { get() { return this.endState }, enumerable: true }
  });
}

function runThreadlet(threadlet, Private, f, args) {
  Private.step = Threadable.generator(f, ...args);
  Private.state = threadlet.endState = 'running';
  arb.threadletStarted(threadlet, Private);
  return threadlet;
}

function runWorker(Private) {
  new Promise(worker.bind(Private)).then(yieldThreadlet.bind(Private), threadletFailed.bind(Private));
}

// Note: The worker is bound to the private space of the Threadlet.
var worker = declareMethod(function (resolve, reject) {
  const threadlet = this.threadlet;
  if (this.state !== 'running') {
    // Let the yielder deal with this.
    resolve(this.nextParm);
    return;
  }
  // Manage the generator stack for this threadlet instance.
  var value = this.nextParm;
  for (;;) {
    var resp;
    try {
      resp = this.step.next(value);
    } catch (vCatch) {
      reject(vCatch);
      return;
    }
    value = resp.value;
    if (resp.done) {
    // From return statement
      if (isaThreadable(value)) {
        this.step = getThreadableGenerator(value);
        value = undefined;
      } else if (this.stack.length > 0) {
        this.step = this.stack.pop();
      } else {
        this.state = 'ending';
        resolve(value);
        return;
      }
    } else if (isaThreadable(value)) {
    // From yield statement
    // Push current generator and replace with response function
      this.stack.push(this.step);
      this.step = getThreadableGenerator(value);
      value = undefined;
    }
    if (!arb.threadletMustYield(threadlet, this))
      continue;
    resolve(value);
    return;
  }
});

// Note: The yielder is bound to the private space of the Threadlet.
var yieldThreadlet = declareMethod(function (value) {
  const threadlet = this.threadlet;
  const state = this.state;
  const isStopping = state === 'stopping';
  const isFinishing = isStopping || state === 'ending';
  const havePromise = typeof value === 'object' && (value instanceof Promise || value.isaLazyPromise);
  if (havePromise && !isFinishing) {
    value.then(v => yieldThreadlet.call(this, v), v => threadletFailed.call(this, v));
    this.state = 'waiting';
    arb.threadletWaitingOnPromise(threadlet, this);
    return;
  }
  this.nextParm = value;
  if (state === 'running') {
    arb.threadletYielding(threadlet, this);
    return;
  }
  if (state === 'pausing') {
    this.state = 'paused'
    arb.pauseThreadlet(threadlet, this);
    return;
  }
  if (state === 'waiting') {
    this.state = 'running';
    arb.resumeThreadlet(threadlet, this);
    return;
  }
  threadlet.endState = isStopping ? 'stopped' : 'ended';
  threadlet.endValue = isStopping ? undefined : value;
  this.state = 'ready';
  this.stack = [];
  havePromise ? value.then(v => this.lazyPromise.resolve(v)) : this.lazyPromise.resolve(value);
  arb.threadletEnded(threadlet, this);
  if (this.queue.length > 0)
    this.queue.shift()(); // Run the request that is queued up
});

// Note: The rejector is bound to the private space of the Threadlet.
var threadletFailed = declareMethod(function (value) {
  const threadlet = this.threadlet;
  this.state = 'ready';
  this.stack = [];
  threadlet.endState = 'failed';
  threadlet.endValue = value;
  this.lazyPromise.reject(value);
  arb.threadletEnded(threadlet, this);
  if (this.queue.length > 0)
    this.queue.shift()(); // Run the request that is queued up
});

// Threadable support services

function getThreadableGenerator(f, args) {
  // If we have a GeneratorFunction (fGenerator) then we instaniate the generator,
  // otherwise we already have a generator and can ignore the arguments.
  return f.fGenerator ? (args ? f.fGenerator(...args) : f.fGenerator()) : f;
}

function isaThreadable(f) {
  const ty = typeof f;
  return (ty === 'function' || ty === 'object') && f.isaThreadable;
}
