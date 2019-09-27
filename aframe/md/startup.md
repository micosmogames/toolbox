# @micosmo/aframe/startup

Aframe system that manages the dispatching of queued tasks that cannot be performed until the application and aframe elements have been loaded.
Two queues are supported. The *onLoaded* queue is dispatched immediately after the system *loaded* event is received, The second *afterLoaded* queue is dispatched after all the *onLoaded* processing is complete. If 2 or more scenes are loading concurrently then the *onLoaded* and *afterLoaded* queues will only be processed once all scenes have been loaded.

The *startup* system has no API and purely listens for the *loaded* event. Queueing of tasks is via module exports. A single *startup* component must be included in the scene to nominate the initial state of the game or application. See [states](states.md) for more detail.

## API

### IMPORTING

```javascript
import { onLoadedDo, afterLoadedDo } from '@micosmo/aframe/startup';
```

### COMPONENTS

#### startup

Component that can define an extended name and/or set the startup state for the scene/application.

A single instance of the *startup* component is required specifying the startup state. This can be located in the scene entity.
If an application *name* is also being specified then the *startup* component should appear on the first child entity of the scene.

##### SCHEMA

Additional schema properties only.

Property | Type | Default | Description
-------- | ---- | ------- | -----------
name | string | '' | Optional extended name for the application. Ex. 'Asteroids In Hyperspace'
state | string | 'Loading' | The startup state for the application.

##### METHODS

None

##### PROPERTIES

None

### EXPORTS

Function | Description
-------- | -----------
onLoadedDo(f) | The function *f* is queued until the *loaded* event occurs. *f* will be dispatched immediately if the system is loaded. Returns *undefined* if queued and the return value of *f* if dispatched immediately.
afterLoadedDo(f) | The function *f* is queued until the *loaded* event occurs and the *onLoaded* queue is processed. *f* will be dispatched immediately if the system is loaded. Returns *undefined* if queued and the return value of *f* if dispatched immediately.

## HISTORY

### Version 0.1.2
* Extended to support multiple scenes and potentailly concurrent loading of 2 or more scenes.
* Integrated with states system
* Added startup component that can specify a more detailed application name and the startup state.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
