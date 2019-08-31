# @micosmo/aframe/collider

Generic Aframe system and component for managing object collisions.

## API

### IMPORTING

```javascript
import require('@micosmo/aframe/collider');
```

### SYSTEMS

#### System: collider

Monitors the state of collidable objects and signals events when a collision starts and ends.

##### METHODS

None

##### PROPERTIES

None

### COMPONENTS

#### Component: collider

Defines an entity element as a target for a collision or a candidate for a collision with one or more targets. 

##### SCHEMA

Property | Type | Default | Description
-------- | ---- | ------- | -----------
collideNonVisible | boolean | false | Defines whether the collidable element is visible.
enabled | boolean | true | Defines whether the collider is enabled.
shape | string | 'sphere' | Defines the shape of the collidable area. Must be one of 'sphere' or 'box'.
layer | string | 'default' | The layer within the scene that collisions can occur.
collidesWith | array | [] | A list of zero or more elements that this candidate collider can intersect with. If zero this collider is the target of a collision.

##### METHODS

None

##### PROPERTIES

None

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
