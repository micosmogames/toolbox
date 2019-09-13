/*
 *  replicate.js
 *
 *  Services to assign, copy and clone objects at either a value or descriptor level.
 *  Is also integrated with private spaces to allow private properties to be assigned copied or
 *  cloned.
 */
"use strict";

const { newPrivateSpace } = require('./private');
const { declareMethods, method } = require('./method');

declareMethods(copyReplicator, copyPublicReplicator, cloneReplicator, clonePublicReplicator);

module.exports = {
  assign,
  openAssign,
  closedAssign,
  assignValues,

  copy,
  openCopy,
  closedCopy,
  copyValues,
  reverseCopy,

  clone,
  openClone,
  closedClone,
  cloneValues
};

function assign(from, to) {
  return descReplicate({}, from, to);
}

function openAssign(from, to) {
  return descReplicate({ fConfigure: fConfigurable }, from, to);
}

function closedAssign(from, to) {
  return descReplicate({ fConfigure: fNotConfigurable }, from, to);
}

function assignValues(from, to) {
  return valueReplicate({}, from, to);
}

function descReplicate(ctxt, from, to = {}) {
  const descs = Object.getOwnPropertyDescriptors(from);
  const fConfigure = ctxt.fConfigure;
  if (fConfigure) {
    for (const name in descs)
      fConfigure(ctxt, descs[name]);
    Object.getOwnPropertySymbols(descs).forEach(sym => fConfigure(ctxt, descs[sym]));
  }
  return Object.defineProperties(to, descs);
}

function closedDescReplicate(ctxt, from, to) {
  return Object.seal(descReplicate(ctxt, from, to));
}

function valueReplicate(ctxt, from, to = {}) {
  return ctxt.fConfigure ? descReplicate(ctxt, from, to) : Object.assign(to, from);
}

function fConfigurable(ctxt, desc) {
  desc.configurable = true;
}

function fNotConfigurable(ctxt, desc) {
  desc.configurable = false;
}

function copy(from, to) {
  return Contexts.copy.replicate(from, to);
}
copy.public = function (from, to) {
  return Contexts.copyPublic.replicate(from, to);
}

function openCopy(from, to) {
  return Contexts.openCopy.replicate(from, to);
}
openCopy.public = function (from, to) {
  return Contexts.openCopyPublic.replicate(from, to);
}

function closedCopy(from, to) {
  return Contexts.closedCopy.replicate(from, to);
}
closedCopy.public = function (from, to) {
  return Contexts.closedCopyPublic.replicate(from, to);
}

function copyValues(from, to) {
  return Contexts.copyValues.replicate(from, to);
}
copyValues.public = function (from, to) {
  return Contexts.copyValuesPublic.replicate(from, to);
}

// WARNING: copyReplicator is a method not a function. 'this' is a context
method(copyReplicator)
function copyReplicator(from, to) {
  return copyOther(this, from, to) || newPrivateSpace.replicate(this, from, copyObject(this, from, to));
}

// WARNING: copyPublicReplicator is a method not a function. 'this' is a context
method(copyPublicReplicator)
function copyPublicReplicator(from, to) {
  return copyOther(this, from, to) || copyObject(this, from, to);
}

function copyOther(ctxt, from, to) {
  if (Array.isArray(from))
    return from.slice(0);
  else if (typeof from !== 'object' || from === null)
    return from;
  if (from.micopy)
    return from.micopy(ctxt);
}

function copyObject(ctxt, from, to) {
  if (!to)
    to = Object.create(Object.getPrototypeOf(from));
  return ctxt.fReplicator(ctxt, from, to);
}

function reverseCopy(a) {
  if (Array.isArray(a))
    return a.slice(0).reverse();
  return copy(a);
}

function clone(from, to) {
  return Contexts.clone.replicate(from, to);
}
clone.public = function (from, to) {
  return Contexts.clonePublic.replicate(from, to);
}

function openClone(from, to) {
  return Contexts.openClone.replicate(from, to);
}
openClone.public = function (from, to) {
  return Contexts.openClonePublic.replicate(from, to);
}
function fCloneConfigurable(ctxt, desc) {
  cloneValue(ctxt, desc);
  fConfigurable(ctxt, desc)
}

function closedClone(from, to) {
  return Contexts.closedClone.replicate(from, to);
}
closedClone.public = function (from, to) {
  return Contexts.closedClonePublic.replicate(from, to);
}
function fCloneNotConfigurable(ctxt, desc) {
  cloneValue(ctxt, desc);
  fConfigurable(ctxt, desc)
}

function cloneValues(from, to) {
  return Contexts.cloneValues.replicate(from, to);
}
cloneValues.public = function (from, to) {
  return Contexts.cloneValuesPublic.replicate(from, to);
}

// WARNING: cloneReplicator is a method not a function. 'this' is a context
method(cloneReplicator);
function cloneReplicator(from, to) {
  return cloneOther(this, from, to) || newPrivateSpace.replicate(this, from, cloneObject(this, from, to));
}

// WARNING: clonePublicReplicator is a method not a function. 'this' is a context
method(clonePublicReplicator);
function clonePublicReplicator(from, to) {
  return cloneOther(this, from, to) || cloneObject(this, from, to);
}

