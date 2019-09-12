/*
*  scheduler.js
*
*  Schedules Threadlets based on priority, timeslice, yield interval and wait status.
*
*  Threadlets are allocate 1 of 3 priorities. High, Default & Low
*/
const { startTimer, peekTimer } = require('@micosmo/core/object');

const Priority = Object.create(null, {
  High: { value: 1, enumerable: true },
  Default: { value: 2, enumerable: true },
  Low: { value: 3, enumerable: true },
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

const runQueue = [];
const priorityQueues = [runQueue, [], [], []];
var nThreads = 0;
var running = undefined;

function threadletWaitingOnPromise(threadlet, Private) {
  if (!running || running.threadlet !== threadlet) {
    error(`micosmo:async:scheduler:threadletWaitingOnPromise: Threadlet is not running`);
    return;
  }
  removingThreadlet(running);
  dispatchThreadlet();
}

function pauseThreadlet(threadlet, Private) {
  if (!running || running.threadlet !== threadlet) {
    error(`micosmo:async:scheduler:pauseThreadlet: Threadlet is not running`);
    return;
  }
  removingThreadlet(running);
  dispatchThreadlet();
}

function resumeThreadlet(threadlet, Private) {
  queueThreadlet(threadlet, Private);
  if (nThreads <= 1)
    dispatchThreadlet();
}

function queueThreadlet(threadlet, Private) {
  priorityQueues[threadlet.controls.priority].push({ threadlet, Private });
  Private.queueId = threadlet.controls.priority;
  Private.workTime = 0;
  nThreads++;
}

function dispatchThreadlet() {
  running = undefined;
  if (nThreads <= 0)
    return;
  // Clear the run queue first
  if (runQueue.length <= 0)
    updatePriorityQueues();
  running = runQueue.shift();
  const Private = running.Private;
  Private.workTimer = startTimer();
  Private.runWorker();
}

function updatePriorityQueues() {
  // Adjust threadlet priorities by promoting first threadlet in a queue
  // to a higher queue. This will ensure there is always something in
  // the run queue.
  for (let i = Priority.Low; i > 0; i--) {
    if (priorityQueues[i].length > 0)
      priorityQueues[i - 1].push(priorityQueues[i].shift());
  }
}

function threadletYielding(threadlet, Private) {
  if (!running || running.threadlet !== threadlet) {
    error(`micosmo:async:scheduler:threadletYielding: Threadlet is not running`);
    if (!running)
      dispatchThreadlet();
    return;
  }
  const controls = threadlet.controls;
  const workTime = peekTimer(Private.workTimer);
  Private.workTime += workTime;
  Private.workTimer = undefined;
  if (workTime < controls.timeslice) {
    if (runQueue.length === 0)
      updatePriorityQueues();
    runQueue.push(running);
    return dispatchThreadlet();
  }
  if (workTime < controls.yieldInterval) {
    const o = running;
    nThreads--;
    new Promise(resolve => { setTimeout(() => resolve(), Math.ceil(controls.yieldInterval - workTime)) })
      .then(() => yieldFinished(o));
    return dispatchThreadlet();
  }
  if (nThreads < 3)
    runQueue.push(running);
  else
    priorityQueues[threadlet.controls.priority].push(running);
  dispatchThreadlet();
}

function yieldFinished(o) {
  if (nThreads < 3)
    runQueue.push(o);
  else
    priorityQueues[o.threadlet.controls.priority].push(o);
  if (nThreads++ <= 0)
    dispatchThreadlet();
}

function threadletStarted(threadlet, Private) {
  queueThreadlet(threadlet, Private);
  if (nThreads <= 1)
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
  if (running && running.threadlet === threadlet) {
    removingThreadlet(running);
    running = undefined;
    dispatchThreadlet()
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
    const queue = priorityQueues[Private.queueId];
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

function removingThreadlet(o) {
  const Private = o.Private;
  Private.queueId = undefined;
  if (Private.workTime)
    Private.workTime += peekTimer(Private.workTimer);
  Private.workTimer = undefined;
  nThreads--;
}

function threadletMustYield(threadlet, Private) {
  return peekTimer(Private.workTimer) >= threadlet.controls.timeslice;
}

function error(msg) {
  console.error(msg);
  console.error(new Error().stack);
}
