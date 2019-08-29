import aframe from "aframe";

aframe.registerComponent("start-pool-invisible", {
  // Dependencies must be explicit. Does not support generic multi component name only.
  //    Ex. dependencies: ["pool"] will only match to a component called 'pool'.
  dependencies: ["pool__explosion", "pool__crosshair", "pool__bomber", "pool__smartmissile"],

  init() {
    for (const c of this.el.children) {
      c.setAttribute("visible", false);
    }
  }
});
