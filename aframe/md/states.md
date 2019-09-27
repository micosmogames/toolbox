# @micosmo/aframe/states

Aframe system and component to manage the definition of states and the transition between states.

## API

### IMPORTING

```javascript
import '@micosmo/aframe/states';
```

### SYSTEMS

#### states

System that holds the applications state table and contains the methods to transition between states.
 
##### METHODS

Method | Description
------ | -----------
start(state) | Internal method that is called by the *startup* system to initiate the application at the startup state. Calls the *enter* handler for the *state* and emits a *statechanged* event. See [StateChangedObject](#StateChangedObject) for more detail.
chain(state) | Calls the current state's *exit* handler and the *enter* handler for the new *state*. Emits a *statechanged* event for both *exit* and *enter* states.
push(state) | Saves the current state on a stack and calls it's *exit* handler, followed by the *enter* handler for the new *state*.  Emits a *statechanged* event for both *exit* and *enter* states.
pop() | Calls the *exit* handler for the current state, pops the state stack and calls it's *enter* handler.  Emits a *statechanged* event for both *exit* and *enter* states.
pause() | Calls the *pause* handler for the current state. Emits a *statechanged* event for current state *pause*.
resume() | Calls the *resume* handler for the current state. Emits a *statechanged* event for current state *resume*.

##### PROPERTIES

None

### COMPONENTS

#### states

Defines the states that are implemented by component(s) in the same entity definition. Ex. ```states="Loading, MainMenu"```

The *states* component will check each component that is attached to the entity and look for a *State&lt;state&gt;* (i.e. ```StateLoading```) property. The property must be an object with state handler definitions; see [StateObject](#StateObject) for more detail.

##### SCHEMA

Schema is a string value as a comma separated list of state names.

##### METHODS

None

##### PROPERTIES

None

### OBJECTS

#### StateObject

Contains state handlers for implementing state transitions.

##### PROPERTIES

Property | Description
-------- | -----------
enter(state,&nbsp;oldState,&nbsp;how) | A function that implements the transition to *state*. The *exit* handler for *oldState* has already been called. A *statechanged* event will be emitted after *enter*. *how* can be *start*, *chain*, *push* or *pop*. Defaults to the *noop* function.
exit(state,&nbsp;nextState,&nbsp;how) | A function that implements the transition from *state*. The *enter* handler for *nextState* will be called immediately afterwards. A *statechanged* event will be emitted before *exit*. *how* can be *chain*, *push* or *pop*. Defaults to the *noop* function.
pause(state,&nbsp;how) | A function that implements a pause for *state*. A *statechanged* event will be emitted after *pause*. *how* can be *pause*. Defaults to the *noop* function.
resume(state,&nbsp;how) | A function that implements a resume for *state*. A *statechanged* event will be emitted before *resume*. *how* can be *pause*. Defaults to the *noop* function.

#### StateChangedObject

The *statechanged* event detail object.

##### PROPERTIES

Property | Description
-------- | -----------
event | Event name of the form ```<action><state>Event```. Ex. enterLoadingEvent
relatedState | Name of the related state depending on the event context. Fo example *relatedState* will be the next state if *action* is *exit*.
state | Name of the state that event relates to.
action | The name of the *action* being applied to the *state*. One of *enter*, *exit*, *pause* or *resume*.
how | How the event was raised. One of *start*, *chain*, *push*, *pop*, *pause* or *resume*.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
