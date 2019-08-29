// Replace the default window Transform

export const Transform = el => {
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

window.Transform = Transform;
