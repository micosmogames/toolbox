import aframe from 'aframe';
import * as ticker from './ticker';
import { isVisibleInScene } from "../lib/utils";

var DocumentListeners;
const KeyMap = new Map();
var flKeyboardReady = false;

aframe.registerSystem("keyboard", {
  init() {
    ticker.onLoadedDo(keyboardReady);
  },
  documentListeners(o) {
    DocumentListeners = o;
  },
  disable() {
    if (!DocumentListeners)
      return;
    for (const prop in DocumentListeners)
      document.removeEventListener(prop, DocumentListeners[prop]);
  },
  enable() {
    if (!DocumentListeners)
      return;
    for (const prop in DocumentListeners)
      document.addEventListener(prop, DocumentListeners[prop]);
  },
  keydown(evt) {
    dispatchEvent(evt, 'keydown');
  },
  keyup(evt) {
    dispatchEvent(evt, 'keyup');
  },
  addListeners(comp, ...keySpecs) {
    ticker.onLoadedDo(() => {
      if (!comp.el.components.keymap) {
        console.warn(`system:keyboard:addListeners: Missing keymap component for element '${comp.el.id || '<anonymous>'}'`);
        return;
      }
      //      console.log('system:keyboard:addListeners: Processing keymap for', comp.attrName, keySpecs, comp.el.components.keymap.mappings);
      addListeners(comp.el.components.keymap, comp, keySpecs)
    });
  },
  tryAddListeners(comp, ...keySpecs) {
    ticker.onLoadedDo(() => {
      if (!comp.el.components.keymap)
        return;
      //      console.log('system:keyboard:tryAddListeners: Processing keymap for', comp.attrName, keySpecs, comp.el.components.keymap.mappings);
      addListeners(comp.el.components.keymap, comp, keySpecs)
    });
  },
  removeListeners(comp, ...ids) {
    if (!comp.el.components.keymap)
      return;
    removeListeners(comp.el.components.keymap, comp, ids);
  }
});

function dispatchEvent(evt, sEvent) {
  if (!flKeyboardReady)
    return;
  var keyCode = evt.key;
  if (keyCode === ' ' || keyCode === 'Alt' || keyCode === 'Control' || keyCode === 'Shift')
    keyCode = evt.code;
  // Build a composite key if we have alt or control key
  if (evt.altKey)
    keyCode = `Alt-${keyCode}`;
  if (evt.ctrlKey)
    keyCode = `Ctrl-${keyCode}`;
  // Try the '<filter>' listeners first
  if (dispatchListeners('<filter>', keyCode, evt, sEvent))
    return;
  dispatchListeners(keyCode, keyCode, evt, sEvent)
}

function dispatchListeners(kmKey, keyCode, evt, sEvent) {
  const listeners = KeyMap.get(kmKey);
  if (!listeners)
    return false;
  for (const listener of listeners) {
    if (!isVisibleInScene(listener.comp.el) || listener.km.isPaused)
      continue;
    if (listener[sEvent](listener.id, keyCode, evt)) {
      // Captured the key, go no further
      evt.preventDefault();
      evt.stopImmediatePropagation();
      return true;
    }
  }
  return false;
}

function addListeners(km, comp, keySpecs) {
  const idMap = km.mappings.idMap;
  if (keySpecs.length === 1 && Array.isArray(keySpecs[0]))
    keySpecs = keySpecs[0];
  if (keySpecs.length === 0)
    keySpecs = Object.keys(idMap); // Listen to all key ids for the keymap
  keySpecs.forEach(spec => {
    if (typeof spec === 'string')
      spec = { id: spec }; // Only have an id so build a dummy spec
    const keys = idMap[spec.id];
    if (!keys)
      return; // No mapping so ignore key id
    const keydown = getListener(comp, spec, 'keydown');
    const keyup = getListener(comp, spec, 'keyup');
    keys.forEach(key => {
      const listener = {
        km,
        comp,
        key,
        id: spec.id,
        keydown,
        keyup
      };
      var listeners = KeyMap.get(key);
      if (listeners) {
        const i = listeners.findIndex(l => l.comp === comp && l.id === spec.id);
        if (i < 0)
          listeners.push(listener);
        else
          listeners[i] = listener;
      } else
        KeyMap.set(key, [listener]);
    });
  });
}

function removeListeners(km, comp, ids) {
  const idMap = km.mappings.idMap;
  if (ids.length === 1 && Array.isArray(ids[0]))
    ids = ids[0];
  if (ids.length === 0)
    ids = Object.keys(idMap); // Remove all key ids for the keymap
  ids.forEach(id => {
    const keys = idMap[id];
    if (!keys)
      return; // No mapping so ignore key id
    keys.forEach(key => {
      var listeners = KeyMap.get(key);
      if (listeners) {
        const i = listeners.findIndex(l => l.comp === comp && l.id === id);
        if (i >= 0)
          listeners.splice(i, 1);
      }
    });
  });
}

function getListener(comp, spec, sEvt) {
  const sIdEvt = `${sEvt}_${spec.id}`;
  var fEvt = spec[sEvt];
  if (fEvt)
    return fEvt;
  if ((fEvt = comp[sIdEvt] && comp[sIdEvt].bind(comp)))
    return fEvt;
  return ((fEvt = comp[sEvt] && comp[sEvt].bind(comp))) ? fEvt : noListener;
}

function noListener() { return false }

function keyboardReady() {
  console.info(`system:keyboard:keyboardReady: Keyboard enabled`);
  flKeyboardReady = true;
}

aframe.registerComponent("keymap", {
  schema: { default: '' },
  update(oldData) {
    if (oldData && oldData !== '')
      throw new Error(`component:keymap:update: Key mappings can not be updated`);
    if (this.data === '')
      throw new Error(`component:keymap:update: Key mappings required`);
    this.mappings = prepareKeyMappings(this.data);
  },
  addListeners(comp, ...keySpecs) {
    addListeners(this, comp, keySpecs);
  },
  removeListeners(comp, ...ids) {
    removeListeners(this, comp, ids);
  },
  play() {
    this.isPaused = false;
  },
  pause() {
    this.isPaused = true;
  }
});

function prepareKeyMappings(sm) {
  const keyMap = {};
  const idMap = {};
  splitKeyMappings(sm).forEach(s => {
    var key, id;
    const i = s.indexOf(':');
    if (i <= 0)
      key = id = s.trim(); // Default to key id === key code.
    else if (i === 0 && (key = id = s.trim()).length > 1)
      throw new Error(`component:keymap:update: Invalid key mapping '${s}'`);
    else {
      id = s.substr(0, i).trim();
      key = s.substr(i + 1).trim();
    }
    if (id === '' || key === '')
      throw new Error(`component:keymap:update: Invalid key mapping '${s}'`);
    if (keyMap[key])
      throw new Error(`component:keymap:update: Multiple ids ('${keyMap[key]}' & '${id}') for key '${key}'.`);
    keyMap[key] = id;
    var keys = idMap[id];
    if (!keys)
      idMap[id] = keys = [];
    keys.push(key);
  });
  return {
    keyMap,
    idMap
  };
}

function splitKeyMappings(sm) {
  const a = [];
  do {
    const i = sm.indexOf(',');
    if (i < 0) {
      if (sm !== '')
        a.push(sm);
      return a;
    } else if (i === 0) {
      sm = sm.substr(1);
      continue;
    }
    a.push(sm.substr(0, i));
    sm = sm.substr(i + 1);
  } while (true);
}
