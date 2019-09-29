/* global THREE */

const degs = rads => rads / Math.PI * 180;
const euler = new THREE.Euler();

export function stringifyRotation(r) {
  if (r.isEuler) {
    euler.set(r.x, r.y, r.z, r.order);
    if (r.order !== "YXZ") {
      euler.reorder("YXZ");
    }
  } else if (r.isMatrix4)
    euler.setFromRotationMatrix(r, "YXZ");
  else if (r.isQuaternion)
    euler.setFromQuaternion(r, "YXZ");
  else
    throw new Error("I don't know what this rotation even is.", r);

  return `${degs(euler.x)} ${degs(euler.y)} ${degs(euler.z)}`;
};

export function instantiate(o) {
  if (typeof o === "string") {
    const el = document.createElement("container");
    el.innerHTML = o;
    return el.firstElementChild;
  }
  throw new Error("Can only instantiate from string for now.");
};

export function isVisibleInScene(el) {
  let iter = el.isObject3D ? el : el.object3D;
  while (iter !== null) {
    if (!iter.visible)
      return false;
    iter = iter.parent;
  }
  return true;
}

export function createSchemaPersistentObject(comp, data, prop) {
  var o = data[prop];
  if (!o) {
    o = {};
    comp.extendSchema({
      [prop]: {
        default: {},
        parse() { return o },
        stringify() { JSON.stringify(o) }
      }
    })
  }
  return o;
}
