/*
*  worker.js
*
*  Light-weight form of a Threadlet that is not managed by a scheduler. Allows any function to
*  be queued and dispatched in a synchronous manner. Default form returns a promise for each
*  function that is queued. Variants:
*     . Worker.group()   - Returns the same Promise for each function queued.
*                          Resolves to an array of return values.
*                          group.start() to kick-off Worker.
*     . Worker.process() - Returns the same Promise for each function queued.
*                          Each return value is a potential parameter of next step function.
*                          Last return value is resolved value of process.
*/

const core = require('@micosmo/core');
const fPrivate = core.newPrivateSpace();
const { LazyPromise } = require('./lazypromise');
const { Promises } = require('./lib/utils');

const StateReady = 0;
const StateRunning = 1;
const StateStopped = 2;
const StatePaused = 3;
const StatePending = 4;
const StateClosed = 5;
const StateFailed = 6;
const States = ['ready', 'running', 'stopped', 'paused', 'pending', 'closed', 'failed'];

const WorkerPrototype = _WorkerPrototype();
const StepArg = _StepArg();

module.exports = {
  Worker,
  StepArg,
  Promises
};

function Worker() {
  const worker = Object.create(WorkerPrototype);
  Object.defineProperty(worker, 'promises', { value: Promises(worker), enumerable: true })
  return fPrivate.setObject(worker, {
    worker,
    lastLazyPromise: LazyPromise.resolve(),
    state: StateReady,
    queue: [],
  });
};

function _WorkerPrototype() {
  return Object.create(Object, {
    isaWorker: { value: true, enumerable: true },
    run: { value(f, ...args) { return newTask(this, f, args).promise }, enumerable: true },
    bindRun: { value(This, f, ...args) { return this.run((typeof f === 'string' ? This[f] : f).bind(This), args) }, enumerable: true },
    stop: { value() { fPrivate(this).state = StateStopped; return this }, enumerable: true },
    pause: { value() { fPrivate(this).state = StatePaused; return this }, enumerable: true },
    resume: { value() { resume(this); return this }, enumerable: true },
    reject: { value(v) { return Promises.reject(v, this.name) }, enumerable: true },

    isReady: { get() { return fPrivate(this).state === StateReady }, enumerable: true },
    isRunning: { get() { return fPrivate(this).state === StateRunning }, enumerable: true },
    isPaused: { get() { return fPrivate(this).state === StatePaused }, enumerable: true },
    isPending: { get() { return fPrivate(this).state === StatePending }, enumerable: true },
    isStopped: { get() { return fPrivate(this).state === StateStopped }, enumerable: true },
    state: { get() { return States[fPrivate(this).state] }, enumerable: true }
  });
}

function resume(worker) {
  const Private = fPrivate(this);
  if (Private.state === StatePaused) {
    Private.state = StateReady;
    nextTask(Private);
  }
}

function newTask(worker, f, args) {
  const Private = fPrivate(worker);
  if (typeof f !== 'function')
    throw new Error('micosmo:async:worker:newTask: Missing function');
  if (Private.state === StateStopped)
    throw new Error('micosmo:async:worker:newTask: Worker has been stopped');
  const lazyPromise = LazyPromise();
  worker.promises.apply(lazyPromise); // Attach all the worker level handlers
  const lastLazyPromise = Private.lastLazyPromise;
  const fRunSync = () => run(Private, lazyPromise, f, args);
  Private.queue.push(() => { Private.lazyPromise = lazyPromise; lastLazyPromise.Then(fRunSync, fRunSync) });
  Private.lastLazyPromise = lazyPromise;
  nextTask(Private);
  return lazyPromise;
}

function nextTask(Private) {
  if (Private.state === StateReady && Private.queue.length > 0) {
    Private.state = StatePending;
    Private.queue[0]();
  }
}

function run(Private, lazyPromise, f, args) {
  Private.queue.shift(); // Pop me of the queue
  Private.state = StateRunning;
  new Promise(resolve => resolve(f(...args))).then(v => {
    lazyPromise.resolve(v);
    if (Private.state !== StatePaused) {
      Private.state = StateReady;
      nextTask(Private);
    }
  })
}

// Common prototype for Worker.group and Worker.process
// For the 'tasks' method each task specification is an array of parameters that would be normally passed to the 'run' method.
// A task that calls a method must be pre-bound.

const CommonPrototype = Object.create(Object, {
  run: { value(f, ...args) { return addTask(this, f, args) }, enumerable: true },
  bindRun: { value(This, f, ...args) { return this.run((typeof f === 'string' ? This[f] : f).bind(This), args) }, enumerable: true },
  tasks: {
    value(...tasks) {
      if (tasks.length === 1 && Array.isArray(tasks[0]) && Array.isArray(tasks[0][0]))
        tasks = tasks[0]; // Allow a single array of tasks to be supplied.
      tasks.forEach(taskSpec => {
        if (Array.isArray(taskSpec))
          this.run(...taskSpec);
        else
          this.run(taskSpec); // Just a function provided
      });
      return this
    },
    enumerable: true
  },
  start: {
    value() {
      const Private = fPrivate(this);
      if (Private.state !== StateReady)
        return this;
      const lazyPromise = Private.lazyPromise;
      this.promises.clear(lazyPromise); // Attach and clear all the Group level handlers
      Private.queue.forEach(task => this.runTask(Private, task));
      Private.queue = undefined;
      Private.state = StateRunning;
      return lazyPromise.promise;
    },
    enumerable: true
  },
  close: {
    value() {
      const Private = fPrivate(this);
      if (Private.state === StateClosed)
        return Private.lazyPromise;
      const lazyPromise = Private.lazyPromise;
      if (Private.state === StateReady)
        this.start();
      else
        this.promises.apply(lazyPromise); // Attach any additional Group level handlers
      Private.state = StateClosed;
      if (Private.state === StateFailed)
        lazyPromise.reject(Private.failedValue);
      return this.closingPromise(Private);
    },
    enumerable: true
  },
  reject: { value(v) { return Promises.reject(v, this.name) }, enumerable: true },
})

