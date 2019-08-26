import aframe from "aframe";

aframe.registerComponent("gamma", {
  schema: { default: false },
  update() {
    this.el.sceneEl.renderer.gammaOutput = this.data;
  }
});
