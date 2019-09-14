/**
 * time.js
 *
 * Time related services and utilities
 */
const { isClient } = require('./object');

const createTimer = isClient() ? createClientTimer : createServerTimer;

module.exports = {
  peekTimer,
  startTimer,
  stopTimer
}

function startTimer(timer) { return (timer || createTimer()).start() }
function peekTimer(timer) { return (timer && timer.peek()) || 0 }
function stopTimer(timer) { return (timer && timer.stop()) || 0 }

function createClientTimer() {
  return Object.create(null, {
    timeMark: { value: undefined, writable: true },
    start: { value() { this.timeMark = Window.performance.now(); return this } },
    peek: { value() { return this.timeMark ? Window.performance.now() - this.timeMark : 0 } },
    stop: { value() { const dt = this.peek(); this.timeMark = undefined; return dt } }
  });
}

function createServerTimer() {
  return Object.create(null, {
    timeMark: { value: undefined, writable: true },
    start: { value() { this.timeMark = process.hrtime.bigint(); return this } },
    peek: { value() { return this.timeMark ? Number(process.hrtime.bigint() - this.timeMark) / 1000000 : 0 } },
    stop: { value() { const dt = this.peek(); this.timeMark = undefined; return dt } }
  });
}
