import aframe from 'aframe';
import { onLoadedDo } from './startup';
import { isVisibleInScene } from "./lib/utils";

var isListenerInactive = listener => listener.km.isPaused || !isVisibleInScene(listener.comp.el);
export function noVisibilityChecks() { isListenerInactive = listener => listener.km.isPaused }

aframe.registerSystem("keyboard", {
  init() {
    onLoadedDo(() => this.keyboardReady());
    this.keyMap = new Map();
    this.flKeyboardReady = false;
    this.fKeyDown = evt => { dispatchEvent(this, evt, 'keydown') };
    this.fKeyUp = evt => { dispatchEvent(this, evt, 'keyup') };
    addDocumentListeners(this);
  },
  disable() { removeDocumentListeners(this) },
  enable() { addDocumentListeners(this) },
  addListeners(comp, ...keySpecs) {
    onLoadedDo(() => {
      if (!comp.el.components.keymap) {
        console.warn(`micosmo:system:keyboard:addListeners: Missing keymap component for element '${comp.el.id || '<anonymous>'}'`);
        return;
      }
      //      console.log('micosmo:system:keyboard:addListeners: Processing keymap for', comp.attrName, keySpecs, comp.el.components.keymap.mappings);
      addListeners(comp.el.components.keymap, comp, keySpecs)
    });
  },
  tryAddListeners(comp, ...keySpecs) {
    onLoadedDo(() => {
      if (!comp.el.components.keymap)
        return;
      //      console.log('micosmo:system:keyboard:tryAddListeners: Processing keymap for', comp.attrName, keySpecs, comp.el.components.keymap.mappings);
      addListeners(comp.el.components.keymap, comp, keySpecs)
    });
  },
  removeListeners(comp, ...ids) {
    if (!comp.el.components.keymap)
      return;
    removeListeners(comp.el.components.keymap, comp, ids);
  },
  keyboardReady() {
    console.info(`micosmo:system:keyboard:keyboardReady: Keyboard enabled`);
    this.flKeyboardReady = true;
  }
});

function addDocumentListeners(kb) {
  document.addEventListener('keydown', kb.fKeyDown, true);
  document.addEventListener('keyup', kb.fKeyUp, true);
}

function removeDocumentListeners(kb) {
  document.removeEventListener('keydown', kb.fKeyDown);
  document.removeEventListener('keyup', kb.fKeyUp);
}

function dispatchEvent(kb, evt, sEvent) {
  if (!kb.flKeyboardReady) return;
  var keyCode = evt.key;
  if (keyCode === ' ' || keyCode === 'Alt' || keyCode === 'Control' || keyCode === 'Shift')
    keyCode = evt.code;
  // Build a composite key if we have alt or control key
  if (evt.altKey)
    keyCode = `Alt-${keyCode}`;
  if (evt.ctrlKey)
    keyCode = `Ctrl-${keyCode}`;
  // Try the '<filter>' listeners first
  if (dispatchListeners(kb, '<filter>', keyCode, evt, sEvent))
    return;
  dispatchListeners(kb, keyCode, keyCode, evt, sEvent)
}

function dispatchListeners(kb, kmKey, keyCode, evt, sEvent) {
  const listeners = kb.keyMap.get(kmKey);
  if (!listeners) return false;
  for (const listener of listeners) {
    if (isListenerInactive(listener)) continue;
    if (listener[sEvent](listener.id, keyCode, evt)) {
      // Captured the key, go no further
      evt.preventDefault();
      evt.stopImmediatePropagation();
      return true;
    }
  }
  return false;
}

export function addListeners(km, comp, keySpecs) {
  const kb = comp.el.sceneEl.systems.keyboard;
  const idMap = km.mappings.idMap;
  if (keySpecs.length === 1 && Array.isArray(keySpecs[0]))
    keySpecs = keySpecs[0];
  if (keySpecs.length === 0)
    keySpecs = Object.keys(idMap); // Listen to all key ids for the keymap
  keySpecs.forEach(spec => {
    if (typeof spec === 'string') spec = { id: spec }; // Only have an id so build a dummy spec
    const keys = idMap[spec.id];
    if (!keys) return; // No mapping so ignore key id
    const keydown = getListener(comp, spec, 'keydown');
    const keyup = getListener(comp, spec, 'keyup');
    keys.forEach(key => {
      const listener = { km, comp, key, id: spec.id, keydown, keyup };
      var listeners = kb.keyMap.get(key);
      if (listeners) {
        const i = listeners.findIndex(l => l.comp === comp && l.id === spec.id);
        listeners[i < 0 ? listeners.length : i] = listener;
      } else
        kb.keyMap.set(key, [listener]);
    });
  });
}

export function removeListeners(km, comp, ids) {
  const kb = comp.el.sceneEl.systems.keyboard;
  const idMap = km.mappings.idMap;
  if (ids.length === 1 && Array.isArray(ids[0]))
    ids = ids[0];
  if (ids.length === 0)
    ids = Object.keys(idMap); // Remove all key ids for the keymap
  ids.forEach(id => {
    const keys = idMap[id];
    if (!keys) return; // No mapping so ignore key id
    keys.forEach(key => {
      var listeners = kb.keyMap.get(key);
      if (listeners) {
        const i = listeners.findIndex(l => l.comp === comp && l.id === id);
        if (i >= 0) listeners.splice(i, 1);
      }
    });
  });
}

function getListener(comp, spec, sEvt) {
  const sIdEvt = `${sEvt}_${spec.id}`;
  var fEvt = spec[sEvt];
  if (fEvt) return fEvt;
  if ((fEvt = comp[sIdEvt] && comp[sIdEvt].bind(comp))) return fEvt;
  return ((fEvt = comp[sEvt] && comp[sEvt].bind(comp))) ? fEvt : noListener;
}

function noListener() { return false }
