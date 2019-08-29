/* global THREE */
import aframe from "aframe";
import { bindEvent } from "aframe-event-decorators";
import { isVisibleInScene } from "./lib/utils";

const v1 = new THREE.Vector3();
const v2 = new THREE.Vector3();

const debugMaterial = new THREE.MeshBasicMaterial({
  color: "blue",
  wireframe: true,
  depthTest: false,
  transparent: true
});

aframe.registerSystem("collider", {
  init() {
    this.collisions = new Map();
    this.prevCollisions = new Map();
    this.newCollisions = new Map();

    this.colliders = new Set();
    this.layers = new Map();
  },
  tick(tm, dtm) {
    this.prevCollisions.clear();
    const temp = this.prevCollisions;
    this.prevCollisions = this.collisions;
    this.collisions = temp;

    for (const c1 of this.colliders) {
      const layers = c1.getAttribute("collider").collidesWith;
      for (const layer of layers) {
        if (!this.layers.has(layer)) continue;
        for (const c2 of this.layers.get(layer)) {
          if (c1 !== c2) {
            this.addAnyCollisions(c1, c2);
          }
        }
      }
    }

    // Get newly intersected entities.
    this.newCollisions.clear();
    for (const [c1, cols] of this.collisions) {
      for (const c2 of cols) {
        if (!this.hasCollided(c1, c2, this.prevCollisions)) {
          this.addCollision(c1, c2, this.newCollisions);
          c1.emit("collisionstart", c2);
        }
      }
    }

    // Find collision which have cleared
    for (const [c1, cols] of this.prevCollisions) {
      for (const c2 of cols) {
        if (!this.hasCollided(c1, c2)) {
          c1.emit("collisionend", c2);
        }
      }
    }
  },
  addAnyCollisions(c1, c2) {
    if (
      c1.components === undefined ||
      c1.components.collider === undefined ||
      c2.components === undefined ||
      c2.components.collider === undefined
    ) {
      return;
    } else if (!c1.isPlaying || !c2.isPlaying) {
      return;
    } else if (
      !c1.getAttribute("collider").collideNonVisible &&
      (!isVisibleInScene(c2) || !isVisibleInScene(c1))
    ) {
      return;
    }
    const shape1 = c1.getAttribute("collider").shape;
    const shape2 = c2.getAttribute("collider").shape;
    let isCollided = false;
    if (shape1 === "sphere" && shape2 === "sphere") {
      isCollided = this.collisionSphereSphere(
        c1.components.collider,
        c2.components.collider
      );
    } else if (shape1 === "sphere" && shape2 === "box") {
      isCollided = this.collisionSphereBox(
        c1.components.collider,
        c2.components.collider
      );
    } else if (shape1 === "box" && shape2 === "sphere") {
      isCollided = this.collisionSphereBox(
        c2.components.collider,
        c1.components.collider
      );
    } else if ((shape1 === shape2) === "box") {
      isCollided = this.collisionBoxBox(
        c2.components.collider,
        c1.components.collider
      );
    }

    if (isCollided) {
      this.addCollision(c1, c2);
    }
  },
  addCollision(c1, c2, list = this.collisions) {
    if (!this.collisions.has(c1)) {
      this.collisions.set(c1, new Set());
    }
    this.collisions.get(c1).add(c2);
  },
  hasCollided(collider, other, list = this.collisions) {
    if (list.has(collider) && list.get(collider).has(other)) {
      return true;
    }
    return false;
  },
  collisionSphereSphere: (() => {
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();

    return (sphere1, sphere2) => {
      const s1Pos = sphere1.el.object3D.getWorldPosition(v1);
      const s2Pos = sphere2.el.object3D.getWorldPosition(v2);
      const distance = s1Pos.distanceTo(s2Pos);
      const combinedRadius =
        sphere1.getScaledRadius() + sphere2.getScaledRadius();

      return distance <= combinedRadius;
    };
  })(),
  collisionSphereBox: (() => {
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const v3 = new THREE.Vector3();
    const s = new THREE.Sphere();
    const b = new THREE.Box3();

    return (sphere, box) => {
      const spherePos = sphere.el.object3D.getWorldPosition(v1);
      const sphereRadius = sphere.getScaledRadius();
      s.set(spherePos, sphereRadius);

      const boxPos = box.el.object3D.getWorldPosition(v2);
      const boxSize = box.getScaledDimensions(v3);
      b.setFromCenterAndSize(boxPos, boxSize);

      return b.intersectsSphere(s);
    };
  })(),
  collisionBoxBox: (() => {
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();
    const v3 = new THREE.Vector3();
    const v4 = new THREE.Vector3();
    const b1 = new THREE.Box3();
    const b2 = new THREE.Box3();

    return (box1, box2) => {
      const box1Pos = box1.el.object3D.getWorldPosition(v1);
      const box1Size = box1.getScaledDimensions(v2);
      b1.setFromCenterAndSize(box1Pos, box1Size);

      const box2Pos = box2.el.object3D.getWorldPosition(v3);
      const box2Size = box2.getScaledDimensions(v4);
      b2.setFromCenterAndSize(box2Pos, box2Size);

      return b1.intersectsBox(b2);
    };
  })(),
  addCollider(c, layer) {
    if (!this.layers.has(layer)) {
      this.layers.set(layer, new Set());
    }
    this.layers.get(layer).add(c);
    this.colliders.add(c);
  },
  removeCollider(c, layer) {
    this.layers.get(layer).delete(c);
    this.colliders.delete(c);
  }
});

