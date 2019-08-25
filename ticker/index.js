/*
*  ticker.js
*  Provide services to describe and manage ticker based processes.
*  The basic ticker process element is based on a generator function.
*/

const ProtGenFn = Object.getPrototypeOf(function * () { });
const DefaultTicker = Ticker('DefaultTicker');

module.exports = {
  startProcess,
  createProcess,
  Ticker,
  DefaultTicker,
  looper,
  iterator,
  timer,
  sTimer,
  msTimer,
  waiter,
  sWaiter,
  msWaiter,
};

// Ticker handler
function Ticker(name) {
  if (typeof name !== 'string')
    throw new Error(`Ticker: Name is required`)
  return Object.setPrototypeOf({
    isaTicker: true,
    isStarted: true,
    name,
    processes: [],
    _tick: undefined,
    tick: fNoop,
  }, TickerPrototype);
};

const TickerPrototype = {
  assignAsDefaultTo,
  start,
  stop,
  pause,
  isRunning,
  isPaused,
}

function start() {
  if (this.isStarted)
    return false;
  this.tick = this.processes.length > 0 ? this._tick : fNoop;
  return (this.isStarted = true);
}

function stop() {
  const rc = this.pause();
  if (this.processes.length > 0)
    this.processes = [];
  return rc;
}

function pause() {
  if (!this.isStarted)
    return false;
  this.tick = fNoop;
  this.isStarted = false;
  return true;
}

function isRunning() {
  return this.isStarted;
}

function isPaused() {
  return !this.isStarted;
}

function attachTicker(ticker, process) {
  if (ticker.tick === fNoop && (ticker.tick = ticker._tick) === undefined)
    ticker.tick = ticker._tick = tickTicker.bind(ticker);
  ticker.processes.push(process);
}

function detachTicker(ticker, process) {
  const processes = ticker.processes;
  const iProcess = processes.findIndex(proc => proc === process);
  if (iProcess < 0)
    throw new Error(`Ticker: Process '${process.name}' is not attached to ticker '${ticker.name}'`)
  processes[iProcess] = undefined; // Let tick cycle remove the entry
}

function tickTicker(tm, dt) {
  const processes = this.processes;
  var nProcesses = processes.length; // Don't want to process anything that is attached in this tick cycle
  for (let i = 0; i < nProcesses;) {
    const process = processes[i];
    if (!process || (!process._isPaused && process.tick(tm, dt) === 'stopped')) {
      processes.splice(i, 1);
      nProcesses--;
      if (processes.length <= 0)
        this.tick = fNoop;
    } else
      i++;
  }
};

function assignAsDefaultTo(...processes) {
  if (processes.length === 1 && Array.isArray(processes[0]))
    processes = processes[0];
  processes.forEach(process => {
    if (typeof process !== 'object' || !process.isaProcess)
      throw new Error(`ticker:assignAsDefaultTo: Invalid process parameter`);
    if (process.isStarted) {
      console.warn(`ticker:assignAsDefaultTo: Process '${process.name}' started. Cannot assign ticker`);
      return this;
    }
    process.ticker = this;
  })
  return this;
}

function fNoop () { }

// Function startProcess / createProcess
// Accepts 1 or 2 arguments as follows:
//    1. onTick function or configuration object
//    2. onTick function, ticker | el | selector (cascading)
//
//  Configuration object: {
//    name: Name of the process. String
//    onTick: function or generator function (tm, dt [, rem])
//    onEnd: Function dispatched at end of process. Always dispatched. Parms(flTimeout)
//    msTimeout: Timeout interval in milliseconds.
//    sTimeout: Timeout interval in seconds
//    ticker: ticker
//  }
function startProcess(...args) {
  return new _Process(validateArgs('startProcess', ...args)).start();
}

function createProcess(...args) {
  return new _Process(validateArgs('createProcess', ...args));
};

function validateArgs(fn, ...args) {
  const cfg = {};
  const msg = `ticker:${fn}: Invalid parameter`;
  var flCfgPassed = false;
  switch (args.length) {
  case 0:
    throw new Error(`ticker:${fn}: onTick or configuration parameter required`);
  case 1:
    mapArg(cfg, args, 0, msg,
      [['function', 'onTick'], ['object', o => { flCfgPassed = true; Object.assign(cfg, o) }]]);
    break;
  case 2:
    mapArg(cfg, args, 0, msg, [['function', 'onTick']]);
    mapArg(cfg, args, 1, msg, [['object', 'ticker']]);
    break;
  default:
    throw new Error(`ticker:${fn}: Too many parameters`);
  }
  return validateConfig(fn, cfg, flCfgPassed);
}

