/*
*  threadlet.js
*  Non-blocking pseudo thread model for Javascript based on generator functions.
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
    retPromise: undefined,
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
        if (typeof f !== 'function')
          throw new Error(`micosmo:Threadlet: Require a function to exec.`);
        const Private = fPrivate(this);
        return Private.state === 'ready' ? runInstance(Private, f, args) : undefined;
      },
      enumerable: true
    },
    call: {
      value(f, ...args) {
        if (typeof f !== 'function')
          throw new Error(`micosmo:Threadlet: Require a function to call.`);
        const Private = fPrivate(this);
        if (Private.state !== 'ready')
          return undefined;
        runInstance(Private, f, args);
        return (Private.retPromise = LazyPromise());
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

function runInstance(Private, f, args) {
  Private.step = getGeneratorFunction(f)(...args);
  Private.state = Private.threadlet.endState = 'running';
  runWorker(Private);
  return Private.threadlet;
}

function runWorker(Private) {
  new Promise(worker.bind(Private)).then(yieldThreadlet.bind(Private), threadletFailed.bind(Private));
}

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
      if (isaGenerator(value)) {
        this.step = value;
        value = undefined;
      } else if (this.stack.length > 0) {
        this.step = this.stack.pop();
        if (dt < timeslice)
          continue;
      } else
        this.state = 'ending';
    } else if (isaGenerator(value)) {
    // From yield statement
    // Push current generator and replace with response function
      this.stack.push(this.step);
      this.step = value;
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

var yieldThreadlet = declareMethod(function (value) {
  const threadlet = this.threadlet;
  if (typeof value === 'object' && (value instanceof Promise || value.isaLazyPromise)) {
    waitOnPromise.call(this, value);
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
  if (this.retPromise)
    this.retPromise.resolve(value);
});

var waitOnPromise = declareMethod(function (promise) {
  promise.then(v => yieldThreadlet.call(this, v), v => threadletFailed.call(this, v));
});

var threadletFailed = declareMethod(function (value) {
  const threadlet = this.threadlet;
  this.state = 'ready';
  this.stack = [];
  threadlet.endState = 'failed';
  threadlet.endValue = value;
  if (this.retPromise)
    this.retPromise.reject(value);
});

// Generator function support services

function getGeneratorFunction(f) {
  return isaGeneratorFunction(f) ? f : makeGeneratorFunction(f);
}

function makeGeneratorFunction(f) {
  return function * (scope) {
    return f(scope);
  }
}

function isaGenerator (fi) { return String(fi) === MarkGen }
function isaGeneratorFunction(f) { return Object.getPrototypeOf(f) === ProtGenFn }
