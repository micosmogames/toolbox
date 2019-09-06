/* global THREE */

import aframe from "aframe";

const LOADING_MODELS = {};
const MODELS = {};

aframe.registerComponent("gltf-blender-part", {
  schema: {
    buffer: { default: true },
    part: { type: "string" },
    src: { type: "asset" },
    findMesh: { default: true },
    fresh: { default: false }
  },

  init: function() {
    this.chain = Promise.resolve();
  },

  update(oldData) {
    if (oldData.part !== this.data.part || oldData.src !== this.data.src) {
      this.chain = this.chain.then(
        new Promise(resolve => {
          this.getModel(modelPart => {
            if (!modelPart) {
              return;
            }
            this.el.setObject3D("mesh", modelPart);
            // console.log('gltf-blender-part.getModel', this.data.src, this.data.part, this.el);

            if (this.el.components.material !== undefined) {
              modelPart.material = this.el.components.material.material;
            }
            // Becareful as trajectile command expects these events to be bubbled.
            // Handlers of the events will need to discriminate by 'modelPart.name'.
            this.el.emit("model-loaded", { format: "gltf", model: modelPart });
            this.el.emit("object3dset", { type: this.data.findMesh ? 'mesh' : 'part', object: modelPart });
            resolve();
          });
        })
      );
    }
  },

  /**
   * Fetch, cache, and select from GLTF.
   *
   * @returns {object} Selected subset of model.
   */
  getModel: function(cb) {
    if (this.data.fresh) {
      // Always reparse the scene for this object.
      new THREE.GLTFLoader().load(
        this.data.src,
        gltfModel => {
          //          console.log('THREE.GLTFLoader().load: fresh', this.data.src, this.data.part);
          var model = gltfModel.scene || gltfModel.scenes[0];
          const part = this.selectFromModel(model);
          part.__animations = gltfModel.animations;
          cb(part);
          //        console.log('THREE.GLTFLoader().load: end', model);
        },
        undefined,
        err => {
          console.error(`micosmo:compoanent:gltf-blender-part:THREE.GLTFLoader: Failed. Src(${this.data.src}) Part(${this.data.part}) Error(${err})`);
          console.warn(err);
        }
      );
      return;
    }

    // Already parsed, grab it.
    if (MODELS[this.data.src]) {
      cb(this.selectFromModel(MODELS[this.data.src]));
      //  console.log('Already Loaded: end', this.data.src, this.data.part);
      return;
    }

    // Currently loading, wait for it.
    if (LOADING_MODELS[this.data.src]) {
      return LOADING_MODELS[this.data.src].then(model => {
        cb(this.selectFromModel(model));
      //  console.log('Currently Loading: end', this.data.src, this.data.part);
      });
    }

    // Not yet fetching, fetch it.
    LOADING_MODELS[this.data.src] = new Promise(resolve => {
      new THREE.GLTFLoader().load(
        this.data.src,
        gltfModel => {
        //  console.log('THREE.GLTFLoader().load: fetch', this.data.src, this.data.part);
          var model = gltfModel.scene || gltfModel.scenes[0];
          MODELS[this.data.src] = model;
          delete LOADING_MODELS[this.data.src];
          cb(this.selectFromModel(model));
          //  console.log('THREE.GLTFLoader().load: end', gltfModel, model);
          resolve(model);
        },
        undefined,
        err => {
          var msg; // Hello world
          if (err instanceof Error)
            msg = err.message || (err.srcElement && err.srcElement.src) || String(err);
          else
            msg = String(err);
          console.error(`micosmo:component:gltf-blender-part:THREE.GLTFLoader: Failed. Src(${this.data.src}) Part(${this.data.part}) Error(${msg})`);
          console.warn(`micosmo:component:gltf-blender-part:THREE.GLTFLoader: Error`, err);
        }
      );
    });
  },

  /**
   * Search for the part name, look for a mesh, displace the mesh relative to node being searched for
   */
  selectFromModel: function(model) {
    let part, mesh;
    model.traverse(x => {
      if (x.name === this.data.part) part = x;
    });
    if (!part) {
      // console.error("[gltf-part] `" + this.data.part + "` not found in model.");
      return;
    }

    if (this.data.findMesh) {
      mesh = part.getObjectByProperty("type", "Mesh");
      if (!mesh) {
        // console.error(`Couldnt find mesh from part: ${this.data.part}`);
        return;
      }
      mesh = mesh.clone(true);

      mesh.applyMatrix(new THREE.Matrix4());

      if (this.data.buffer) {
        mesh.geometry = mesh.geometry.toNonIndexed();
        return mesh;
      } else {
        mesh.geometry = new THREE.Geometry().fromBufferGeometry(mesh.geometry);
        return mesh;
      }
    } else if (!this.data.fresh) {
      return part.clone(true);
    } else {
      return part;
    }
  }
});
