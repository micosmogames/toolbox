/*
*  scheduler.js
*
*  Schedules Threadlets based on priority, timeslice, yield interval and wait status.
*
*  Threadlets are allocate 1 of 3 priorities. High, Default & Low
*/
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

const runQueue = [];
const priorityQueues = [runQueue, [], [], []];
var nThreads = 0;
var running = undefined;
var schedCycle = High;

function threadletWaitingOnPromise(threadlet, Private) {
  if (!running || running.threadlet !== threadlet) {
    error(`micosmo:async:scheduler:threadletWaitingOnPromise: Threadlet is not running`);
    return;
  }
  Private.waitTimer = startTimer(Private.waitTimer); // Will create timer on first call
  removingRunningThreadlet();
}

function pauseThreadlet(threadlet, Private) {
  if (!running || running.threadlet !== threadlet) {
    error(`micosmo:async:scheduler:pauseThreadlet: Threadlet is not running`);
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
  //  if (schedCycle > High && schedCycle >= priority && priorityQueues[priority].length === 1)
  //    schedCycle = priority - 1; // Prevent this threadlet from being scheduled immediately if there are higher priority threadlets
  Private.queueId = threadlet.controls.priority;
  nThreads++;
}

function addToPriorityQueue(priority, thrdDetails) {
/*
  if (priority === High)
    priorityQueues[High].push(thrdDetails);
  else {
    let i = priority - 1;
    for (; i > 0; i--)
      priorityQueues[priority].push(undefined); // Insert a gap in the queue to slow down this threadlet
    priorityQueues[priority].push(thrdDetails);
  }
  */
  priorityQueues[priority].push(thrdDetails);
}

function dispatchThreadlet() {
  if (running || nThreads <= 0)
    return;
  // Clear the run queue first
  if (runQueue.length === 0)
    updatePriorityQueues();
  running = runQueue.shift();
  const Private = running.Private;
  Private.workTimer = startTimer(Private.workTimer); // Will create timer on first call
  Private.runWorker();
}

function updatePriorityQueues() {
  // The 'schedCycle' indicates how many piority levels are processed this run.
  // Firstly we must find a Threadlet to place in the runqueue.
  let i = High;
  for (; i <= Low; i++) {
    if (priorityQueues[i].length === 0)
      continue;
    runQueue.push(priorityQueues[i].shift());
    break;
  }
  // Now shuffle the remaining queues based on our current cycle
  for (; i <= schedCycle; i++) {
    if (priorityQueues[i].length === 0)
      continue;
    priorityQueues[i - 1].push(priorityQueues[i].shift());
  }
  // Update the scheduler cycle
  schedCycle = schedCycle % Low + 1;
}

function threadletYielding(threadlet, Private) {
  if (!running || running.threadlet !== threadlet) {
    error(`micosmo:async:scheduler:threadletYielding: Threadlet is not running`);
    if (!running)
      dispatchThreadlet();
    return;
  }
  const controls = threadlet.controls;
  var workTime = stopTimer(Private.workTimer);
  Private.workTime += workTime;
  workTime += stopTimer(Private.waitTimer); // Wait time contributes to the overall work time decisions.
  if (workTime < controls.timeslice) {
    if (runQueue.length === 0 && nThreads > 1) {
      // Promote another threadlet's priority
      for (let i = 1; i <= Low; i++) {
        if (priorityQueues[i].length === 0)
          continue;
        priorityQueues[i - 1].push(priorityQueues[i].shift());
        break;
      }
    }
    runQueue.push(running); running = undefined;
    return dispatchThreadlet();
  }
  if (workTime < controls.yieldInterval) {
    const o = running;
    nThreads--;
    new Promise(resolve => { setTimeout(() => resolve(), Math.ceil(controls.yieldInterval - workTime)) })
      .then(() => yieldFinished(o));
    running = undefined;
    return dispatchThreadlet();
  }
  addToPriorityQueue(threadlet.controls.priority, running); running = undefined;
  dispatchThreadlet();
}

function yieldFinished(o) {
  if (nThreads++ <= 0) {
    runQueue.push(o);
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
  if (running && running.threadlet === threadlet) {
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

function removingRunningThreadlet() {
  removingThreadlet(running); running = undefined;
  dispatchThreadlet();
}

function removingThreadlet(o) {
  const Private = o.Private;
  Private.queueId = undefined;
  Private.workTime += stopTimer(Private.workTimer);
  nThreads--;
}

function threadletMustYield(threadlet, Private) {
  return peekTimer(Private.workTimer) >= threadlet.controls.timeslice;
}

function error(msg) {
  console.error(msg);
  console.error(new Error().stack);
}