function validateConfig(fn, cfg, flCfgPassed) {
  //    name: Name of the process. String
  if (!cfg.name)
    cfg.name = '<anonymous>'
  else if (typeof cfg.name !== 'string')
    throw new Error(`ticker:${fn}: Invalid 'name' (${cfg.name})`);
  //    onTick: function or generator function
  if (!cfg.onTick)
    throw new Error(`ticker:${fn}: 'onTick' function required`);
  else if (typeof cfg.onTick !== 'function')
    throw new Error(`ticker:${fn}: Invalid 'onTick' (${typeof cfg.onTick})`);
  //    ticker: ticker
  if (!cfg.ticker)
    cfg.ticker = DefaultTicker;
  else if (!cfg.ticker.isaTicker)
    throw new Error(`ticker:${fn}: 'ticker' is not a Ticker`);
  if (flCfgPassed) {
    //    onEnd: Function dispatched at end of process. Always dispatched. Parms(process, flTimeout)
    if (cfg.onEnd) {
      if (typeof cfg.onEnd !== 'function')
        throw new Error(`ticker:${fn}: Invalid 'onEnd' (${typeof cfg.onEnd})`);
      this.onEnd = cfg.onEnd;
    }
    //    msTimeout: Timeout interval in milliseconds.
    //    sTimeout: Timeout interval in seconds
    if (cfg.sTimeout && cfg.msTimeout)
      throw new Error(`ticker:${fn}: Either 'sTimeout' or 'msTimeout'`);
    if (!cfg.msTimeout) {
      if (cfg.sTimeout) {
        if (typeof cfg.sTimeout !== 'number' || cfg.sTimeout <= 0)
          throw new Error(`ticker:${fn}: Invalid 'sTimeout' (${typeof cfg.sTimeout})`);
        cfg.msTimeout = cfg.sTimeout * 1000;
        delete cfg.sTimeout;
      }
    } else if (typeof cfg.msTimeout !== 'number' || cfg.msTimeout <= 0)
      throw new Error(`ticker:${fn}: Invalid 'msTimeout' (${typeof cfg.msTimeout})`);
  }
  return cfg
}

function mapArg(cfg, args, iArg, msg, argMap) {
  const arg = args[iArg];
  const ty = typeof arg;
  for (let i = 0; i < argMap.length; i++) {
    const e = argMap[i];
    if ((e[0] === 'array' && Array.isArray(arg)) || ty === e[0]) {
      if (typeof e[1] === 'function')
        e[1](arg);
      else
        cfg[e[1]] = arg;
      return i;
    }
  }
  throw new Error(`${iArg + 1}. ${msg}`);
}

function _Process(cfg) {
  Object.assign(this, cfg);
  this.defaultTicker = this.ticker;
  this.onTick = getGeneratorFunction(this.onTick);
  this.isaProcess = true;
  this.gTickStack = [];
  this.state = {
    name: this.name,
    tm: 0,
    dt: 0,
    data: 0
  }
  return this;
};

_Process.prototype = {
  start(ticker) {
    if (this.isStarted)
      throw new Error(`ticker:process:start: Process '${this.name}' already started`);
    if (ticker) {
      if (typeof ticker !== 'object' || !ticker.isaTicker)
        throw new Error(`ticker:process:start: Invalid ticker parameter`);
      this.ticker = ticker;
    } else
      this.ticker = this.defaultTicker;
    this.isStarted = true;
    this.tick = tickProcess;
    if (this.msTimeout)
      this.tick = getTimeoutFn(tickProcess.bind(this), this.msTimeout);
    this.gTick = this.onTick(this.state); // Create an instance of our generator.
    attachTicker(this.ticker, this);
    return this;
  },
  stop() {
    if (!this.isStarted)
      return this;
    detachTicker(this.ticker, this);
    _stop(this, 'stop');
    return this;
  },
  isAttached() {
    return this.isStarted;
  },
  isPaused() {
    return this._isPaused;
  },
  pause() {
    this._isPaused = true;
    return this;
  },
  resume() {
    this._isPaused = false;
    return this;
  },
};

