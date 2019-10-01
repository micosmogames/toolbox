/*
*  threadlet.js
*
*  Implements a pseudo threading architecture for Javascript based on promises & generator functions.
*
*  The Threadlet driver manages a stack of generators (instances not functions). Yield statements
*  allow the Threadlet to yield control to schedule other threadlets, promises and async functions to
*  be executed. Threadlets can be assigned a priority, timeslice that defines how long the
*  Threadlet can run without giving up control of the processor and a yield interval that
*  specifies the minimum time between each yield. Threadlets will go into a wait state if the
*  running time for an interval is less than the yield interval.
*  Timeslice and yield intervals are expressed in milliseconds. The default timeslice of 0
*  forces a threadlet to give up control at each yield point. The default yield interval of
*  2 milliseconds will force a threadlet to wait for a maximum of 2 ms before being rescheduled.
*  For timeslice the value can also be a fraction of a millisecond but it will depend on the host
*  whether the timing granularity will support such values.
*
*  Threadlets have 3 priority levels. High, Default and Low. High priority threadlets will be scheduled
*  around twice as often as Default priority Threadlets and Default are scheduled around twice as often
*  as Low priority Threadlets.
*
*  If a generator yields another generator, then the current generator is suspended and stacked
*  and the new generator takes control, akin to a function call. If a generator returns a
*  generator then this acts as chain or exec like operation with the new generator replacing
*  the old.
*
*  Generators can also yield and return promises. In this case the threadlet enters a wait state
*  on the promise pending the settlement of the promise.
*
*  Threadlets can be invoked or exec'ed with normal functions which will be wrapped in a generator. In
*  this case there is no yield capability.
*
*  The yield* statement can also be employed but you have to pass a generator.
*
*  Threadlet behaviour is similar to an async function except that a Threadlet is a container that
*  has a queue and dispatch cycle, has a prioritised scheduler across threadlets as well
*  threadlet level processing controls. Threadlets will also inject a default reject handler for
*  exec calls. Threadlet 'contract' whenSealed, whenResolved, whenRejected methods define promise handlers
*  that are applied to every Threadlet task that is queued.
*/
"use strict"

const sched = require('./lib/scheduler');
const { declareMethods, method, newPrivateSpace } = require('@micosmo/core');
const fPrivate = newPrivateSpace();
const { Threadable } = require('./threadable');
const { Promises, Contract } = require('./promise');
const { isaThreadable, isPromisable } = require('./lib/utils');

declareMethods(driver, yieldThreadlet, threadletFailed);

const ThreadletPrototype = _ThreadletPrototype();
const DefaultPriority = sched.Priority.Default;
const DefaultTimeslice = 0;
const DefaultYieldInterval = 0;

const StateReady = 0;
const StateRunning = 1;
const StatePausing = 2;
const StatePaused = 3;
const StateEnding = 4;
const StateEnded = 5;
const StateFailed = 6;
const StateWaiting = 7;
const StateStopped = 8;
const States = ['ready', 'running', 'pausing', 'paused', 'ending', 'ended', 'failed', 'waiting', 'stopped'];

var idThreadlet = 0;

module.exports = {
  Threadlet
};

// Threadlet
// Arguments:
//    1. Name of Threadlet or controls object
//    2. Name followed by controls object
function Threadlet(...args) {
  args = validateArgs(args);
  const controls = args[1];
  var [priority, timeslice, yieldInterval] =
    [Number.parseInt(controls.priority), Number.parseFloat(controls.timeslice), Number.parseInt(controls.yieldInterval)];
  const threadlet = Object.create(ThreadletPrototype, {
    id: { value: ++idThreadlet, enumerable: true },
    name: { value: args[0] || `Threadlet:${idThreadlet}`, enumerable: true },
    controls: {
      value: Object.create(null, {
        priority: { value: Math.min(Math.max(Math.abs(priority || DefaultPriority), sched.Priority.High), sched.Priority.Low), enumerable: true },
        timeslice: { value: !isNaN(timeslice) ? Math.max(timeslice, 0) : DefaultTimeslice, enumerable: true },
        yieldInterval: { value: !isNaN(yieldInterval) ? Math.max(yieldInterval, 0) : DefaultYieldInterval, enumerable: true },
      }),
      enumerable: true
    },
    endValue: { value: undefined, writable: true, enumerable: true }
  });
  const Private = {
    threadlet,
    lazyPromise: undefined,
    nextParm: undefined,
    endState: StateReady,
    state: StateReady,
    waitState: StateReady,
    stack: [],
    queue: [],
    workStartTime: undefined,
    workTimer: 0,
  };
  Private.driver = driver.bind(Private);
  Private.yieldThreadlet = yieldThreadlet.bind(Private);
  Private.threadletFailed = threadletFailed.bind(Private);
  Object.defineProperty(threadlet, 'contract', { value: Contract(threadlet, () => nextTask(Private)), enumerable: true });
  return fPrivate.setObject(threadlet, Private);
};

