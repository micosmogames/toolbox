/*
 * index.js
 *
 * Answers all the exported core functions and objects
 */
"use strict";

Object.assign(module.exports,
  require('./object'),
  require('./replicate'),
  require('./private'),
  require('./method'),
  require('./string'),
  require('./character'),
  require('./number'),
  require('./compare'),
  require('./time'),
  require('./function')
);
