# @micosmo/aframe/startup

Aframe system that manages the dispatching of queued tasks that cannot be performed until the application and aframe elements have been loaded.
Two queues are supported. The *onLoaded* queue is dispatched immediately after the system *loaded* event is received, The second *afterLoaded* queue is dispatched after all the *onLoaded* processing is complete. If 2 or more scenes are loading concurrently then the *onLoaded* and *afterLoaded* queues will only be processed once all scenes have been loaded.

The interface is provided as both exports from the *startup* module or via a system call of the form ```this.el.sceneEl.systems.startup...```

## API

### IMPORTING

```javascript
import { onLoadedDo, afterLoadedDo } from '@micosmo/aframe/startup';
```

### SYSTEMS

#### startup

System that queues the *onLoaded* and *afterLoaded* tasks to be dispatched when a scene or scenes have loaded. If multiple scenes are loaded concurrently then the tasks will be dispatched when the last concurrent scene has loaded. Otherwise multiple scenes will be processed in the order that they are loaded. 

If a task that is dispatched after being queued returns a *Promise* then the *startup* system will wait for the *Promise* to be settled. Promises that are returned from *onLoaded* tasks will be settled before running the *afterLoaded* tasks.

##### METHODS

Method | Description
------ | -----------
onLoadedDo(f) | See *onLoadedDo* export below.
afterLoadedDo(f) | See *afterLoadedDo* export below.

##### EVENTS

Event | Description
----- | -----------
startupComplete | Startup processing and any returned promises have been completed.

### EXPORTS

Function | Description
-------- | -----------
onLoadedDo(f) | The function *f* is queued until the *loaded* event occurs. *f* will be dispatched immediately if the system is loaded. Returns *undefined* if queued and the return value of *f* if dispatched immediately.
afterLoadedDo(f) | The function *f* is queued until the *loaded* event occurs and the *onLoaded* queue is processed. *f* will be dispatched immediately if the system is loaded. Returns *undefined* if queued and the return value of *f* if dispatched immediately.

## HISTORY

### Version 0.1.2
* Extended to support multiple scenes and potentailly concurrent loading of 2 or more scenes.
* Integrated with states system
* Processes tasks asynchronously and will wait for promises returned from any task.
* Change array splice to removeIndex

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
