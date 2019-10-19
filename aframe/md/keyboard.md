# @micosmo/aframe/keyboard

Aframe system that initialises a document level keyboard event listeners and dispatches to application component keyboard listeners.

Application components register keyboard event listeners based on a [*keymap*](./keymap.md) component key mappings that are specified in the same Aframe entity element. The *keyboard* system maintains a map of registered event listeners and will dispatch events to component listeners that are contained in visible elements that are not paused.

The *keymap* is repsonsible for defining which physical keys are candidates for use by one or more components in an element. The *keymap* allows each physical key to be assigned a logical name. A physical key can have only one logical name but a logical name can be assigned to one or more physical keys in a single *keymap*. The logical name is optional and will default to the physical key name.

For the most part physical key names are taken from the *event.key* property except for *space*, *alt*, *control* and *shift* which are derived from the *event.keyCode* property. This allows both left and right *alt*, *control* and *shift* keys to be handled as a single keystroke. The *space* key will be represent as 'Space' rather than ' '.

If *alt* or *control* is down for other keys the result will be *Alt-&lt;key&gt;*, *Ctrl-&lt;key&gt;*, or *Alt-Ctrl-&lt;key&gt;*.

## API

### IMPORTING

```javascript
import { addListeners, removeListeners } from '@micosmo/aframe/keyboard';
```

### SYSTEMS

#### keyboard

Responsible for establishing and listening to the document level keyboard events and dispatching events to application components. Maintains a map of application component event listeners.

##### METHODS

Method | Description
------ | -----------
addListeners(comp,&nbsp;...keySpecs) | Registers the key mappings for component *comp* based on the *keySpecs*. Calls *addListeners* function with the *keymap* component that is contained in the same element as *comp*. Throws an error if there is no *keymap* component. *keyspecs* is optional, the remaining parameter list or if a single parameter can be an array of specifications. See [KEYSPECS](#KEYSPECS) for more details.
tryAddListeners(comp,&nbsp;...keySpecs) | Same as *addListeners* but will just return if there is no *keymap* component.
removeListeners(comp,&nbsp;...keys) | Removes the listeners that have been registered for the *comp* for one or more *keys*. *keys* is optional, the remaining parameter list or if a single parameter can be an array of keys. Each key must be a logical key name.

##### PROPERTIES

None

### EXPORTS

Function | Description
-------- | -----------
addListeners(keymap,&nbsp;comp,&nbsp;keySpecs) | Generates a set of key mappings for the component *comp* matching *keyspecs* to key definitions in the supplied *keymap*. If no *keyspecs* are supplied then all key definitions in the *keymap* are mapped. *keySpecs* must be an array of zero or more specifications. See [KEYSPECS](#KEYSPECS) for more details.
removeListeners(keymap,&nbsp;comp,&nbsp;keys) | Removes the key mappings for the component *comp* matching *keys* to key definitions in the supplied *keymap*. If no *keys* are provided then all key definitions in the *keymap* are removed. *keys* must be an array of zero or more logical names.
noVisibilityChecks() | Removes the element visibility check when dispatching key events. A listener will only be inactive if the owning/related component is paused.

### KEYSPECS

Each *keySpec* must be either a string logical key name of an object in the following format:

```javascript
  {
    id: // Logical key name. Required
    keydown: // A handler function for a keydown event. Optional
    keyup: // A handler function for a keyup event. Optional
  }
```

If there is no *keydown* handler specified in the *keySpec* oject then the *keyboard* will first check the component that is registering the listeners, has a method called *keydown_&lt;id&gt;* and if not will then check for a *keydown* method. If neither are present then the *keydown* event is ignored. The same process applies for the *keyup* handler.

#### FILTERING KEY EVENTS

A *keyspec* can have a special *id* of *&lt;filter&gt;*. A *filter* is a *keydown* or *keyup* handler that receives all key events and can perform their own filtering of the events. Note that an associated *keymap* must include *&lt;filter&gt;* as a key mapping. 

## HISTORY

### Version 0.1.2
* Enhanced to support separate keyboards for separate scenes.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
