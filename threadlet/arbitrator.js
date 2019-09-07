/*
*  arbitrator.js
*
*  Arbitrates the scheduling of Threadlets.
*
*  Threadlets are allocate 1 of 3 priorities. High, Normal & Low
*/

const Priority = Object.create(null, {
  High: { value: 1, enumerable: true },
  Normal: { value: 2, enumerable: true },
  Low: { value: 3, enumerable: true },
})

module.exports = {
  arbitratorExports
};

var runWorker;

var flExportsRequested = false;
function arbitratorExports(_runWorker) {
  if (flExportsRequested)
    return;
  runWorker = _runWorker;
  return {
    Priority,
    threadletStarted,
    threadletEnded,
    threadletYielding,
    threadletMustYield,
    pauseThreadlet,
    resumeThreadlet,
    threadletWaitingOnPromise
  }
}

const runQueue = [];
const priorityQueues = [runQueue, [], [], []];
var nThreads = 0;
var running = undefined;

function threadletWaitingOnPromise(threadlet, Private) {
  if (!running || running.threadlet !== threadlet) {
    error(`micosmo:threadlet:arbitrator:threadletWaitingOnPromise: Threadlet is not running`);
    return;
  }
  removingThreadlet(running);
  dispatchThreadlet();
}

function pauseThreadlet(threadlet, Private) {
  if (!running || running.threadlet !== threadlet) {
    error(`micosmo:threadlet:arbitrator:pauseThreadlet: Threadlet is not running`);
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
  Private.workTimer = 0;
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
  running.Private.workStartTime = Date.now();
  runWorker(running.Private);
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
    error(`micosmo:threadlet:arbitrator:threadletYielding: Threadlet is not running`);
    if (!running)
      dispatchThreadlet();
    return;
  }
  const controls = threadlet.controls;
  const workTimer = Date.now() - Private.workStartTime;
  Private.workTimer += workTimer;
  Private.workStartTime = undefined;
  if (workTimer < controls.timeslice) {
    if (runQueue.length === 0)
      updatePriorityQueues();
    runQueue.push(running);
    return dispatchThreadlet();
  }
  if (workTimer < controls.yieldInterval) {
    const o = running;
    nThreads--;
    new Promise(resolve => { setTimeout(() => resolve(), controls.yieldInterval - workTimer) })
      .then(() => yieldFinished(o));
    return dispatchThreadlet();
  }
  if (nThreads < 3)
    runQueue.push(running);
  else
    priorityQueues[threadlet.priority].push(running);
  dispatchThreadlet();
}

function yieldFinished(o) {
  if (nThreads < 3)
    runQueue.push(o);
  else
    priorityQueues[o.threadlet.priority].push(o);
  if (nThreads++ <= 0)
    dispatchThreadlet();
}

function threadletStarted(threadlet, Private) {
  queueThreadlet(threadlet, Private);
  if (nThreads <= 1)
    dispatchThreadlet();
}

function threadletEnded(threadlet, Private) {
  if (running.threadlet === threadlet) {
    removingThreadlet(running);
    running = undefined;
    return dispatchThreadlet();
  }
  removeQueuedThreadlet(threadlet, Private);
}

function removeQueuedThreadlet(threadlet, Private) {
  if (Private.queueId) {
    const queue = priorityQueues[Private.queueId];
    for (let i = 0; i < queue.length; i++) {
      const o = queue[i];
      if (o.threadlet !== threadlet)
        continue;
      queue.splice(i, 1);
      removingThreadlet(o);
      return;
    }
  }
  error(`micosmo:threadlet:arbitrator:removeQueuedThreadlet: Threadlet is not queued`);
}

function removingThreadlet(o) {
  const Private = o.Private;
  Private.queueId = undefined;
  if (Private.workStartTime)
    Private.workTimer += Date.now() - Private.workStartTime;
  Private.workStartTime = undefined;
  nThreads--;
}

function threadletMustYield(threadlet, Private) {
  return (Date.now() - Private.workStartTime) >= threadlet.controls.timeslice;
}

function error(msg) {
  console.error(msg);
  console.error(new Error().stack);
}
