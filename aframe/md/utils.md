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
createSchemaPersistentObject(comp,&nbsp;data,&nbsp;propName) | Update the component *comp* schema to include a new property *propName* that is attached to a persistent object value. This mechanism allows internal state objects to be anchored to the schema data. Can only be called from the *updateSchema(data)* method of a component where Aframe will pass *data* as the new schema property values for the component. *updateSchema* is called before *init* and *update*, hence the injected property *propName* and it's object value will exist prior to the initialisation of the component and can be accessed by ```this.data.<propName>```. *propName* will be displayed in the Aframe inspector however the Inspector does call the *stringify* method for *propName* and only displays a value of ```[object Object]```. The stringified object value can be seen if you bring up the tool tip display by rolling the mouse pointer over *propName* in the Inspector. Returns the persistent object value of *propName*.

## HISTORY

### Version 0.1.2
* Added createSchemaPersistentObject.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
