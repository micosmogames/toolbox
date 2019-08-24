/*
 *  private.js
 *
 *  Private space management for private object properties.
 *
 *  Warning: Influence instances have their own private and protected scope support. This does not
 *           stop the use of this facility but it is not visible or managed by Influence.
 */
"use strict";

const SpaceMaps = new WeakMap(); // Map of object to privateSpace membership

module.exports = {
  newPrivateSpace
};

function newPrivateSpace() {
  const privateSpace = new WeakMap();
  function fPrivate(o) {
    return privateSpace.get(o) || newPrivateObject(o, privateSpace);
  }
  fPrivate.setObject = function (o, oPrivate) {
    if (oPrivate && privateSpace.has(o))
      privateSpace.set(o, oPrivate);
    else
      oPrivate = newPrivateObject(o, privateSpace, oPrivate);
    return o;
  }
  return fPrivate;
}

function newPrivateObject(o, privateSpace, oPrivate = {}) {
  // Not a member of this private space so will have to add the target object
  // and it's associated new private object, as well as record the private space
  // in the SpaceMaps
  let spaceMap = SpaceMaps.get(o);
  if (!spaceMap)
    SpaceMaps.set(o, (spaceMap = []));
  spaceMap.push(privateSpace);
  privateSpace.set(o, oPrivate);
  return (oPrivate);
}

// Replication of private space objects for this public object

newPrivateSpace.replicate = function(ctxt, from, to) {
  const fSpaceMap = SpaceMaps.get(from);
  if (fSpaceMap) {
    const tSpaceMap = [];
    SpaceMaps.set(to, tSpaceMap);
    fSpaceMap.forEach(ps => {
      tSpaceMap.push(ps);
      ps.set(to, ctxt.replicate(ctxt, ps.get(from)));
    })
  }
  return to;
}
