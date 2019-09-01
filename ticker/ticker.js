/*
*  ticker.js
*  Provide services to describe and manage ticker based processes.
*  The basic ticker process element is based on a generator function.
*/

var { declareMethod, method } = require('../core/method');
// var { declareMethod, method } = require('@micosmo/core/method');

const ProtGenFn = Object.getPrototypeOf(function * () { });
const TickerPrototype = _TickerPrototype();
const DefaultTicker = Ticker('DefaultTicker');
var idTickerProcess = 1;

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
  beater,
  sBeater,
  msBeater,
};

// Ticker handler
function Ticker(name) {
  if (typeof name !== 'string')
    throw new Error(`micosmo:Ticker: Name is required`)
  return Object.setPrototypeOf({
    isaTicker: true,
    isStarted: true,
    name,
    processes: [],
    tick: fNoop,
  }, TickerPrototype);
};

function _TickerPrototype() {
  return {
    assignAsDefaultTo(...processes) {
      if (processes.length === 1 && Array.isArray(processes[0]))
        processes = processes[0];
      processes.forEach(process => {
        if (typeof process !== 'object' || !process.isaProcess)
          throw new Error(`micosmo:ticker:assignAsDefaultTo: Invalid process parameter`);
        if (process.isStarted) {
          console.warn(`micosmo:ticker:assignAsDefaultTo: Process '${process.name}' started. Cannot assign ticker`);
          return this;
        }
        process.ticker = this;
      })
      return this;
    },
    start() {
      if (this.isStarted)
        return false;
      this.tick = this.processes.length > 0 ? method(tickTicker) : fNoop;
      return (this.isStarted = true);
    },
    stop() {
      const rc = this.pause();
      if (this.processes.length > 0)
        this.processes = [];
      return rc;
    },
    pause() {
      if (!this.isStarted)
        return false;
      this.tick = fNoop;
      this.isStarted = false;
      return true;
    },
    isRunning() {
      return this.isStarted;
    },
    isPaused() {
      return !this.isStarted;
    }
  };
}

var tickTicker = declareMethod(function (tm, dt) {
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
});

function attachTicker(ticker, process) {
  if (ticker.tick === fNoop)
    ticker.tick = method(tickTicker);
  ticker.processes.push(process);
}

