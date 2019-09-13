# @micosmo/core/object

Object related services and utilities.

## API

### IMPORTING

```javascript
var { isaGenerator, ... } = require('@micosmo/core/object');
```

### EXPORTS

#### FUNCTIONS

Function | Description
-------- | -----------
globalThis | Returns the global *this* value for the current Javascript environment.
isaGenerator(o) | Returns *true* if *o* is a GeneratorFunction iterator (Generator).
isaGeneratorFunction(f) | Returns *true* if *f* is a GeneratorFunction.
isClient() | Returns *true* if Javascript is running in a client environment.
isGlobalThis(v) | Returns *true* if *v* is a global *this* value. With the introduction of *strict mode*, *undefined* is also considered to be a global *this*.
isServer() | Returns *true* if Javascript is running in a server environment.
peekTimer(timer) | Returns the timer interval since *timer* started in millisconds with microsecond precision where supported.
peekTimers(...timers) | Returns an array with the timer interval for each timer in *timers*. Undefined timers will have a *0* result.
startTimer() | Returns a timer reference point for calculating timer intervals up to microsecond precision. Environment dependent.

#### PROPERTIES

  None

## HISTORY

### Version 0.2.0
* Added peekTimers.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
