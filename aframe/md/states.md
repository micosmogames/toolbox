# @micosmo/aframe/states

Aframe component that provides light-weight management for the definition of and the transition between states. A scene can have mulitple *states* components that define different levels of state management. The *states* component is also a *multiple* component allowing an id to be assigned and mulitple occurrences on the one element.

State transitions are initiated via direct calls to the required *states* component and transitions are notified by specific event names that are allocated to each component. States can be implemented in a loosely or tightly coupled manner with specific events types for handling the entry and exit to and from a state, as well as a generic state changed event type. Transitions can be either chained or stacked allowing a caller to transition to a new state that will later return to the previous state.

## API

### IMPORTING

```javascript
import '@micosmo/aframe/states';
```

### COMPONENTS

#### states

Component that that manages the transitions for a specific list of states.

##### SCHEMA

Property | Type | Default | Description
-------- | ---- | ------- | -----------
list | array | [] | A list of one or more state names that are managed by the component. Required.
dispersePattern | string | '%A%S' | A pattern that defines how a method name is formed by the *disperseEvent* function that is provided in the [EventDetail](#EventDetail). The *disperseEvent* function can be optionally called within the change event that is emitted by the *states* component. *%A* will be substituted with the event action and *%S* will be substituted with the event state. At least one of *%A* or *%S* must be provided in the pattern.
changeEvent | string | 'statechanged' | The name of the event that is to be emitted when the state has changed. See [EventDetail](#EventDetail) for details on the event detail object.

##### METHODS

Method | Description
------ | -----------
chain(state[,&nbsp;fromCtxt[,&nbsp;toCtxt]]) | Emit *exit* event for the current state, followed by *enter* event for the new *state*. Finally *statechanged* event is emitted. The exit event will not be emitted if there is no current state, which will be the case on the first *chain* call.
call(state[,&nbsp;fromCtxt[,&nbsp;toCtxt]]) | As for *chain* except that current state is pushed onto the state stack.
return([fromCtxt[,&nbsp;toCtxt[,&nbsp;state]]]) | As for *chain* except that the new state is popped from the state stack.

##### PROPERTIES

None

### OBJECTS

#### EventDetail

Event detail object.

##### PROPERTIES

Property | Description
-------- | -----------
fromState | Name of the state that we are transitioning from. This will be *undefined* if there is no *fromState*.
toState | Name of the state that we are transitioning to.
how | How the event was raised. One of *chain*, *push*, *pop*.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
