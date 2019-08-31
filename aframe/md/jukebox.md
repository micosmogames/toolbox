# @micosmo/aframe/jukebox

Aframe component that manages background music.

## API

### IMPORTING

```javascript
import '@micosmo/aframe/jukebox';
```

### COMPONENTS

#### Component: jukebox

Background music manager.

##### SCHEMA

Property | Type | Default | Description
-------- | ---- | ------- | -----------
soundComponent | string | 'misound' | The name of the component that manages an individual music track. Must be based on the Micosmo *misound* interface which itself is an extension of the Aframe *sound* component. Must also be defined as an Aframe *multiple* component.
state | string | 'off' | The current operational state of the *jukebox*. Can be one of 'on', 'off' or 'pause'.
tracks | array | [] | Array of sound component ids where each track is defined as *&lt;sound&gt;__&lt;id&gt;*. Optional, and if not provided the *jukebox* will attach all tracks  (sound components) that are defined in the same entity element in the order that are defined. Tracks cannot be modified after the *jukebox* is initialised.
currentTrack | number | 0 | The number of the track (relative to zero) to play. Defaults to the first track when the *jukebox* is switched on.
volume | number | 1 | The volume to play each track. If the volume is set to 1 then the jukebox will default to the volume set for each track.

##### METHODS

None

##### PROPERTIES

None

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
