# @micosmo/toolbox

The *toolbox* library contains a number of helper objects and functions that enhance or extend core Javascript functionality.

## PREREQUISITES

* An ECAScript 2015 complient Javascript environment

## INSTALLATION

* NPM Package - `npm install @micosmo/toolbox'

## HELPER OBJECTS & FUNCTIONS

### [private](./md/private.md)

Create and access a private properties extension of a public object.

### [replicate](./md/replicate.md)

String building object that efficiently handles the segmented construction of large strings.

### [method](./md/method.md)

Decorator service to promote a function that accepts an object as the first argument to be a method of that object type.

### [StringBuilder](./md/StringBuilder.md)

String building object that efficiently handles the segmented construction of large strings.

### IMPORTING

The interfaces for all the modules contained in this package have been rolled into the default exports for the package.

```javascript
const tb = require('@micosmo/toolbox');
```
or
```javascript
const { copy, method, newPrivateSpace, ... } = require('@micosmo/toolbox');
```

## CONTRIBUTING

TBC

## VERSIONS

0.1.0 - Initial release

## AUTHORS

* Bruce Twite - Initial work

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
