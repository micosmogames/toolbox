# @micosmo/aframe/misound

An extension of the Aframe version 0.9.2 [*sound*](https://aframe.io/docs/0.9.0/components/sound.html) component. Includes additional functionality for repeating a sound, fading in and fading out, warping and setting playback rate, setting a starting offset and dynamic adjustment of the pool size. Also now supports pause and resume of playback, policy setting for pool handling and fixed some issues with THREE.Audio interaction.

## API

### IMPORTING

```javascript
import '@micosmo/aframe/misound';
```

### COMPONENTS

#### misound

Extended version of Aframe *sound* component.

##### SCHEMA

Additional schema properties only.

Property | Type | Default | Description
-------- | ---- | ------- | -----------
fadeIn | array | [] | Sound has a fade in volume effect. Requires an array containing the *offset* in seconds where the effect starts, *duration* in seconds of the effect, *startVolume* as a proportion of the current assigned volume, and the *targetVolume* as a proportion of the current assigned volume. *offset* must be provided, but the other array elements are optional. *duration* defaults to 0 meaning effect is applied for the remainder of the sound, *startVolume* defaults to 0 and *targetVolume* defaults to 1.
fadeOut | array | [] | As for *fadeIn* except that a fade out volume effect is applied. The *startVolume* array element defaults to 1 and *targetVolume* defaults to 0.
maxPoolSize | number | 1 | Sets the maximum number of *THREE.Audio* objects that can be attached to this *misound*. If *poolSize* property is less then *maxPoolSize* then *misound* will dynamically increase the pool.
offset | number | 0 | Sets the starting position for playback.
pausePolicy | string | 'pause' | Specifies the behaviour of the *misound* component when Aframe calls the *pause* method. The Aframe *sound* component stops the sound and *misound* pauses the sound as the default. The *pausePolicy* can be set to *stop* to be consistent with *sound*. Must be one of *pause* or *stop*.
playbackRate | number | 1 | Specifies the playback rate of the sound as a proportion of the normal rate, where *1* reperesents the sounds normal playback rate.
poolPolicy | string | 'warn' | Specifies the behaviour of the *playSound* method when all the *audio* objects within the pool (that cannot be increased any further) are playing. The default behaviour is to issue a warning to the log and ignore the request. The policy provides alternative options to either throw an error, discard the longest playing *audio* object in order to satisfy the new request or ignore the play request without a warning. Must be one of *warn*, *error*, *discard* or *ignore*.
repeat | array | [] | Specifies the number of times the *audio* will be repeated for each play request and optionally the interval between repeats. The array contains the *count*  number of repeats and an optional *interval* is the wait interval between repeats expressed in milliseconds. *count* is required and *interval* defaults to 0.
_state | internal | None | The *misound* component utilizes a two level data architecture where some schema properties are considered as defaults (in this case *volume* & *playbackRate*). A separate *state* object contains the current values which are modified via method calls to *misound* instances. The *setAttribute* method is only called to change the default value which is applied when an *undefined* value is set. This internal property allows the contents of the *state* object to be *stringified* for display in the browser's inspector.

##### METHODS

New or substantially modified methods only.

Method | Description
------ | -----------
resumeSound() | Resume a sound that has been paused. Does nothing if the sound is not currently paused. Note that *play* will also resume a sound that has been paused.
playSound() | Extended to initiate a ticker process to fade in or fade out. If both are specified, than fade in takes precedence. Will also initiate ticker processes to manage the repeating of a sound. In this case the fade in will only applied to the first repeat and the fade out to the last repeat.
getPlaybackRate() | Returns the current playback rate.
setPlaybackRate(rate) | Sets a new playback rate that is applied to all *audio* objects. If *rate* is *undefined* then the schema default *playbackRate* is applied.
getVolume() | Returns the current volume.
setVolume(v) | Set a new volume that is applied to all *audio* objects. If *v* is *undefined* then that schema default *volume* is applied.
getDuration() | Returns the total duration of the underlying *audio*.
warpInStep(s,&nbsp;targetRate) | Returns a ticker process step that applies a playback rate warp in effect over *s* seconds to the *targetRate*. If the *targetRate* is less than the current playback rate then a *warpOutStep* is returned.
warpOutStep(s,&nbsp;targetRate) | Returns a ticker process step that applies a playback rate warp out effect over *s* seconds to the *targetRate*. If the *targetRate* is greater than the current playback rate then a *warpInStep* is returned.
warpIn(s,&nbsp;targetRate) | Starts a ticker process on a *warpInStep* using the *misound* instance's assigned ticker.
warpOut(s,&nbsp;targetRate) | Starts a ticker process on a *warpOutStep* using the *misound* instance's assigned ticker.
    
##### PROPERTIES

None

#### NOTES

1. The *misound* component is integrated with the *mipool* component which will issue *pool-add*, *pool-remove* and *pool-return* events, listening for *pool-return* events and on firing will stop this *misound* component instance. This provides an alternative method for handling the state of pooled components where the paused state within a pool is handled differently to the paused state within the application.
2. The *sound-ended* event is now emitted whenever the sound goes from a playing/paused state to a stopped state. The event *detail* includes a *reason* property that will contain a string of either *end* or *stop*. *stop* indicates that the sound has been manually stopped by a call to the *stopSound* method.
3. The *fadeIn* effect takes precedence over *fadeOut* if both are specified. If the *misound* configuration also includes a *repeat* then the *fadeIn* effect will apply to the first occurence and *fadeOut* to the last.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
