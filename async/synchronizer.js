/*
*  synchronizer.js
*
*  Light-weight form of a Threadlet that is not managed by a scheduler. Allows any function to
*  be queued and dispatched in a synchronous manner. Default form returns a promise for each
*  function that is queued. Variants:
*     . Synchronizer.group(onReject) - Returns the same Promise for each function queued.
*                                      onReject is optional. Resolves to an array of return
*                                      values. group.start() to kick-off synchronizer.
*     . Synchronizer.steps(onReject) - Returns the same Promise for each function queued.
*                                      onReject is optional. Each return value is the
*                                      parameter of next step function. Last return value
*                                      is resolved value of steps.
*/

const core = require('@micosmo/core');
const fPrivate = core.newPrivateSpace();
const { LazyPromise } = require('./lazypromise');
const { handleRejection, catchFor, thenFor, finallyFor } = require('./utils');

const StateReady = 0;
const StateRunning = 1;
const StateStopped = 2;
const StatePaused = 3;
const StatePending = 4;
const States = ['ready', 'running', 'stopped', 'paused', 'pending'];

const SynchronizerPrototype = _SynchronizerPrototype();
const StepArg = _StepArg();

module.exports = {
  Synchronizer,
  Synchroniser: Synchronizer,
  StepArg
};

// Threadlet
// Arguments:
//    1. Name of Threadlet or timeslice
//    2. Name followed by timeslice
function Synchronizer(onReject = handleRejection) {
  if (onReject && typeof onReject !== 'function')
    throw new Error('micosmo:async:Synchronizer: Function required for onReject');
  const synchronizer = Object.create(SynchronizerPrototype);
  return fPrivate.setObject(synchronizer, {
    synchronizer,
    onReject: onReject,
    lastLazyPromise: LazyPromise.resolve(),
    state: StateReady,
    queue: [],
    handlers: [],
  });
};

function _SynchronizerPrototype() {
  return Object.create(Object, {
    isaSynchronizer: { value: true, enumerable: true },
    isaSynchroniser: { value: true, enumerable: true },
    exec: { value(f, ...args) { return newStep(this, f, args).Catch(fPrivate(this).onReject) }, enumerable: true },
    boundExec: { value(This, f, ...args) { return this.exec((typeof f === 'string' ? This[f] : f).bind(This), args) }, enumerable: true },
    invoke: { value(f, ...args) { return newStep(this, f, args).promise }, enumerable: true },
    boundInvoke: { value(This, f, ...args) { return this.invoke((typeof f === 'string' ? This[f] : f).bind(This), args) }, enumerable: true },
    stop: { value() { fPrivate(this).state = StateStopped; return this }, enumerable: true },
    pause: { value() { fPrivate(this).state = StatePaused; return this }, enumerable: true },
    resume: { value() { resume(this); return this }, enumerable: true },
    reject: { value(v) { return handleRejection(v) }, enumerable: true },
    Then: { value: thenFor('Synchronizer', fPrivate), enumerable: true },
    Catch: { value: catchFor('Synchronizer', fPrivate), enumerable: true },
    Finally: { value: finallyFor('Synchronizer', fPrivate), enumerable: true },

    isReady: { get() { return fPrivate(this).state === StateReady }, enumerable: true },
    isRunning: { get() { return fPrivate(this).state === StateRunning }, enumerable: true },
    isPaused: { get() { return fPrivate(this).state === StatePaused }, enumerable: true },
    isPending: { get() { return fPrivate(this).state === StatePending }, enumerable: true },
    state: { get() { return States[fPrivate(this).state] }, enumerable: true },

  });
}

function resume(synchronizer) {
  const Private = fPrivate(this);
  if (Private.state === StatePaused) {
    Private.state = StateReady;
    nextStep(Private);
  }
}

function newStep(synchronizer, f, args) {
  const Private = fPrivate(synchronizer);
  if (typeof f !== 'function')
    throw new Error('micosmo:async:Synchronizer:newStep: Missing function');
  if (Private.state === StateStopped)
    throw new Error('micosmo:async:Synchronizer:newStep: Synchronizer has been stopped');
  const lazyPromise = LazyPromise();
  Private.handlers.forEach(hand => hand(lazyPromise)); // Attach all the Synchronizer level handlers
  const lastLazyPromise = Private.lastLazyPromise;
  const fRunSync = () => run(Private, lazyPromise, f, args);
  Private.queue.push(() => { Private.lazyPromise = lazyPromise; lastLazyPromise.Then(fRunSync, fRunSync) });
  Private.lastLazyPromise = lazyPromise;
  nextStep(Private);
  return lazyPromise;
}

function nextStep(Private) {
  if (Private.state === StateReady && Private.queue.length > 0) {
    Private.state = StatePending;
    Private.queue[0]();
  }
}

function run(Private, lazyPromise, f, args) {
  Private.queue.shift(); // Pop me of the queue
  Private.state = StateRunning;
  new Promise(resolve => resolve(f(...args))).then(v => { lazyPromise.resolve(v); Private.state = StateReady; nextStep(Private) })
}

