// dataset : Defines data properties that can be used as defaults, templates and component initialisation.
// Data format: '[[<group>:]<id>[,...]|][(<type>) or ([<type])]<name>: value[, value, ...]
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

const Sb = StringBuilder();

aframe.registerComponent("dataset", {
  schema: { default: '' },
  multiple: true,
  init() {
    if (!this.id)
      throw new Error(`micosmo:component:dataset:init: Dataset components must have an id. Ex data__foo`);
    this.group = this.el.components.datagroup;
    if (!this.group)
      throw new Error(`micosmo:component:dataset:init: Data components must be in a datagroup element`);
  },
  update(oldData) {
    if (oldData && oldData !== '')
      throw new Error(`micosmo:component:dataset:update: Dataset components can not be updated. They can only be extended.`);
    let data = this.data.trimStart();
    const compExtend = this.el.components['extend-datagroup'];
    if (!compExtend && this.el.getAttribute('extend-datagroup'))
      throw new Error(`micosmo:component:dataset:update: The 'extend-datagroup' component must be placed before 'dataset' components`);
    const oDataset = (compExtend && compExtend.copyData(this.id)) || Object.create(null);
    if (data[0] === '|') {
      const iPipe = data.indexOf('|', 1);
      if (iPipe < 0)
        throw new Error(`micosmo:component:dataset:update: Datagroup extend format is '|[<datagroup>:]<dataset>[,...]|`);
      const sExtends = data.substring(1, iPipe); data = data.substring(iPipe + 1);
      parseReferenceDatasets(sExtends, oDataset, this.system, this.id, this.group, 'dataset');
    }
    this.dataset = Object.freeze(!data ? oDataset : this.system.parse(data, oDataset));
  },
  getData() { return this.dataset },
  copyData() { return copyValues(this.dataset) }
});

const EmptyData = Object.freeze(Object.create(null));

aframe.registerComponent("extend-datagroup", {
  schema: { default: '' },
  multiple: false,
  update(oldData) {
    if (oldData && oldData !== '')
      throw new Error(`micosmo:component:extend-dataset:update: Extend-dataset components can not be updated.`);
    if (this.data === '')
      throw new Error(`micosmo:component:extend-dataset:update: Missing data group name(s).`);
    this.groups = this.data.split(',').forEach(s => this.el.sceneEl.systems.dataset.getDatagroup(s.trim()));
  },
  getData(dsName) { return this.groups === 1 ? this.groups[0].getData(dsName) : this.copyData(dsName) },
  copyData(dsName) {
    let i = this.groups.length - 1;
    const oDataset = this.group[i].copyData(dsName);
    for (i--; i >= 0; i--)
      copyValues(this.group[i].getData(dsName), oDataset);
    return oDataset;
  }
});

aframe.registerComponent("datagroup", {
  init() {
    if (!this.el.id)
      throw new Error(`micosmo:system:datagroup:init: A datagroup element must have an 'id' attribute`);
    this.sysDataset = this.el.sceneEl.systems.dataset;
    this.sysDataset.addDatagroup(this.el.id, this);
  },
  getData(dsName) { const comp = this.el.components[`dataset__${dsName}`]; return (comp && comp.getData()) || EmptyData },
  copyData(dsName) { return copyValues(this.getData(dsName)) },
  hasDataFor(dsName) { return this.el.components[`dataset__${dsName}`] !== undefined }
});

aframe.registerPrimitive('a-datagroup', { defaultComponents: { datagroup: '' } });

aframe.registerSystem("dataset", {
  init() { this.groupMap = new Map() },
  addDatagroup(name, compGroup) {
    if (this.groupMap.has(name))
      throw new Error(`micosmo:system:dataset:addDatagroup: Datagroup '${name}' already exists`);
    this.groupMap.set(name, compGroup);
  },
  getDatagroup(name) {
    const group = this.findDatagroup(name);
    if (!group)
      throw new Error(`micosmo:system:dataset:getDataGroup: Group '${name}' was not found`);
    return group;
  },
  findDatagroup(name) {
    return this.groupMap.get(name);
  },
  getData(groupName, dsName) { return this.getDatagroup(groupName).getData(dsName) },
  copyData(groupName, dsName) { return copyValues(this.getData(groupName, dsName)) },
  merge(...datasets) {
    // Merge datasets into one which will be in order of precedence.
    if (datasets.length === 1 && Array.isArray(datasets[0]))
      datasets = datasets[0];
    const oMerge = Object.create(null);
    for (let i = datasets.length - 1; i >= 0; i--) {
      const dataset = datasets[i];
      if (typeof dataset === 'string') this.parse(dataset, oMerge);
      else copyValues(dataset, oMerge);
    }
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
  asString(oDataset) {
    Sb.clear();
    for (const prop in oDataset)
      Sb.append(prop).append(':').append(oDataset[prop]).append(';');
    return Sb.toString();
  },
  setAttribute(el, attrName, ...data) {
    let attrData = ''; let oData;
    if (data.length === 1) {
      if (typeof (attrData = data[0]) === 'object')
        attrData = this.asString(oData = attrData);
    } else if (data.length > 1)
      attrData = this.asString(oData = this.merge(...data));
    el.setAttribute(attrName, attrData);
    return oData;
  }
});

// Creates a component that is based on a dataset defaults and specific overrides.
aframe.registerComponent("mi", {
  schema: { default: '' },
  multiple: true,
  init() {
    if (!this.id)
      throw new Error(`micosmo:component:mi:init: A mi component must have an id. Ex. mi__material`);
    this.tgtAttrName = this.id;
    let i; this.tgtCompName = (i = this.tgtAttrName.indexOf('__')) < 0 ? this.tgtAttrName : this.tgtAttrName.substring(0, i);
    this.sysDataset = this.el.sceneEl.systems.dataset;
  },
  update() {
    const oData = Object.create(null);
    let data = this.data.trimStart();
    if (data[0] === '|') {
      const iPipe = data.indexOf('|', 1);
      if (iPipe < 0)
        throw new Error(`micosmo:component:mi:update: Missing end of datagroup section. Expecting a '|'`);
      const sDgs = data.substring(1, iPipe); data = data.substring(iPipe + 1);
      parseReferenceDatasets(sDgs, oData, this.sysDataset, this.tgtCompName, undefined, 'mi');
    }
    this.el.setAttribute(this.tgtAttrName, this.sysDataset.asString(this.sysDataset.parse(data, oData)));
  }
});

function parseReferenceDatasets(s, oData, sysDataset, defDSName, defGroup, who) {
  const aDatasets = s.split(',');
  // Process the dataset definitions in reverse order.
  for (let i = aDatasets.length - 1; i >= 0; i--) {
    let [groupName, dsName] = aDatasets[i].split(':');
    if (dsName === '') { dsName = defDSName } else if (!dsName) { dsName = groupName; groupName = undefined }
    const compGroup = (groupName && sysDataset.getDatagroup(groupName.trim())) || defGroup; dsName = dsName.trim();
    if (!compGroup)
      throw new Error(`micosmo:component:${who}:parseReferenceDatasets: Datagroup not defined`);
    if (!compGroup.hasDataFor(dsName))
      throw new Error(`micosmo:component:${who}:parseReferenceDatasets: Dataset '${dsName}' not found in datagroup '${(groupName && groupName.trim()) || defGroup.el.id}`);
    copyValues(compGroup.getData(dsName), oData);
  }
  return oData;
}
