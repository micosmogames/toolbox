// dataset : Defines data properties that can be used as defaults, templates and component initialisation.
// Data format: '[[<group>:]<id>|][(<type>) or ([<type])]<name>: value[, value, ...]
// <type>: s - trimmed string, rs - raw string, i - int, n - number, v3 - THREE.Vector3
// Notes:
//    1. (<type>) is singular and ([<type>]) is a comma separated array.
//    2. <group> is the selector of a data group element. Contains one or more dataset__<id> components. Ex <a-entity id="myGroup" dataset__<id> ...></a-entity>
//    3. <id> Is the id of a specific data component in current or <group>.
//    4. [<group>:]<id> is optional data that this data extends. Local values override inherited values
//    5. extends-dataset="<group>" All dataset__ in the same element inherit from like named dataset__ in the <group> selector.

import aframe from 'aframe';
import { copyValues } from '@micosmo/core/replicate';
import { StringBuilder, parseNameValues } from '@micosmo/core/string';
import { hasOwnProperty } from '@micosmo/core/object';

aframe.registerComponent("dataset", {
  schema: { default: '' },
  multiple: true,
  init() {
    if (!this.id)
      throw new Error(`micosmo:component:dataset:init: Data components must have an id. Ex data__foo`);
    this.group = this.el.components.datagroup;
    if (!this.group)
      throw new Error(`micosmo:component:dataset:init: Data components must be in a data group`);
  },
  update(oldData) {
    if (oldData && oldData !== '')
      throw new Error(`micosmo:component:dataset:update: Data components can not be updated. They can only be extended.`);
    let data = this.data.trimStart();
    const compExtend = this.el.components['extend-dataset'];
    if (!compExtend && this.el.getAttribute('extend-dataset'))
      throw new Error(`micosmo:component:dataset:update: The 'extend-dataset' component must be placed before 'dataset' components`);
    const oDataset = (compExtend && compExtend.copyData(this.id)) || Object.create(null);
    if (data[0] === '|') {
      const iPipe = data.indexOf('|', 1);
      if (iPipe < 0)
        throw new Error(`micosmo:component:dataset:update: Dataset extend format is '|[<group>:]<dataset>|`);
      const s = data.substring(1, iPipe); data = data.substring(iPipe + 1);
      let [group, id] = s.split(':');
      if (!id) { id = group; group = undefined }
      const compGroup = (group && this.system.data.getData(group.trim())) || this.group;
      if (!compGroup.hasDataFor(id.trim()))
        throw new Error(`micosmo:component:dataset:update: Data component '${id.trim()}' was not found in group '${(group && group.trim()) || this.el.id}'`);
      copyValues(compGroup.getDataObject(), oDataset);
    }
    this.dataset = Object.freeze(!data ? oDataset : this.system.parse(data, oDataset));
  },
  getData() { return this.dataset },
  copyData() { return copyValues(this.dataset) }
});

const EmptyData = Object.freeze(Object.create(null));

aframe.registerComponent("extend-dataset", {
  schema: { default: '' },
  multiple: false,
  update(oldData) {
    if (oldData && oldData !== '')
      throw new Error(`micosmo:component:extend-dataset:update: Extend-dataset components can not be updated.`);
    if (this.data === '')
      throw new Error(`micosmo:component:extend-dataset:update: Missing data group selector.`);
    this.group = this.el.sceneEl.systems.dataset.getDatagroup(this.data);
  },
  getData(id) { return this.group.getData(id) },
  copyData(id) { return this.group.copyData(id) }
});

aframe.registerComponent("datagroup", {
  getData(id) { const comp = this.el.components[`dataset__${id}`]; return (comp && comp.getData()) || EmptyData },
  copyData(id) { return copyValues(this.getData(id)) },
  hasDataFor(id) { return this.el.components[`dataset__${id}`] !== undefined }
});

aframe.registerPrimitive('a-datagroup', { defaultComponents: { datagroup: '' } });

aframe.registerSystem("dataset", {
  init() { this.groupMap = new Map(); this.sb = StringBuilder() },
  getDatagroup(sel) {
    const group = this.findDatagroup(sel);
    if (!group)
      throw new Error(`micosmo:system:dataset:getDataGroup: Group selector '${sel}' was not found`);
    return group;
  },
  findDatagroup(sel) {
    var group = this.groupMap.get(sel);
    if (group)
      return group;
    const el = this.sceneEl.querySelector(sel);
    if (!el)
      return null;
    group = el.components.datagroup;
    if (!group)
      throw new Error(`micosmo:system:dataset:findDataGroup: Selector '${sel}' is not a data group`);
    this.groupMap.set(sel, group);
    return group;
  },
  getData(sel, id) { return this.getDatagroup(sel).getData(id) },
  copyData(sel, id) { return copyValues(this.getData(sel, id)) },
  merge(...datasets) {
    // Merge datasets into one which will be in order of precedence.
    if (datasets.length === 1 && Array.isArray(datasets[0]))
      datasets = datasets[0];
    const oMerge = Object.create(null);
    for (let i = datasets.length - 1; i >= 0; i--)
      copyValues(datasets[i], oMerge);
    return oMerge;
  },
  map(sDataset, mappings, tDataset, how = 'fill') {
    const flFill = how === 'fill';
    mappings.forEach(prop => {
      if (flFill && hasOwnProperty(prop))
        return;
      tDataset[prop] = sDataset[prop];
    });
    return tDataset;
  },
  parse(...args) { return parseNameValues(...args) },
});
