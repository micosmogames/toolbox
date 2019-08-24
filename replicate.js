/*
 *  replicate.js
 *
 *  Services to assign, copy and clone objects at either a value or descriptor level.
 *  Is also integrated with private spaces to allow private properties to be assigned copied or
 *  cloned.
 */
"use strict";

var { newPrivateSpace } = require('./private');

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
  return copyReplicator({
    replicate: copyReplicator,
    fReplicator: descReplicate,
  }, from, to);
}
copy.public = function (from, to) {
  return copyPublicReplicator({
    replicate: copyPublicReplicator,
    fReplicator: descReplicate,
  }, from, to);
}

function openCopy(from, to) {
  return copyReplicator({
    replicate: copyReplicator,
    fReplicator: descReplicate,
    fConfigure: fConfigurable
  }, from, to);
}
openCopy.public = function (from, to) {
  return copyPublicReplicator({
    replicate: copyPublicReplicator,
    fReplicator: descReplicate,
    fConfigure: fConfigurable
  }, from, to);
}

function closedCopy(from, to) {
  return copyReplicator({
    replicate: copyReplicator,
    fReplicator: closedDescReplicate,
    fConfigure: fNotConfigurable
  }, from, to);
}
closedCopy.public = function (from, to) {
  return copyPublicReplicator({
    replicate: copyPublicReplicator,
    fReplicator: closedDescReplicate,
    fConfigure: fNotConfigurable
  }, from, to);
}

function copyValues(from, to) {
  return copyReplicator({
    replicate: copyReplicator,
    fReplicator: valueReplicate,
  }, from, to);
}
copyValues.public = function (from, to) {
  return copyPublicReplicator({
    replicate: copyPublicReplicator,
    fReplicator: valueReplicate,
  }, from, to);
}

function copyReplicator(ctxt, from, to) {
  return copyOther(ctxt, from, to) || newPrivateSpace.replicate(ctxt, from, copyObject(ctxt, from, to));
}

function copyPublicReplicator(ctxt, from, to) {
  return copyOther(ctxt, from, to) || copyObject(ctxt, from, to);
}

function copyOther(ctxt, from, to) {
  if (Array.isArray(from))
    return from.slice(0);
  else if (typeof from !== 'object')
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
  return cloneReplicator({
    replicate: cloneReplicator,
    fReplicator: descReplicate,
    fConfigure: cloneValue,
    cloneMap: new Map()
  }, from, to);
}
clone.public = function (from, to) {
  return clonePublicReplicator({
    replicate: clonePublicReplicator,
    fReplicator: descReplicate,
    fConfigure: cloneValue,
    cloneMap: new Map()
  }, from, to);
}

function openClone(from, to) {
  return cloneReplicator({
    replicate: cloneReplicator,
    fReplicator: descReplicate,
    fConfigure: fCloneConfigurable,
    cloneMap: new Map()
  }, from, to);
}
openClone.public = function (from, to) {
  return clonePublicReplicator({
    replicate: clonePublicReplicator,
    fReplicator: descReplicate,
    fConfigure: fCloneConfigurable,
    cloneMap: new Map()
  }, from, to);
}
function fCloneConfigurable(ctxt, desc) {
  cloneValue(ctxt, desc);
  fConfigurable(ctxt, desc)
}

function closedClone(from, to) {
  return cloneReplicator({
    replicate: cloneReplicator,
    fReplicator: closedDescReplicate,
    fConfigure: fCloneNotConfigurable,
    cloneMap: new Map()
  }, from, to);
}
closedClone.public = function (from, to) {
  return clonePublicReplicator({
    replicate: clonePublicReplicator,
    fReplicator: closedDescReplicate,
    fConfigure: fCloneNotConfigurable,
    cloneMap: new Map()
  }, from, to);
}
function fCloneNotConfigurable(ctxt, desc) {
  cloneValue(ctxt, desc);
  fConfigurable(ctxt, desc)
}

function cloneValues(from, to) {
  return cloneReplicator({
    replicate: cloneReplicator,
    fReplicator: cloneValueReplicate,
    cloneMap: new Map()
  }, from, to);
}
cloneValues.public = function (from, to) {
  return clonePublicReplicator({
    replicate: clonePublicReplicator,
    fReplicator: cloneValueReplicate,
    cloneMap: new Map()
  }, from, to);
}

function cloneReplicator(ctxt, from, to) {
  return cloneOther(ctxt, from, to) || newPrivateSpace.replicate(ctxt, from, cloneObject(ctxt, from, to));
}

function clonePublicReplicator(ctxt, from, to) {
  return cloneOther(ctxt, from, to) || cloneObject(ctxt, from, to);
}

function cloneOther(ctxt, from, to) {
  if (Array.isArray(from))
    return cloneArray(ctxt, from);
  else if (typeof from !== 'object')
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
    to[name] = ctxt.replicate(ctxt, from[name]);
  return to;
}

function cloneValue(ctxt, desc) {
  if (desc.value)
    desc.value = ctxt.replicate(ctxt, desc.value);
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