const groupPrototype = _groupPrototype();
Synchronizer.group = function () {
  const group = Object.create(groupPrototype);
  return fPrivate.setObject(group, {
    group,
    queue: [],
    handlers: [],
  });
}
function _groupPrototype() {
  return Object.create(Object, {
    isaSyncGroup: { value: true, enumerable: true },
    add: { value(f, ...args) { return addGroupStep(this, f, args) }, enumerable: true },
    boundAdd: { value(This, f, ...args) { return this.invoke((typeof f === 'string' ? This[f] : f).bind(This), args) }, enumerable: true },
    invoke: {
      value() {
        const Private = fPrivate(this);
        if (Private.queue.length === 0)
          return Promise.resolve(undefined);
        const lazyPromise = LazyPromise();
        Private.handlers.forEach(hand => hand(lazyPromise)); // Attach all the Group level handlers
        const synchronizer = Synchronizer();
        const promises = [];
        Private.queue.forEach(step => promises.push(synchronizer.invoke(step.f, ...step.args)));
        return lazyPromise.resolve(Promise.all(promises));
      },
      enumerable: true
    },
    exec: { value(onReject = handleRejection) { return this.invoke().catch(onReject) }, enumerable: true },
    Then: { value: thenFor('Synchronizer.group', fPrivate), enumerable: true },
    Catch: { value: catchFor('Synchronizer.group', fPrivate), enumerable: true },
    Finally: { value: finallyFor('Synchronizer.group', fPrivate), enumerable: true },
  })
}

function addGroupStep(group, f, args) {
  if (typeof f !== 'function')
    throw new Error('micosmo:async:Synchronizer.group:addGroupStep: Missing function');
  const Private = fPrivate(group);
  Private.queue.push({ f, args });
  return Private.group;
}

const stepsPrototype = _stepsPrototype();
Synchronizer.steps = function () {
  const steps = Object.create(stepsPrototype);
  return fPrivate.setObject(steps, {
    steps,
    queue: [],
    handlers: [],
    lastValue: undefined
  });
}
function _stepsPrototype() {
  return Object.create(Object, {
    isaSyncSteps: { value: true, enumerable: true },
    add: { value(f, ...args) { return addStepsStep(this, f, args) }, enumerable: true },
    boundAdd: { value(This, f, ...args) { return this.invoke((typeof f === 'string' ? This[f] : f).bind(This), args) }, enumerable: true },
    invoke: {
      value() {
        const Private = fPrivate(this);
        if (Private.queue.length === 0)
          return Promise.resolve(undefined);
        const lazyPromise = LazyPromise();
        Private.handlers.forEach(hand => hand(lazyPromise)); // Attach all the Steps level handlers
        const synchronizer = Synchronizer().Catch(v => lazyPromise.reject(v));
        var lastStepPromise = LazyPromise.resolve().promise;
        Private.queue.forEach(step => {
          lastStepPromise = lastStepPromise.lazyPromise
            .Then(v => synchronizer.invoke(step.f, ...step.stepArg(v, step.args)))
        });
        lastStepPromise.then(v => lazyPromise.resolve(v));
        return lazyPromise.promise;
      },
      enumerable: true
    },
    exec: { value(onReject = handleRejection) { return this.invoke().catch(onReject) }, enumerable: true },
    Then: { value: thenFor('Synchronizer.group', fPrivate), enumerable: true },
    Catch: { value: catchFor('Synchronizer.group', fPrivate), enumerable: true },
    Finally: { value: finallyFor('Synchronizer.group', fPrivate), enumerable: true },
  })
}

function addStepsStep(group, f, args) {
  const Private = fPrivate(group);
  let stepArg = StepArg.none;
  if (typeof f === 'function' && f.isaStepArg) {
    stepArg = f; f = args[0]; args = args.slice(1);
  }
  if (typeof f !== 'function')
    throw new Error('micosmo:async:Synchronizer.steps:addStepsStep: Missing function');
  Private.queue.push({ stepArg, f, args });
  return Private.steps;
}

function _StepArg() {
  return Object.create(null, {
    none: { value: markStepArg((v, args) => { return args }), enumerable: true },
    prepend: { value: markStepArg((v, args) => { return [v, ...args] }), enumerable: true },
    append: { value: markStepArg((v, args) => { return [...args, v] }), enumerable: true },
    any: { value: markStepArg((v, args) => { return replaceFirstArgValue(v, undefined, args) }), enumerable: true },
    anyNull: { value: markStepArg((v, args) => { return replaceFirstArgValue(v, null, args) }), enumerable: true },
    arg: { value(i) { return markStepArg((v, args) => { args[i < 0 ? args.length - i : i] = v; return args }) }, enumerable: true },
    all: { value: markStepArg((v, args) => { return replaceAllArgValue(v, undefined, args) }), enumerable: true },
    allNull: { value: markStepArg((v, args) => { return replaceAllArgValue(v, null, args) }), enumerable: true },
    args: { value: markStepArg((v, args) => { return Array.isArray(v) ? v : [v] }), enumerable: true }
  })
}

function markStepArg(f) {
  Object.defineProperty(f, 'isaStepArg', { value: true });
  return f;
}

function replaceFirstArgValue(v, filter, args) {
  const i = args.indexOf(filter);
  if (i < 0)
    return StepArg.append(v, args);
  args[i] = v;
  return args;
}

function replaceAllArgValue(a, filter, args) {
  if (!Array.isArray(a))
    return replaceFirstArgValue(a, filter, args);
  var i = -1;
  for (let j = 0; j < a.length; j++) {
    const v = a[j];
    i = args.indexOf(filter, i + 1);
    if (i >= 0) {
      args[i] = v;
      continue;
    }
    return [...args, ...a.slice(j)];
  }
  return args;
}