var LowPriorityThreadlet, DefaultPriorityThreadlet, HighPriorityThreadlet;

Object.defineProperties(Threadlet, {
  Priority: { value: sched.Priority, enumerable: true },
  LowPriority: {
    get() {
      return (LowPriorityThreadlet || (LowPriorityThreadlet = Threadlet({ priority: sched.Priority.Low }))).publicInterface();
    },
    enumerable: true
  },
  DefaultPriority: {
    get() {
      return (DefaultPriorityThreadlet || (DefaultPriorityThreadlet = Threadlet({ priority: sched.Priority.Default }))).publicInterface();
    },
    enumerable: true
  },
  HighPriority: {
    get() {
      return (HighPriorityThreadlet || (HighPriorityThreadlet = Threadlet({ priority: sched.Priority.High }))).publicInterface();
    },
    enumerable: true
  }
});

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
    throw new Error(`micosmo:async:Threadlet: Name must be a string.`);
  if (typeof arg1 !== 'object')
    throw new Error(`micosmo:async:Threadlet: Thread controls must be an object.`);
  else if (arg1.onReject && typeof arg1.onReject !== 'function')
    throw new Error(`micosmo:async:Threadlet: onReject must be a function.`);
  return [arg0, arg1];
}

function _ThreadletPrototype() {
  const prot = Object.create(Object, {
    isaThreadlet: { value: true, enumerable: true },
    run: { value(f, ...args) { return newTask(this, f, args).promise }, enumerable: true },
    bindRun: { value(This, f, ...args) { return this.run((typeof f === 'string' ? This[f] : f).bind(This), ...args) }, enumerable: true },
    stop: {
      value() {
        const Private = fPrivate(this);
        if (Private.isStopping || Private.isStopped)
          return this;
        Private.isStopping = true;
        // Prevent any new tasks being added and stop the thread once the queue is exhausted.
        Private.threadlet.run(() => { Private.isStopping = false; Private.isStopped = true; Private.state = StateStopped });
        Private.threadlet.run = () => { throw new Error(`micosmo:async:Threadlet:run: Threadlet '${Private.threadlet.name}' has stopped.`) };
        return this;
      },
      enumerable: true
    },
    pause: {
      value() {
        const Private = fPrivate(this);
        const state = Private.state;
        if (state === StatePausing || state === StatePaused)
          return this;
        Private.lastState = state;
        Private.state = state === StateReady ? StatePaused : StatePausing;
        return this;
      },
      enumerable: true
    },
    resume: {
      value() {
        const Private = fPrivate(this);
        if (Private.state !== StatePaused)
          return this;
        Private.state = Private.lastState;
        if (Private.state !== StateReady)
          sched.resumeThreadlet(this, Private);
        return this;
      },
      enumerable: true
    },
    publicInterface() {
      const Private = fPrivate(this);
      return Private.publicInterface || (Private.publicInterface = Object.freeze({
        isaThreadlet: true,
        isPublicInterface: true,
        run: this.run.bind(this),
        bindRun: this.bindRun.bind(this)
      }))
    },
    reject: { value(v) { return Promises.reject(v, this.name) }, enumerable: true },

    isReady: { get() { return fPrivate(this).state === StateReady }, enumerable: true },
    isRunning: { get() { return fPrivate(this).state === StateRunning }, enumerable: true },
    isPausing: { get() { return fPrivate(this).state === StatePausing }, enumerable: true },
    isPaused: { get() { const p = fPrivate(this); return p.state === StatePaused || p.state === StatePausing }, enumerable: true },
    isEnding: { get() { return fPrivate(this).state === StateEnding }, enumerable: true },
    isStopping: { get() { return fPrivate(this).isStopping }, enumerable: true },
    isStopped: { get() { const p = fPrivate(this); return p.isStopping || p.isStopped }, enumerable: true },
    isWaiting: { get() { return fPrivate(this).state === StateWaiting }, enumerable: true },
    hasPaused: { get() { return fPrivate(this).state === StatePaused }, enumerable: true },
    hasStopped: { get() { return fPrivate(this).isStopped }, enumerable: true },
    hasEnded: { get() { return fPrivate(this).endState === StateEnded }, enumerable: true },
    hasFinished: { get() { const p = fPrivate(this); return p.endState === StateEnded || p.endState === StateEnding }, enumerable: true },
    hasFailed: { get() { return fPrivate(this).endState === StateFailed }, enumerable: true },
    state: { get() { return States[fPrivate(this).state] }, enumerable: true },
    endState: { get() { return States[fPrivate(this).endState] }, enumerable: true }
  });
  return prot;
}