function tickProcess(tm, dt) {
  // Manage the generators for this process.
  // Note that we preserve the state.data across calls.
  // Provides support for iterator like generators
  const state = this.state;
  state.tm = tm;
  state.dt = dt;
  do {
    const resp = this.gTick.next();
    const value = resp.value;
    if (resp.done) {
      // From return statement
      if (!value || value === 'done') {
        if (this.gTickStack.length > 0) {
          this.gTick = this.gTickStack.pop();
          return;
        }
        return _stop(this, 'done');
      }
      if (typeof value === 'function') {
      // Chain to this generator
        this.gTick = getGeneratorFunction(value)(state);
        return;
      }
      return _stop(this, value === 'stop' ? 'stop' : 'done');
    }
    // From yield statement
    if (!value)
      return;
    if (typeof value === 'function') {
      // Push current generator and replace with response function
      // and call in the same tick cycle
      this.gTickStack.push(this.gTick);
      this.gTick = getGeneratorFunction(value)(state);
      continue;
    }
    return value === 'stop' ? _stop(this, 'stop') : undefined;
  } while (true);
}

function _stop(process, rsn) {
  // May have already explicitly stopped the process
  if (!process.isStarted)
    return 'stopped';
  process.isStarted = false;
  process.tick = undefined;
  process.gTick = undefined;
  process.gTickStack = [];
  process.ticker = undefined;
  if (process.onEnd)
    process.onEnd(rsn, process);
  return 'stopped';
}

function getTimeoutFn(onTick, msTimeout) {
  return function(tm, dt) {
    const rc = onTick(tm, dt);
    if (rc === 'stopped')
      return 'stopped';
    if ((msTimeout -= dt) <= 0)
      return _stop(process, 'timeout');
  };
}

// Generator function support services

function getGeneratorFunction(f) {
  return isaGeneratorFunction(f) ? f : makeGeneratorFunction(f);
}

function makeGeneratorFunction(f) {
  return function * (state) {
    do {
      const resp = f(state.tm, state.dt, state.data);
      if (!resp || resp === 'done')
        return;
      else if (resp === 'more')
        yield;
      else
        return resp; // 'stop' or chained function
    } while (true);
  }
}

function isaGeneratorFunction(f) {
  return Object.getPrototypeOf(f) === ProtGenFn;
}

// Inbuilt generators

function looper(count, f) {
  if (typeof count !== 'number' || typeof f !== 'function')
    throw new Error(`ticker:looper: Invalid parameter`);
  return function * (state) {
    for (let i = 0; i < count; i++) {
      state.data = i;
      yield f;
    }
  }
}

function iterator(...af) {
  if (af.length === 1 && Array.isArray(af[0]))
    af = af[0];
  return function * (state) {
    for (const f of af) {
      yield f;
    }
  }
}

function waiter(s, f) {
  if (s >= 50)
    throw new Error(`ticker:waiter: Time unit maybe milliseconds. Use sWaiter otherwise`);
  return msWaiter(s * 1000, f);
}

function sWaiter(s, f) {
  return msWaiter(s * 1000);
}

function msWaiter(ms, f) {
  if (typeof ms !== 'number')
    throw new Error(`ticker:msWaiter: Invalid parameter`);
  return function * (state) {
    for (let t = ms; t > 0; t -= state.dt)
      yield;
    return f;
  }
}

function timer(s, f) {
  if (s >= 50)
    throw new Error(`ticker:timer: Time unit maybe milliseconds. Use sTimer otherwise`);
  return msTimer(s * 1000, f);
}

function sTimer(s, f) {
  return msTimer(s * 1000, f);
}

function msTimer(ms, f) {
  if (typeof ms !== 'number' || typeof f !== 'function')
    throw new Error(`ticker:msTimer: Invalid parameter`);
  return isaGeneratorFunction(f) ? msGenTimer(ms, f) : msFuncTimer(ms, f);
}

function msGenTimer(ms, f) {
  return function * (state) {
    const fi = f(state);
    for (let t = ms; t > 0; t -= state.dt) {
      state.data = t;
      const resp = fi.next();
      if (resp.done)
        return resp.value;
      yield resp.value;
    }
  }
}

function msFuncTimer(ms, f) {
  return function * (state) {
    for (let t = ms; t > 0; t -= state.dt) {
      state.data = t;
      const resp = f(state.tm, state.dt, t);
      if (resp === 'more')
        yield
      else
        return resp; // undefined, 'done, 'stop' or chained function
    }
  }
}
