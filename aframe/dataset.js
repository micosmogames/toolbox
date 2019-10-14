// dataset : Defines data properties that can be used as defaults, templates and component initialisation.
// Format: [| [<group> :][<dataset>, ...] ; ... |] <parseNameValues Format>
// Notes:
//    1. See parseNameValues in string.js for name/value format.
//    2. <group> is the id of a data group element. Contains one or more dataset__<id> components. Ex <a-entity id="myGroup" datagroup dataset__<id> ...></a-entity>
//    3. <dataset> Is the id of a specific dataset component in current or <group>.
//    4. [<group>:]<dataset> is optional data that this data extends. Can have multiple <dataset>s for a <group>. Local values override inherited values
//    5. extends-datagroup="<group>" All dataset__ in the same element inherit from like named dataset__ in the <group> selector.
//    6. Datagroup extends only applies to declared datasets. Undeclared datatsets from extended datagroup are not implicitly added.
//       Use dataset_<id>="" to explicitly include a dataset from an extended datagroup if not overriding.
//    7. if mulitple datasets are being extended then they are processed from right to left, meaning that a datatset in the extension list will override
//       any equivalent named pairs from right hand datasets.
//    8. Extension datasets defined in a dataset format string will override an inherited 'extend-datagroup' dataset.

import aframe from 'aframe';
import { copyValues } from '@micosmo/core/replicate';
import { StringBuilder, parseNameValues, skipRight } from '@micosmo/core/string';
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
    const compExtend = this.el.components['extend-datagroup'];
    if (!compExtend && this.el.getAttribute('extend-datagroup'))
      throw new Error(`micosmo:component:dataset:update: The 'extend-datagroup' component must be placed before 'dataset' components`);
    const oDataset = (compExtend && compExtend.copyData(this.id)) || Object.create(null);
    this.dataset = Object.freeze(this.system.parse(this.data, oDataset, this.id, this.group));
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
    if (!(this.name = this.el.id))
      throw new Error(`micosmo:system:datagroup:init: A datagroup element must have an 'id' attribute`);
    this.sysDataset = this.el.sceneEl.systems.dataset;
    this.sysDataset.addDatagroup(this.name, this);
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
  parse(sData, oData = Object.create(null), defDSName, defGroup) {
    const iData = skipRight(sData);
    if (iData >= sData.length) return oData;
    if (sData[iData] === '|') {
      const iPipe = sData.indexOf('|', iData + 1);
      if (iPipe < 0)
        throw new Error(`micosmo:component:dataset:parse: Dataset extend format is '|[<dg>:]<ds>[,<ds>...];...|`);
      const sExtends = sData.substring(iData + 1, iPipe); sData = sData.substring(iPipe + 1);
      const aDatasets = sExtends.split(';');
      // Process the dataset definitions in reverse order.
      for (let i = aDatasets.length - 1; i >= 0; i--) {
        let [groupName, dsNames] = aDatasets[i].split(':');
        if (dsNames === undefined) {
          // Can only have been provided with one or more dataset names
          dsNames = groupName; groupName = undefined;
        }
        const compGroup = (groupName && this.getDatagroup(groupName.trim())) || defGroup;
        if (!compGroup)
          throw new Error(`micosmo:system:dataset:parse: Datagroup not defined for dataset(s) '${dsNames}'`);
        const adsNames = dsNames.split(',');
        for (let j = adsNames.length - 1; j >= 0; j--) {
          let dsName = adsNames[i].trim();
          if (dsName === '') {
            if (!defDSName)
              throw new Error(`micosmo:system:dataset:parse: Dataset name required for datagroup '${compGroup.name}'`);
            dsName = defDSName;
          }
          if (!compGroup.hasDataFor(dsName))
            throw new Error(`micosmo:system:dataset:parse: Dataset '${dsName}' not found in datagroup '${compGroup.name}`);
          copyValues(compGroup.getData(dsName), oData);
        };
      }
    }
    return parseNameValues(sData, oData);
  },
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
    this.el.setAttribute(this.tgtAttrName, this.sysDataset.asString(this.sysDataset.parse(this.data, undefined, this.tgtCompName)));
  }
});
