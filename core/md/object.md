# @micosmo/core/object

Object related services and utilities.

## API

### IMPORTING

```javascript
var { isClient, ... } = require('@micosmo/core/object');
```

### EXPORTS

#### FUNCTIONS

Function | Description
-------- | -----------
isClient() | Returns *true* if Javascript is running in a client environment.
isGlobalThis(v) | Returns *true* if *v* is a global *this* value. With the introduction of *strict mode*, *undefined* is also considered to be a global *this*.
isServer() | Returns *true* if Javascript is running in a server environment.
requestObject() | Returns the next available object from the object pool. Creates new objects on demand. Assists in minimizing GC processing.
returnObject(o) | Cleans and returns an object to the object pool.
requestArray() | Returns the next available array from the array pool. Creates new arrays on demand. Assists in minimizing GC processing.
returnArray(o) | Cleans and returns an array to the array pool.

#### PROPERTIES

Function | Description
-------- | -----------
globalThis | The global *this* value for the current Javascript environment.

## HISTORY

### Version 0.2.0
* Added object and array pools.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
