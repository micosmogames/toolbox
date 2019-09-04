/*
 * mipool.js
 *
 * An extended version of the Aframe 0.9.2 pool component.
 */
import aframe from "aframe";

/**
 * Pool component to reuse entities.
 * Avoids creating and destroying the same kind of entities.
 * Helps reduce GC pauses. For example in a game to reuse enemies entities.
 *
 * @member {array} availableEls - Available entities in the pool.
 * @member {array} usedEls - Entities of the pool in use.
 */
aframe.registerComponent('mipool', {
  schema: {
    container: { default: '' },
    mixin: { default: '' },
    size: { default: 0 },
    maxSize: { default: 1 },
    poolPolicy: { default: 'warn', oneof: ['warn', 'error', 'dynamic', 'ignore'] },
    visible: { default: true } // Visibility of the a requested entity
  },

  multiple: true,

  init() {
    this.size = 0;
  },

  initPool: function () {
    this.availableEls = [];
    this.usedEls = [];

    if (!this.data.mixin)
      console.warn('micosmo:component:mipool:initPool No mixin provided for pool component.');
    if (this.data.container) {
      this.container = document.querySelector(this.data.container);
      if (!this.container)
        console.warn('micosmo:component:mipool:initPool Container ' + this.data.container + ' not found.');
    }
    this.container = this.container || this.el;

    while (this.size < this.data.size)
      this.createEntity();
  },

  update: function (oldData) {
    var data = this.data;
    if (oldData.mixin !== data.mixin || oldData.size !== data.size) {
      this.initPool();
    }
  },

  /**
   * Add a new entity to the list of available entities.
   */
  createEntity: function () {
    var el;
    el = document.createElement('a-entity');
    el.play = this.wrapPlay(el.play);
    el.setAttribute('mixin', this.data.mixin);
    el.object3D.visible = false;
    el.emit('pool-add', undefined, false);
    el.pause();
    this.container.appendChild(el);
    this.availableEls.push(el);
    this.size++;
  },

  /**
   * Play wrapper for pooled entities. When pausing and playing a scene, don't want to play
   * entities that are not in use.
   */
  wrapPlay: function (playMethod) {
    var usedEls = this.usedEls;
    return function () {
      if (usedEls.indexOf(this) === -1) { return; }
      playMethod.call(this);
    };
  },

  /**
   * Used to request one of the available entities of the pool.
   */
  requestEntity: function () {
    var el;
    if (this.availableEls.length === 0) {
      if (this.size < this.data.maxSize)
        this.createEntity();
      else if (this.data.poolPolicy === 'dynamic') {
        if (this.state.size >= this.state.maxSize * 2) {
          console.warn(`micosmo:component:mipool:requestEntity: Pool(${this.attrName}) is empty. Possible runaway dynamic expansion`);
          return;
        }
        console.warn(`micosmo:component:mipool:requestEntity: Pool(${this.attrName}) is empty. Dynamically expanding`);
        this.createEntity();
      } else if (this.data.poolPolicy === 'ignore')
        return;
      else if (this.data.poolPolicy === 'warn') {
        console.warn(`micosmo:component:mipool:requestEntity: Pool(${this.attrName}) is empty. Cannot expand`);
        return;
      } else if (this.data.poolPolicy === 'error')
        throw new Error(`micosmo:component:mipool:requestEntity: Pool(${this.attrName}) is empty. Cannot expand`);
    }
    el = this.availableEls.shift();
    el.emit('pool-remove', undefined, false);
    this.usedEls.push(el);
    el.object3D.visible = this.data.visible;
    return el;
  },

  /**
   * Used to return a used entity to the pool.
   */
  returnEntity: function (el) {
    var index = this.usedEls.indexOf(el);
    if (index === -1) {
      console.warn('micosmo:component:mipool:returnEntity: The returned entity was not previously pooled from ' + this.attrName);
      return;
    }
    this.usedEls.splice(index, 1);
    this.availableEls.push(el);
    el.object3D.visible = false;
    el.emit('pool-return', undefined, false);
    el.pause();
    return el;
  }
});