function addTask(workerType, f, args) {
  const Private = fPrivate(workerType);
  const task = workerType.makeTask(Private, f, args);
  Private.state === StateReady ? Private.queue.push(task) : workerType.runTask(Private, task);
  return workerType;
}

function syncFailed(workerType, v) {
  const Private = fPrivate(workerType);
  if (Private.state === StateRunning)
    Private.failedValue = v;
  else if (Private.state === StateClosed)
    Private.lazyPromise.reject(v);
  Private.state = StateFailed;
}

function setSyncPrivateSpace(workerType, additionalProperties) {
  const privateObject = {
    worker: Worker().promises.catch(v => syncFailed(workerType, v)).owner,
    state: StateReady,
    lazyPromise: LazyPromise(),
    queue: [],
  };
  Object.assign(privateObject, additionalProperties);
  return fPrivate.setObject(workerType, privateObject);
}

// Worker.group - Manage tasks in a group.

const groupPrototype = _groupPrototype();
Worker.Group = function () {
  const group = Object.create(groupPrototype);
  Object.defineProperty(group, 'promises', { value: Promises(group), enumerable: true })
  return setSyncPrivateSpace(group, {
    group,
    promises: [],
  });
}

function _groupPrototype() {
  return Object.create(CommonPrototype, {
    isaWorkerGroup: { value: true, enumerable: true },
    makeTask: { value(Private, f, args) { return makeGroupTask(Private, f, args) }, enumerable: true },
    runTask: { value(Private, task) { return runGroupTask(Private, task) }, enumerable: true },
    closingPromise: {
      value(Private) {
        return Private.lazyPromise.resolve(Private.promises.length === 0 ? undefined : Promise.all(Private.promises)).promise
      },
      enumerable: true
    },
  })
}

function runGroupTask(Private, task) {
  Private.promises.push(Private.worker.run(task.f, ...task.args));
}

function makeGroupTask(Private, f, args) {
  if (typeof f !== 'function')
    throw new Error('micosmo:async:worker.group:addGroupTask: Missing function');
  if (Private.state === StateClosed)
    throw new Error('micosmo:async:worker.group:addGroupTask: Group has been closed');
  return { f, args };
}

const processPrototype = _processPrototype();
Worker.Process = function () {
  const process = Object.create(processPrototype);
  Object.defineProperty(process, 'promises', { value: Promises(process), enumerable: true })
  return setSyncPrivateSpace(process, {
    process,
    lastTaskPromise: LazyPromise.resolve(),
    lastValue: undefined,
  });
}
function _processPrototype() {
  return Object.create(CommonPrototype, {
    isaWorkerProcess: { value: true, enumerable: true },
    steps: { value(...steps) { return this.tasks(...steps) }, enumerable: true },
    makeTask: { value(Private, f, args) { return makeProcessTask(Private, f, args) }, enumerable: true },
    runTask: { value(Private, task) { return runProcessTask(Private, task) }, enumerable: true },
    closingPromise: { value(Private) { return Private.lastTaskPromise.then(v => Private.lazyPromise.resolve(v)); }, enumerable: true },
  })
}

function makeProcessTask(Private, f, args) {
  let stepArg = StepArg.none;
  if (typeof f === 'function' && f.isaStepArg) {
    stepArg = f; f = args[0]; args = args.slice(1);
  }
  if (typeof f !== 'function')
    throw new Error('micosmo:async:worker.process:makeProcessTask: Missing function');
  return { stepArg, f, args };
}

function runProcessTask (Private, task) {
  (Private.lastTaskPromise = Private.worker.run(() => task.f(...task.stepArg(Private.lastValue, task.args))))
    .lazyPromise.Then(v => { Private.lastValue = v });
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
    args: { value: markStepArg((v, args) => { return Array.isArray(v) ? v : [v] }), enumerable: true },
    map: { value(mappings) { return markStepArg(mapStepArg(mappings)) }, enumerable: true },
    run: { value(f) { return markStepArg((v, args) => f(v, args)) }, enumerable: true },
  })
}

function mapStepArg(mappings) {
  if (!Array.isArray(mappings))
    throw new Error('micosmo:async:worker.process:mapStepArg: Mappings must be an array');
  // Mappings contain indicies that define where a value in the return array is placed in
  // args. If a mapping is a non number then the corresponding return value is not placed in the args
  return function (v, args) {
    if (!Array.isArray(v))
      v = [v];
    mappings.forEach((iLoc, idx) => {
      if (typeof iLoc !== 'number')
        return;
      args[iLoc < 0 ? args.length - iLoc : iLoc] = v[idx];
    });
  }
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