const shapeNames = ["sphere", "box"];

const shapeSchemas = {
  sphere: {
    radius: { type: "number", default: 1, min: 0 }
  },
  box: {
    width: { type: "number", default: 1, min: 0 },
    height: { type: "number", default: 1, min: 0 },
    depth: { type: "number", default: 1, min: 0 }
  }
};

/**
 * @property {string} objects - Selector of entities to test for collision.
 */
aframe.registerComponent("collider", {
  schema: {
    collideNonVisible: { default: false },
    enabled: { default: true },
    shape: { default: "sphere", oneOf: shapeNames },
    layer: { default: "default" },
    collidesWith: { type: "array" }
  },

  init: function () {
    this._debugMesh = new THREE.Mesh(
      new THREE.SphereGeometry(this.data.radius, 6, 6),
      debugMaterial
    );
    this._debugMesh.visible = false;
    this.el.object3D.add(this._debugMesh);

    if (aframe.INSPECTOR && aframe.INSPECTOR.inspectorActive) {
      this.inspectorEnabled();
    }
  },
  update: function (oldData) {
    if (this.data.layer !== oldData.layer) {
      if (oldData.layer !== undefined) {
        this.system.removeCollider(this.el, oldData.layer);
      }
      this.system.addCollider(this.el, this.data.layer);
    }
  },
  remove: function () {
    this.system.removeCollider(this.el, this.data.layer);
  },
  inspectorenabled: bindEvent(
    { listenIn: "init", removeIn: "remove", target: "a-scene" },
    function () {
      this._debugMesh.visible = true;
      this.rebuildDebugMesh();
    }
  ),
  inspectordisabled: bindEvent(
    { listenIn: "init", removeIn: "remove", target: "a-scene" },
    function () {
      this._debugMesh.visible = false;
    }
  ),
  inspectorcomponentchanged: bindEvent(function () {
    this.rebuildDebugMesh();
  }),
  getScaledRadius: function () {
    const scale = this.el.object3D.getWorldScale(v1);
    return Math.max(scale.x, Math.max(scale.y, scale.z)) * this.data.radius;
  },
  getScaledDimensions: function (target) {
    const scale = this.el.object3D.getWorldScale(v1);
    target
      .set(this.data.width, this.data.height, this.data.depth)
      .multiply(scale);
    return target;
  },
  rebuildDebugMesh: function () {
    if (this.data.shape === "sphere") {
      const scaledRadius = this.getScaledRadius();
      this._debugMesh.geometry = new THREE.SphereGeometry(scaledRadius, 6, 6);
    } else if (this.data.shape === "box") {
      const scaledDimensions = this.getScaledDimensions(v2);
      this._debugMesh.geometry = new THREE.BoxGeometry(
        scaledDimensions.x,
        scaledDimensions.y,
        scaledDimensions.z
      );
    }

    const s = this._debugMesh.scale;
    this.el.object3D.getWorldScale(s);
    s.set(1 / s.x, 1 / s.y, 1 / s.z);
  },
  updateSchema: function (data) {
    const newShape = data.shape;
    const currentShape = this.data && this.data.shape;
    const shape = newShape || currentShape;
    const schema = shapeSchemas[shape];
    if (!schema) {
      console.error("unknown shape: " + shape);
    }
    if (currentShape && newShape === currentShape) return;
    this.extendSchema(schema);
  }
});
