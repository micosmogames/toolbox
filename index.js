/*
 * index.js
 *
 * Answers all the exported functions from the Toolbox.
 */
"use strict";

Object.assign(module.exports,
  require('./replicate'),
  require('./private'),
  require('./method'),
  require('./StringBuilder'));
