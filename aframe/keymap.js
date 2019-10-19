import aframe from 'aframe';
import { addListeners, removeListeners } from "./keyboard";

aframe.registerComponent("keymap", {
  schema: { default: '' },
  update(oldData) {
    if (oldData && oldData !== '')
      throw new Error(`micosmo:component:keymap:update: Key mappings can not be updated`);
    if (this.data === '')
      throw new Error(`micosmo:component:keymap:update: Key mappings required`);
    this.mappings = prepareKeyMappings(this);
  },
  addListeners(comp, ...keySpecs) {
    if (!comp || !comp.el || comp.el.components.keymap !== this)
      throw new Error('micosmo:component:keymap:addListeners: Keymap is not associated with component');
    addListeners(this, comp, keySpecs);
  },
  removeListeners(comp, ...ids) {
    if (!comp || !comp.el || comp.el.components.keymap !== this)
      throw new Error('micosmo:component:keymap:removeListeners: Keymap is not associated with component');
    removeListeners(this, comp, ids);
  },
  play() { this.isPaused = false },
  pause() { this.isPaused = true }
});

const ParseOptions = { entrySeparator: ',', appendDuplicates: true };

function prepareKeyMappings(km) {
  const keyMap = Object.create(null);
  const idMap = km.el.sceneEl.systems.dataset.parse(km.data, undefined, ParseOptions);
  for (var id in idMap) {
    const id1 = id;
    var keys = idMap[id];
    if (!keys)
      idMap[id] = keys = [id]; // Default to key id === key code.
    else if (!Array.isArray(keys))
      idMap[id] = keys = [keys];
    keys.forEach(key => {
      if (keyMap[key])
        throw new Error(`micosmo:component:keymap:update: Multiple ids ('${keyMap[key]}' & '${id1}') for key '${key}'.`);
      keyMap[key] = id1;
    });
  }
  return { keyMap, idMap };
}
