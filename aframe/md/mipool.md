# @micosmo/aframe/mipool

An extension of the Aframe version 0.9.2 [*pool*](https://aframe.io/docs/0.9.0/components/pool.html) component. Includes additional functionality for setting a maximum pool size for non dynamic just in time expansion, specifying visibility when entity is removed and issuing of events when an entity is created, removed or returned.

## API

### IMPORTING

```javascript
import '@micosmo/aframe/mipool';
```

### COMPONENTS

#### Component: mipool

Extended version of Aframe *pool* component.

##### SCHEMA

Additional and modified schema properties only.

Property | Type | Default | Description
-------- | ---- | ------- | -----------
size | number | 0 | Specifies the initial size of the pool.
maxSize | number | 1 | Optional and specifies the maximum just in time expansion size of the pool. Defaults to *size* if not provided.
poolPolicy | string | 'warn' | Specifies the behaviour of the *requestEntity* method when the pool is empty. Can be set to *dynamic* which will allow the pool to be expanded beyond the maximum size. An error will be thrown if *mipool* detects possible runaway expansion. If set to *warn*, a warning message is written to the log and *requestEntity* returns *undefined*. If set to *error*, an error message is thrown, and if set to *ignore* *requestEntity* just returns *undefined*. Must be oneof *warn*, *error*, *dynamic* or *ignore*.
visible | boolean | true | Specifies the visilibity of the entity when *requestEntity* removes it from the pool.
dynamic | boolean | false | **This property has been incorporated into *poolPolicy* and has been removed**.

##### METHODS

None

##### PROPERTIES

None

##### EVENTS

Event | Detail | Bubbles | Description
----- | ------ | ------- | -----------
pool-add | None | No | Is emitted to the entity when the entity is first added to the pool. Is emitted prior to the *pause* method call.
pool-remove | None | No | Is emitted to the entity each time the entity is removed from the pool. Is emitted prior to the *play* method call.
pool-return | None | no | Is emitted to the entity each time the entity is returned to the pool. Is emitted prior to the *pause* method call.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
