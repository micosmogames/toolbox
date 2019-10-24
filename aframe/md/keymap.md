# @micosmo/aframe/keymap

Aframe component that defines a set of key mappings where one or more application components in the same entity element require keyboard support. Each application component can register keyboard event listeners for one or more of the mappings defined in the *keymap*. Two or more application components may register the same logical key name, however, each physical key may only have one logical name. This allows the one component to be reconfigured in multiple entity elements avoiding physical key clashes.

## API

### IMPORTING

```javascript
import '@micosmo/aframe/keymap';
```

### COMPONENTS

#### keymap

Responsible for establishing and listening to the document level keyboard events and dispatching events to application components. Maintains a map of application component event listeners.

##### SCHEMA

Property | Type | Default | Description
-------- | ---- | ------- | -----------
schema | String | '' | A list of key mappings of the form '&lt;keyMapping&gt;, ... ' where *&lt;keyMapping&gt;* is either &lt;id&gt;:&lt;key&gt; or &lt;key&gt;. *&lt;id&gt;* is the logical name and *&lt;key&gt;* is the physical key name. Example *'F1,MyKey:Alt-J'*. The physical key name can also be set to *any* which will allow a listener to receive all keystrokes for explicit filtering.

##### METHODS

Method | Description
------ | -----------
addListeners(comp,&nbsp;...keySpecs) | Registers the key mappings for component *comp* based on the *keySpecs*. See [system:keyboard:tryAddListeners](./keyboard.md#METHODS).
removeListeners(comp,&nbsp;...keys) | Removes the listeners that have been registered for the *comp* for one or more *keys*. See [system:keyboard:removeListeners](./keyboard.md#METHODS).
pause() | Pauses all key event listeners for the associated entity element.
play() | Resumes all key event listeners for the associated entity element. Note that this will only apply if the element is visible unless the keyboard *noVisibilityChecks()* function has been called.

##### PROPERTIES

None

### Version 0.1.2
* Changed to use *parseNameValues* to parse key mapping string.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