function newTask(threadlet, f, args) {
  const Private = fPrivate(threadlet);
  const lazyPromise = threadlet.contract.seal(); // Will return a LazyPromise
  Private.queue.push(() => { Private.lazyPromise = lazyPromise; runThreadlet(threadlet, Private, f, args) });
  nextTask(Private);
  return lazyPromise;
}

function nextTask(Private) {
  if (Private.state === StateReady && Private.queue.length > 0)
    Private.queue.shift()();
}

function runThreadlet(threadlet, Private, f, args) {
  Private.step = Threadable.with(f, ...args);
  Private.state = Private.endState = StateRunning;
  sched.threadletStarted(threadlet, Private);
  return threadlet;
}

// Scheduler will invoke the driver wrapped up in a Promise
// Note: The driver is bound to the private space of the Threadlet.
method(driver);
function driver() {
  const threadlet = this.threadlet;
  if (this.state === StateWaiting) {
    // Have been rescheduled after wait state so restore state
    this.state = this.waitState; this.waitState = undefined;
  }
  if (this.state !== StateRunning)
    return this.nextParm; // Let the yield deal with this
  // Manage the generator stack for this threadlet instance.
  var value = this.nextParm;
  for (;;) {
    var resp = this.step.next(value);
    value = resp.value;
    if (resp.done) {
    // From return statement
      if (isaThreadable(value)) {
        resp.done = false;
        this.step = getThreadableGenerator(value);
        value = undefined;
      } else if (this.stack.length > 0) {
        resp.done = false;
        this.step = this.stack.pop();
      } else
        this.state = StateEnding;
    } else if (isaThreadable(value)) {
    // From yield statement
    // Push current generator and replace with response function
      this.stack.push(this.step);
      this.step = getThreadableGenerator(value);
      value = undefined;
    }
    if (isPromisable(value)) {
      // Threadlet won't yield until the Promise has been resolved
      this.waitState = this.state; this.state = StateWaiting;
      sched.threadletWaitingOnPromise(threadlet, this);
    } else if (!sched.threadletMustYield(threadlet, this) && !resp.done && this.state !== StatePausing)
      continue;
    return value;
  }
};

// Note: The yielder is bound to the private space of the Threadlet.
method(yieldThreadlet);
function yieldThreadlet(value) {
  const threadlet = this.threadlet;
  this.nextParm = value;
  switch (this.state) {
  case StateRunning:
    sched.threadletYielding(threadlet, this);
    return;
  case StatePausing:
    this.state = StatePaused
    sched.pauseThreadlet(threadlet, this);
    return;
  case StateWaiting:
    // Promise wait has ended so need to be rescheduled to continue.
    sched.resumeThreadlet(threadlet, this);
    return;
  default:
    this.endState = StateEnded;
    threadlet.endValue = value;
    break;
  }
  this.state = StateReady;
  this.stack = [];
  this.lazyPromise.resolve(value);
  sched.threadletEnded(threadlet, this);
};

// Note: The rejector is bound to the private space of the Threadlet.
method(threadletFailed);
function threadletFailed(value) {
  const threadlet = this.threadlet;
  this.state = StateReady;
  this.stack = [];
  this.endState = StateFailed;
  threadlet.endValue = value;
  this.lazyPromise.reject(value);
  sched.threadletFailed(threadlet, this);
};

// Threadable support services

function getThreadableGenerator(f, args) {
  // If we have a GeneratorFunction (fGenerator) then we instaniate the generator,
  // otherwise we already have a generator and can ignore the arguments.
  return f.fGenerator ? (args ? f.fGenerator(...args) : f.fGenerator()) : f;
}
