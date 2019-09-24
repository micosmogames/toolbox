/*
*  sempahore.js
*
*  Asynchronous synchronization primitives:
*   Sempahore - Synchronize two more asynchronous tasks.
*   CriticalSection - Serialise access to a critical code sequence that itself is made up of async components.
*
*  Can only be used in threadlets and async functions where the semaphore result can be yielded or waited on.
*
*  NOTE: A LazyPromise is only created if there is no pending signal when 'wait' is called.
*/
"use strict"

const { newPrivateSpace, method, declareMethods } = require('@micosmo/core');
const { LazyPromise } = require('./promise');
const fPrivate = newPrivateSpace();

declareMethods(runCS);

const SemaphorePrototype = _SemaphorePrototype();
const CriticalSectionPrototype = _CriticalSectionPrototype();

module.exports = {
  Semaphore,
  CriticalSection
};

// Semaphore implementation based on LazyPromises
function Semaphore(signals) {
  var signalValues = [];
  if (signals !== undefined) {
    if (typeof signals === 'number' && signals > 0)
      signalValues.length = signals;
    else if (Array.isArray(signals))
      signalValues = signals.slice(0);
    else
      throw new Error('micosmo:async:Semaphore: Initial signals must be a number > 0 or an array of signal values');
  }
  const sem = Object.create(SemaphorePrototype);
  return fPrivate.setObject(sem, {
    sem,
    signalValues,
    waiters: [],
  });
};

function _SemaphorePrototype() {
  return Object.create(Object, {
    isaSemaphore: { value: true, enumerable: true },
    signal: {
      value(v) {
        const Private = fPrivate(this);
        if (Private.waiters.length > 0) {
          const waiter = Private.waiters.shift();
          if (waiter.timer)
            clearTimeout(waiter.timer);
          waiter.lazyPromise.resolve(v);
        } else
          Private.signalValues.push(v);
        return this;
      },
      enumerable: true
    },
    wait: {
      value(ms, timeoutValue) {
        const Private = fPrivate(this);
        if (Private.signalValues.length > 0)
          return Promise.resolve(Private.signalValues.shift());
        const lp = LazyPromise();
        var timer;
        if (ms !== undefined && typeof ms === 'number' && ms > 0)
          timer = setTimeout(() => { removeWaiter(Private, lp); lp.resolve(timeoutValue) }, ms);
        Private.waiters.push({ lazyPromise: lp, timer });
        return lp.promise
      },
      enumerable: true
    }
  });
}

function removeWaiter(Private, lp) {
  const waiters = Private.waiters;
  for (let i = 0; i < waiters.length; i++) {
    if (waiters[i].lazyPromise !== lp)
      continue;
    waiters.splice(i, 1);
    return
  }
}

// CriticalSection implementation based around Semaphore LazyPromises
function CriticalSection() {
  const cs = Object.create(CriticalSectionPrototype);
  return fPrivate.setObject(cs, {
    cs,
    sem: Semaphore(1)
  });
};

function _CriticalSectionPrototype() {
  return Object.create(Object, {
    isaCriticalSection: { value: true, enumerable: true },
    start: { value() { return fPrivate(this).sem.wait() }, enumerable: true },
    end: { value() { fPrivate(this).sem.signal() }, enumerable: true },
    run: { value: method(runCS), enumerable: true },
    bindRun: { value(This, f, ...args) { return this.run((typeof f === 'string' ? This[f] : f).bind(This), args) }, enumerable: true },
  });
}

method(runCS)
async function runCS(f, ...args) {
  const Private = fPrivate(this);
  await Private.sem.wait();
  return Private.sem.signal(f(...args));
}
