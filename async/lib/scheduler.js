/*
*  scheduler.js
*
*  Schedules Threadlets based on priority, timeslice, yield interval and wait status.
*
*  Threadlets are allocate 1 of 3 priorities. High, Default & Low
*/
"use strict"

const { startTimer, peekTimer, stopTimer } = require('@micosmo/core/time');

const High = 1;
const Default = 2;
const Low = 3;

const Priority = Object.create(null, {
  High: { value: High, enumerable: true },
  Default: { value: Default, enumerable: true },
  Low: { value: Low, enumerable: true },
})

module.exports = {
  Priority,
  threadletStarted,
  threadletEnded,
  threadletFailed,
  threadletYielding,
  threadletMustYield,
  pauseThreadlet,
  resumeThreadlet,
  threadletWaitingOnPromise
};

const RunQueue = [];
const PriorityQueues = [RunQueue, [], [], []];
var ThreadCount = 0;
var Running = undefined;
var SchedCycle = High;

function threadletWaitingOnPromise(threadlet, Private) {
  if (!Running || Running.threadlet !== threadlet) {
    error(`micosmo:async:scheduler:threadletWaitingOnPromise: Threadlet is not Running`);
    return;
  }
  Private.waitTimer = startTimer(Private.waitTimer); // Will create timer on first call
  removingRunningThreadlet();
}

function pauseThreadlet(threadlet, Private) {
  if (!Running || Running.threadlet !== threadlet) {
    error(`micosmo:async:scheduler:pauseThreadlet: Threadlet is not Running`);
    return;
  }
  removingRunningThreadlet();
}

function resumeThreadlet(threadlet, Private) {
  queueThreadlet(threadlet, Private);
  dispatchThreadlet();
}

function queueThreadlet(threadlet, Private) {
  const priority = threadlet.controls.priority;
  addToPriorityQueue(priority, { threadlet, Private });
  Private.queueId = threadlet.controls.priority;
  ThreadCount++;
}

function addToPriorityQueue(priority, thrdDetails) {
  PriorityQueues[priority].push(thrdDetails);
}

function dispatchThreadlet() {
  if (Running || ThreadCount <= 0)
    return;
  // Clear the run queue first
  if (RunQueue.length === 0)
    updatePriorityQueues();
  Running = RunQueue.shift();
  const Private = Running.Private;
  Private.workTimer = startTimer(Private.workTimer); // Will create timer on first call
  Promise.resolve('running') // Make the driver start in the next Javascript thread cycle
    .then(Private.driver)
    .then(Private.yieldThreadlet, Private.threadletFailed);
}

function updatePriorityQueues() {
  // The 'SchedCycle' indicates how many piority levels are processed this run.
  // Firstly we must find a Threadlet to place in the runqueue.
  let i = High;
  for (; i <= Low; i++) {
    if (PriorityQueues[i].length === 0)
      continue;
    RunQueue.push(PriorityQueues[i].shift());
    break;
  }
  // Now shuffle the remaining queues based on our current cycle
  for (i++; i <= SchedCycle; i++) {
    if (PriorityQueues[i].length === 0)
      continue;
    PriorityQueues[i - 1].push(PriorityQueues[i].shift());
  }
  // Update the scheduler cycle
  SchedCycle = SchedCycle % Low + 1;
}

function threadletYielding(threadlet, Private) {
  if (!Running || Running.threadlet !== threadlet) {
    error(`micosmo:async:scheduler:threadletYielding: Threadlet is not Running`);
    if (!Running)
      dispatchThreadlet();
    return;
  }
  const controls = threadlet.controls;
  var workTime = stopTimer(Private.workTimer);
  Private.workTime += workTime;
  workTime += stopTimer(Private.waitTimer); // Wait time contributes to the overall work time decisions.
  if (workTime < controls.timeslice) {
    if (RunQueue.length === 0 && ThreadCount > 1) {
      // Promote another threadlet's priority
      for (let i = 1; i <= Low; i++) {
        if (PriorityQueues[i].length === 0)
          continue;
        PriorityQueues[i - 1].push(PriorityQueues[i].shift());
        break;
      }
    }
    RunQueue.push(Running); Running = undefined;
    return dispatchThreadlet();
  }
  if (workTime < controls.yieldInterval) {
    const o = Running;
    ThreadCount--;
    new Promise(resolve => { setTimeout(() => resolve(), Math.ceil(controls.yieldInterval - workTime)) })
      .then(() => yieldFinished(o));
    Running = undefined;
    return dispatchThreadlet();
  }
  addToPriorityQueue(threadlet.controls.priority, Running); Running = undefined;
  dispatchThreadlet();
}

function yieldFinished(o) {
  if (ThreadCount++ <= 0) {
    RunQueue.push(o);
    dispatchThreadlet();
  } else
    addToPriorityQueue(o.threadlet.controls.priority, o);
}

function threadletStarted(threadlet, Private) {
  queueThreadlet(threadlet, Private);
  Private.workTime = 0;
  dispatchThreadlet();
}

function threadletEnded(threadlet, Private) {
  if (!tryEndingRunningThreadlet(threadlet, Private))
    removeQueuedThreadlet(threadlet, Private);
}

function threadletFailed(threadlet, Private) {
  if (!tryEndingRunningThreadlet(threadlet, Private))
    tryRemoveQueuedThreadlet(threadlet, Private);
}

function tryEndingRunningThreadlet(threadlet, Private) {
  if (Running && Running.threadlet === threadlet) {
    removingRunningThreadlet();
    return true;
  }
  return false;
}

function removeQueuedThreadlet(threadlet, Private) {
  if (!tryRemoveQueuedThreadlet(threadlet, Private))
    error(`micosmo:async:scheduler:removeQueuedThreadlet: Threadlet is not queued`);
}

function tryRemoveQueuedThreadlet(threadlet, Private) {
  if (Private.queueId) {
    const queue = PriorityQueues[Private.queueId];
    for (let i = 0; i < queue.length; i++) {
      const o = queue[i];
      if (o.threadlet !== threadlet)
        continue;
      queue.splice(i, 1);
      removingThreadlet(o);
      return true;
    }
  }
  return false;
}

function removingRunningThreadlet() {
  removingThreadlet(Running); Running = undefined;
  dispatchThreadlet();
}

function removingThreadlet(o) {
  const Private = o.Private;
  Private.queueId = undefined;
  Private.workTime += stopTimer(Private.workTimer);
  ThreadCount--;
}

function threadletMustYield(threadlet, Private) {
  return peekTimer(Private.workTimer) >= threadlet.controls.timeslice;
}

function error(msg) {
  console.error(msg);
  console.error(new Error().stack);
}
