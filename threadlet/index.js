/*
 * index.js
 *
 * Answers threadlet.
 */
"use strict";

Object.assign(module.exports,
  require('./threadlet'),
  require('./threadable'),
  require('./LazyPromise')
);