function cloneOther(ctxt, from, to) {
  if (Array.isArray(from))
    return cloneArray(ctxt, from);
  else if (typeof from !== 'object' || from === null)
    return from;
  if (ctxt.cloneMap.has(from))
    return ctxt.cloneMap.get(from);
  if (from.miclone)
    return from.miclone(ctxt);
}

function cloneObject(ctxt, from, to) {
  if (!to)
    to = Object.create(Object.getPrototypeOf(from));
  ctxt.cloneMap.set(from, to);
  return ctxt.fReplicator(ctxt, from, to);
}

function cloneValueReplicate(ctxt, from, to) {
  for (const name in from)
    to[name] = ctxt.replicate(from[name]);
  return to;
}

function cloneValue(ctxt, desc) {
  if (desc.value)
    desc.value = ctxt.replicate(desc.value);
}

function cloneArray(ctxt, ai) {
  const cloneMap = ctxt.cloneMap;
  if (cloneMap.has(ai))
    return cloneMap.get(ai);
  const ao = [];
  cloneMap.set(ai, ao);
  ai.forEach(v => ao.push(ctxt.replicate(v)))
  return ao;
}

// Context objects for each style of replication

const Contexts = {
  get copy() { return copyContext(copyReplicator, cloneReplicator) },
  get copyPublic() { return copyContext(copyPublicReplicator, clonePublicReplicator) },
  get openCopy() { return openCopyContext(copyReplicator, cloneReplicator) },
  get openCopyPublic() { return openCopyContext(copyPublicReplicator, clonePublicReplicator) },
  get closedCopy() { return closedCopyContext(copyReplicator, cloneReplicator) },
  get closedCopyPublic() { return closedCopyContext(copyPublicReplicator, clonePublicReplicator) },
  get copyValues() { return copyValuesContext(copyReplicator, cloneReplicator) },
  get copyValuesPublic() { return copyValuesContext(copyPublicReplicator, clonePublicReplicator) },
  get clone() { return cloneContext(cloneReplicator, copyReplicator) },
  get clonePublic() { return cloneContext(clonePublicReplicator, copyPublicReplicator) },
  get openClone() { return openCloneContext(cloneReplicator, copyReplicator) },
  get openClonePublic() { return openCloneContext(clonePublicReplicator, copyPublicReplicator) },
  get closedClone() { return closedCloneContext(cloneReplicator, copyReplicator) },
  get closedClonePublic() { return closedCloneContext(clonePublicReplicator, copyPublicReplicator) },
  get cloneValues() { return cloneValuesContext(cloneReplicator, copyReplicator) },
  get cloneValuesPublic() { return cloneValuesContext(clonePublicReplicator, copyPublicReplicator) },
}

function copyContext(fReplicate, fCloneReplicate) {
  return {
    replicate: method(fReplicate),
    fReplicator: descReplicate,
    get cloneContext() { return this.__altCtxt__ || (this.__altCtxt__ = cloneContext(fCloneReplicate)) },
  };
}

function openCopyContext(fReplicate, fCloneReplicate) {
  return {
    replicate: method(fReplicate),
    fReplicator: descReplicate,
    fConfigure: fConfigurable,
    get cloneContext() { return this.__altCtxt__ || (this.__altCtxt__ = openCloneContext(fCloneReplicate)) },
  };
}

function closedCopyContext(fReplicate, fCloneReplicate) {
  return {
    replicate: method(fReplicate),
    fReplicator: closedDescReplicate,
    fConfigure: fNotConfigurable,
    get cloneContext() { return this.__altCtxt__ || (this.__altCtxt__ = closedCloneContext(fCloneReplicate)) },
  };
}

function copyValuesContext(fReplicate, fCloneReplicate) {
  return {
    replicate: method(fReplicate),
    fReplicator: valueReplicate,
    get cloneContext() { return this.__altCtxt__ || (this.__altCtxt__ = cloneValuesContext(fCloneReplicate)) },
  };
}

function cloneContext(fReplicate, fCopyReplicate) {
  return {
    replicate: method(fReplicate),
    fReplicator: descReplicate,
    fConfigure: cloneValue,
    get copyContext() { return this.__altCtxt__ || (this.__altCtxt__ = copyContext(fCopyReplicate)) },
    cloneMap: new Map()
  };
}

function openCloneContext(fReplicate, fCopyReplicate) {
  return {
    replicate: method(fReplicate),
    fReplicator: descReplicate,
    fConfigure: fCloneConfigurable,
    get copyContext() { return this.__altCtxt__ || (this.__altCtxt__ = openCopyContext(fCopyReplicate)) },
    cloneMap: new Map()
  };
}

function closedCloneContext(fReplicate, fCopyReplicate) {
  return {
    replicate: method(fReplicate),
    fReplicator: closedDescReplicate,
    fConfigure: fCloneNotConfigurable,
    get copyContext() { return this.__altCtxt__ || (this.__altCtxt__ = closedCopyContext(fCopyReplicate)) },
    cloneMap: new Map()
  };
}

function cloneValuesContext(fReplicate, fCopyReplicate) {
  return {
    replicate: method(fReplicate),
    fReplicator: cloneValueReplicate,
    get copyContext() { return this.__altCtxt__ || (this.__altCtxt__ = copyValuesContext(fCopyReplicate)) },
    cloneMap: new Map()
  };
}
