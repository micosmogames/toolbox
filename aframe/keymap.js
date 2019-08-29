import aframe from 'aframe';
import { addListeners, removeListeners } from "./keyboard";

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
    if (!comp || !comp.el || comp.el.components.keymap !== this)
      throw new Error('component:keymap:addListeners: Keymap is not associated with component');
    addListeners(this, comp, keySpecs);
  },
  removeListeners(comp, ...ids) {
    if (!comp || !comp.el || comp.el.components.keymap !== this)
      throw new Error('component:keymap:removeListeners: Keymap is not associated with component');
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
