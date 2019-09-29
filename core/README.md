# @micosmo/core

The *core* package contains helper objects and functions that extend the core Javascript functionality.

## PREREQUISITES

* An ECAScript 2015 complient Javascript environment

## INSTALLATION

* NPM Package - npm install @micosmo/core

## CONTENTS

### [bind](md/bind.md)

Deprecated module, see [function](#function)

### [character](md/character.md)

Contains character testing services.

### [compare](md/compare.md)

Contains value comparison services.

### [function](md/function.md)

Function related services and utilities, including an alternate bind function that returns the same bound function for the same inputs.

### [method](md/method.md)

Contains a decorator service to promote a function that accepts an object as the first argument to be a method of that object type.

### [number](md/number.md)

Contains a number related services.

### [object](md/object.md)

Object related services and utilities.

### [private](md/private.md)

Create and access a private properties extension of a public object.

### [replicate](md/replicate.md)

Functions for assigning, copying and cloning Javascript objects at both a descriptor and value level.

### [string](md/string.md)

Contains a string building service.

### [time](md/time.md)

Time related services and utilities.

## IMPORTING

The interfaces for all the modules contained in this package have been rolled into the default exports for the package.

```javascript
const core = require('@micosmo/core');
```
or
```javascript
const { copy, method, newPrivateSpace, ... } = require('@micosmo/core');
```

## VERSIONS

* 0.2.0 - Rework of method interface to improve usability. Added object, time & function related services. Object & array pools.
* 0.1.3 - Fix path in md document structure
* 0.1.2 - Fix repository path in package.json. Added *compare*. Fix to *bind*.
* 0.1.1 - Rework of method (see [method](./md/method.md#HISTORY)) and context table fix to replicate
* 0.1.0 - Initial release (DEPRECATED)

## AUTHORS

* Bruce Twite - Initial work

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
