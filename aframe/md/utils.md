# @micosmo/aframe/lib/utils

Aframe and threejs utility services

## API

### IMPORTING

```javascript
import { instantiate, ... } from '@micosmo/aframe/lib/utils';
```

### EXPORTS

Function | Description
-------- | -----------
stringifyRotation(r) | Return a string representation of a rotation in either Euler, Matrix4 or Quaternion form.
instantiate(o) | Dynamically instantiate a html snippet and return the root element of the snippet. Currently only supports *o* in string format.
isVisibleInScene(el) | Traverse the parent hierarchy and determine if *el* is visible in the scene. Return a boolean.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