function detachTicker(ticker, process) {
  const processes = ticker.processes;
  const iProcess = processes.findIndex(proc => proc === process);
  if (iProcess < 0)
    throw new Error(`micosmo:ticker: Process '${process.name}' is not attached to ticker '${ticker.name}'`)
  processes[iProcess] = undefined; // Let tick cycle remove the entry
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
//    micosmo:ticker: ticker
//  }
function startProcess(...args) {
  return new _Process(validateArgs('startProcess', ...args)).start();
}

function createProcess(...args) {
  return new _Process(validateArgs('createProcess', ...args));
};

function validateArgs(fn, ...args) {
  const cfg = {};
  const msg = `micosmo:ticker:${fn}: Invalid parameter`;
  var flCfgPassed = false;
  switch (args.length) {
  case 0:
    throw new Error(`micosmo:ticker:${fn}: onTick or configuration parameter required`);
  case 1:
    mapArg(cfg, args, 0, msg,
      [['function', 'onTick'], ['object', o => { flCfgPassed = true; Object.assign(cfg, o) }]]);
    break;
  case 2:
    mapArg(cfg, args, 0, msg, [['function', 'onTick']]);
    mapArg(cfg, args, 1, msg, [['object', 'ticker']]);
    break;
  default:
    throw new Error(`micosmo:ticker:${fn}: Too many parameters`);
  }
  return validateConfig(fn, cfg, flCfgPassed);
}

function validateConfig(fn, cfg, flCfgPassed) {
  //    name: Name of the process. String
  const id = idTickerProcess++;
  if (!cfg.name)
    cfg.name = `<TickerProcess:${id}>`
  else if (typeof cfg.name !== 'string')
    throw new Error(`micosmo:ticker:${fn}: Invalid 'name' (${cfg.name})`);
  //    onTick: function or generator function
  if (!cfg.onTick)
    throw new Error(`micosmo:ticker:${fn}: 'onTick' function required`);
  else if (typeof cfg.onTick !== 'function')
    throw new Error(`micosmo:ticker:${fn}: Invalid 'onTick' (${typeof cfg.onTick})`);
  //    micosmo:ticker: ticker
  if (!cfg.ticker)
    cfg.ticker = DefaultTicker;
  else if (!cfg.ticker.isaTicker)
    throw new Error(`micosmo:ticker:${fn}: 'ticker' is not a Ticker`);
  if (flCfgPassed) {
    //    onEnd: Function dispatched at end of process. Always dispatched. Parms(process, flTimeout)
    if (cfg.onEnd) {
      if (typeof cfg.onEnd !== 'function')
        throw new Error(`micosmo:ticker:${fn}: Invalid 'onEnd' (${typeof cfg.onEnd})`);
      this.onEnd = cfg.onEnd;
    }
    //    msTimeout: Timeout interval in milliseconds.
    //    sTimeout: Timeout interval in seconds
    if (cfg.sTimeout && cfg.msTimeout)
      throw new Error(`micosmo:ticker:${fn}: Either 'sTimeout' or 'msTimeout'`);
    if (!cfg.msTimeout) {
      if (cfg.sTimeout) {
        if (typeof cfg.sTimeout !== 'number' || cfg.sTimeout <= 0)
          throw new Error(`micosmo:ticker:${fn}: Invalid 'sTimeout' (${typeof cfg.sTimeout})`);
        cfg.msTimeout = cfg.sTimeout * 1000;
        delete cfg.sTimeout;
      }
    } else if (typeof cfg.msTimeout !== 'number' || cfg.msTimeout <= 0)
      throw new Error(`micosmo:ticker:${fn}: Invalid 'msTimeout' (${typeof cfg.msTimeout})`);
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

var tickProcess = declareMethod(_tickProcess);

_Process.prototype = {
  start(ticker) {
    if (this.isStarted)
      throw new Error(`micosmo:ticker:process:start: Process '${this.name}' already started`);
    if (ticker) {
      if (typeof ticker !== 'object' || !ticker.isaTicker)
        throw new Error(`micosmo:ticker:process:start: Invalid ticker parameter`);
      this.ticker = ticker;
    } else
      this.ticker = this.defaultTicker;
    this.isStarted = true;
    this.tick = method(tickProcess);
    if (this.msTimeout)
      this.tick = getTimeoutFn(method(tickProcess).bind(this), this.msTimeout);
    this.gTick = this.onTick(this.state); // Create an instance of our generator.
    attachTicker(this.ticker, this);
    return this;
  },
  stop() {
    if (!this.isStarted)
      return this;
    detachTicker(this.ticker, this);
    stopProcess(this, 'stop');
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

function _tickProcess(tm, dt) {
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
        return stopProcess(this, 'done');
      }
      if (typeof value === 'function') {
      // Chain to this generator
        this.gTick = getGeneratorFunction(value)(state);
        return;
      }
      if (value !== 'stop') {
        if (!this._haveIssuedBadReturnCodeWarning)
          console.warn(`micosmo:ticker:process:tick: Process '${this.name}' received an invalid return code '${value}'. Assumed 'done'.`);
        this._haveIssuedBadReturnCodeWarning = true;
        if (this.gTickStack.length > 0) {
          this.gTick = this.gTickStack.pop();
          return;
        }
        return stopProcess(this, 'done');
      }
      return stopProcess(this, 'stop');
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
    return value === 'stop' ? stopProcess(this, 'stop') : undefined;
  } while (true);
}

function stopProcess(process, rsn) {
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
      return stopProcess(process, 'timeout');
  };
}

// Generator function support services

function getGeneratorFunction(f) {
  return isaGeneratorFunction(f) ? f : makeGeneratorFunction(f);
}

function makeGeneratorFunction(f) {
  return function * (state) {
    do {
      const resp = f(state.tm, state.dt, state.data, state.name);
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
    throw new Error(`micosmo:ticker:looper: Invalid parameter`);
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
    throw new Error(`micosmo:ticker:waiter: Time unit maybe milliseconds. Use sWaiter otherwise`);
  return msWaiter(s * 1000, f);
}

function sWaiter(s, f) {
  return msWaiter(s * 1000);
}

function msWaiter(ms, f) {
  if (typeof ms !== 'number')
    throw new Error(`micosmo:ticker:msWaiter: Invalid parameter`);
  return function * (state) {
    for (let t = ms; t > 0; t -= state.dt)
      yield;
    return f;
  }
}

function timer(s, f) {
  if (s >= 50)
    throw new Error(`micosmo:ticker:timer: Time unit maybe milliseconds. Use sTimer otherwise`);
  return msTimer(s * 1000, f);
}

function sTimer(s, f) {
  return msTimer(s * 1000, f);
}

function msTimer(ms, f) {
  if (typeof ms !== 'number' || typeof f !== 'function')
    throw new Error(`micosmo:ticker:msTimer: Invalid parameter`);
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
      const resp = f(state.tm, state.dt, t, state.name);
      if (resp === 'more')
        yield
      else
        return resp; // undefined, 'done, 'stop' or chained function
    }
  }
}

function beater(s, f) {
  if (s >= 50)
    throw new Error(`micosmo:ticker:beater: Time unit maybe milliseconds. Use sBeater otherwise`);
  return _msBeater(s * 1000, f, true);
}

function sBeater(s, f) {
  return _msBeater(s * 1000, f, true);
}

function msBeater(ms, f) {
  return _msBeater(ms, f, false);
}

function _msBeater(ms, f, isInSeconds) {
  if (typeof ms !== 'number' || typeof f !== 'function')
    throw new Error(`micosmo:ticker:msBeater: Invalid parameter`);
  return isaGeneratorFunction(f) ? msGenBeater(ms, f, isInSeconds) : msFuncBeater(ms, f, isInSeconds);
}

function msGenBeater(ms, f, isInSeconds) {
  return function * (state) {
    const fi = f(state);
    for (let t = 0, it = ms; ; it += ms, t += ms) {
      for (; it > 0; it -= state.dt)
        yield;
      state.data = isInSeconds ? Math.trunc(t / 1000) : t;
      const resp = fi.next();
      if (resp.done)
        return resp.value;
      yield resp.value;
    }
  }
}

function msFuncBeater(ms, f, isInSeconds) {
  return function * (state) {
    for (let t = 0, it = ms; ; it += ms) {
      for (; it > 0; it -= state.dt, t += state.dt)
        yield;
      const resp = f(state.tm, state.dt, isInSeconds ? Math.trunc(t / 1000) : t, state.name);
      if (resp === 'more')
        yield
      else
        return resp; // undefined, 'done, 'stop' or chained function
    }
  }
}
