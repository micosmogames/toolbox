/* global THREE */

const degs = rads => rads / Math.PI * 180;

const euler = new THREE.Euler();
const stringifyRotation = r => {
  if (r.isEuler) {
    euler.set(r.x, r.y, r.z, r.order);
    if (r.order !== "YXZ") {
      euler.reorder("YXZ");
    }
  } else if (r.isMatrix4) {
    euler.setFromRotationMatrix(r, "YXZ");
  } else if (r.isQuaternion) {
    euler.setFromQuaternion(r, "YXZ");
  } else {
    throw new Error("I don't know what this rotation even is.", r);
  }

  return `${degs(euler.x)} ${degs(euler.y)} ${degs(euler.z)}`;
};

const instantiate = o => {
  if (typeof o === "string") {
    const el = document.createElement("container");
    el.innerHTML = o;
    return el.firstElementChild;
  } else {
    throw new Error("Can only instantiate  from string for now.");
  }
};

const randomInt = (x1, x2) => {
  const delta = Math.abs(x2 - x1);
  const r = Math.random() * (delta + 1);
  const ri = Math.trunc(r);
  return ri + Math.min(x1, x2);
};

const Transform = el => {
  function applyTranslation() {
    const p = el.object3D.position.clone().multiply(el.object3D.scale);
    Array.from(el.getChildEntities()).forEach(child => {
      child.object3D.position.add(p);
      child.setAttribute("position", child.object3D.position);
    });
    el.setAttribute("position", "0 0 0");
  }

  function applyRotation() {
    const r = el.object3D.quaternion;
    Array.from(el.getChildEntities()).forEach(child => {
      child.object3D.quaternion.premultiply(r);
      child.setAttribute("rotation", child.object3D.rotation);
    });
    el.setAttribute("rotation", "0 0 0");
  }

  function applyScale() {
    const s = el.object3D.scale;
    Array.from(el.getChildEntities()).forEach(child => {
      child.object3D.scale.multiply(s);
      child.object3D.position.multiply(s);
      child.setAttribute("scale", child.object3D.scale);
    });
    el.setAttribute("scale", "1 1 1");
  }

  function applyAll() {
    applyScale();
    applyTranslation();
    applyRotation();
  }

  return {
    applyTranslation,
    applyRotation,
    applyScale,
    applyAll
  };
};

function isVisibleInScene(o) {
  let iter = o.isObject3D ? o : o.object3D;
  while (iter !== null) {
    if (!iter.visible) {
      return false;
    }
    iter = iter.parent;
  }
  return true;
}

window.Transform = Transform;

export {
  stringifyRotation,
  instantiate,
  randomInt,
  Transform,
  isVisibleInScene
};
