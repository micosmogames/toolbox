/*
 * index.js
 *
 * Answers all the exported core functions and objects
 */
"use strict";

Object.assign(module.exports,
  require('./replicate'),
  require('./private'),
  require('./method'),
  require('./bind'),
  require('./string'),
  require('./character'),
);
