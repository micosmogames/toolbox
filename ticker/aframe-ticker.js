/*
*  aframe-ticker.js
*
*  Aframe implementaion of the ticker.js system.
*/
import aframe from 'aframe';
import ticker from './ticker';
import { declareMethod, method } from '@micosmo/core/method';
import { onLoadedDo } from '@micosmo/aframe/startup';

export { looper, iterator, waiter, sWaiter, msWaiter, timer, sTimer, msTimer } from './ticker';

export function startProcess(...args) {
  return checkOnLoadedDoTicker(processArgs('startProcess', args), process => process.start());
}

export function createProcess(...args) {
  return checkOnLoadedDoTicker(processArgs('createProcess', args), () => { });
}

function checkOnLoadedDoTicker(cfg, fComplete) {
  if (typeof cfg.ticker === 'function') {
    const f = cfg.ticker;
    delete cfg.ticker;
    const process = ticker.createProcess(cfg);
    onLoadedDo(() => {
      process.defaultTicker = f();
      fComplete(process);
    });
    return process;
  }
  const process = ticker.createProcess(cfg);
  fComplete(process);
  return process;
}

function processArgs(fn, args) {
  let cfg, fTyTicker, tkr;
  if (args.length < 1)
    return args;
  if (args.length === 1 && typeof args[0] === 'object') {
    cfg = args[0];
    //    ticker: ticker | el | selector (non-cascading) | default
    //    locateTicker: el | selector (cascading)
    //    tocker: ticker | el | selector (non-cascading) | default
    //    locateTocker: el | selector (cascading)
    let cnt = 0;
    if ((tkr = cfg.ticker)) {
      fTyTicker = sel => getTicker(sel);
      cnt++;
    } else if ((tkr = cfg.locateTicker)) {
      fTyTicker = sel => locateTicker(sel);
      delete cfg.locateTicker;
      cnt++;
    } else if ((tkr = cfg.tocker)) {
      fTyTicker = sel => getTocker(sel);
      delete cfg.tocker;
      cnt++;
    } else if ((tkr = cfg.locateTocker)) {
      fTyTicker = sel => locateTocker(sel);
      delete cfg.locateTocker;
      cnt++;
    }
    if (cnt > 1)
      throw new Error(`ticker:${fn}: Either 'ticker', 'tocker', 'locateTicker' or 'locateTocker`);
  } else {
    cfg = {};
    if (args.length >= 1)
      cfg.onTick = args[0];
    if (args.length > 1) {
      fTyTicker = sel => locateTicker(sel);
      tkr = args[1];
    }
  }
  if (!tkr)
    return cfg;
  if (typeof tkr === 'object' && tkr.isaTicker)
    cfg.ticker = tkr;
  else
    cfg.ticker = () => fTyTicker(tkr); // tkr must be a selector or element
  return cfg;
}

export function locateTicker(startEl) {
  return _locateTicker(startEl, 'locateTicker');
}

export function getTicker(el) {
  return _getTicker(el, 'getTicker');
}

export function locateTocker(startEl) {
  return _locateTicker(startEl, 'locateTocker');
}

export function getTocker(el) {
  return _getTicker(el, 'getTocker');
}

function _locateTicker(startEl, fn) {
  if (typeof startEl === 'string') {
    if (startEl === 'default')
      return fn === 'locateTocker' ? defTocker : defTicker;
    const sel = startEl;
    startEl = document.querySelector(sel);
    if (!startEl)
      throw new Error(`ticker:${fn}: Invalid selector '${sel}'`);
  } else if (startEl.isaTicker)
    return startEl;
  for (let el = startEl; el; el = el.parentElement) {
    const compTicker = findTicker(el, fn === 'locateTocker');
    if (compTicker)
      return compTicker.ticker;
    if (el === startEl.sceneEl)
      break;
  }
  console.warn(`ticker:${fn}: No ${fn === 'locateTocker' ? 'tockers' : 'tickers'} visible in element hierarchy. Attaching to default. Start element ${startEl}`);
  return fn === 'locateTocker' ? defTocker : defTicker;
}

function _getTicker(el, fn) {
  if (typeof el === 'string') {
    if (el === 'default')
      return fn === 'getTocker' ? defTocker : defTicker;
    const sel = el;
    el = document.querySelector(sel);
    if (!el)
      throw new Error(`ticker:${fn}: Invalid selector '${sel}'`);
  } else if (el.isaTicker)
    return el;
  const compTicker = findTicker(el, fn === 'getTocker');
  if (!compTicker)
    throw new Error(`ticker:${fn}: Element does not have a '${fn === 'getTocker' ? 'tocker' : 'ticker'}' component`);
  return compTicker.ticker;
}

function findTicker(el, flTocker) {
  for (const name of Object.getOwnPropertyNames(el.components)) {
    const c = el.components[name];
    if ((flTocker && c.isaTocker) || (!flTocker && c.isaTicker))
      return c;
  };
  return undefined
}

const defTicker = ticker.DefaultTicker;
const defTocker = ticker.Ticker('DefaultTocker');

var start = declareMethod(function () { return this.ticker.start(); });
var stop = declareMethod(function () { return this.ticker.stop(); });
var pause = declareMethod(function () { return this.ticker.pause(); });
var play = declareMethod(function () { return this.ticker.start(); });

aframe.registerSystem("ticker", {
  init() {
    this.ticker = defTicker;
    this.isaTicker = true;
    console.info(`system:ticker:init: Ticker '${defTicker.name}' initialised`);
  },
  tick(tm, dt) { defTicker.tick(tm, dt) },
  start: method(start),
  stop: method(stop),
  pause: method(pause)
});

aframe.registerComponent("ticker", {
  multiple: true,
  init() {
    const id = this.id || this.el.id || '<anonymous>';
    if (id === '<anonymous>')
      console.warn('component:ticker:init: Missing element or component id for Ticker name.');
    this.ticker = ticker.Ticker(id);
    this.isaTicker = true;
    console.info(`component:ticker:init: Ticker '${this.ticker.name}' initialised`);
  },
  tick(tm, dt) { this.ticker.tick(tm, dt) },
  start: method(start),
  stop: method(stop),
  pause: method(pause),
  play: method(play)
});

var flDefaultTockerStarted = false;
export function startDefaultTocker() {
  if (flDefaultTockerStarted)
    return;
  aframe.registerSystem("tocker", {
    init() {
      this.ticker = defTocker;
      this.isaTocker = true;
      console.info(`system:tocker:init: Tocker '${defTocker.name}' initialised`);
    },
    tock(tm, dt) { defTocker.tick(tm, dt) },
    start: method(start),
    stop: method(stop),
    pause: method(pause)
  });
  flDefaultTockerStarted = true;
}

aframe.registerComponent("tocker", {
  multiple: true,
  init() {
    const id = this.id || this.el.id || '<anonymous>';
    if (id === '<anonymous>')
      console.warn('component:tocker:init: Missing element or component id for Ticker name.');
    this.ticker = ticker.Ticker(id);
    this.isaTocker = true;
    console.info(`component:tocker:init: Ticker '${this.ticker.name}' initialised`);
  },
  tock(tm, dt) { this.ticker.tick(tm, dt) },
  start: method(start),
  stop: method(stop),
  pause: method(pause),
  play: method(play)
});
