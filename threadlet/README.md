# @micosmo/threadlet

TO BE COMPLETED


The *ticker* package contains a generic system for managing processes that are dependent on timer events such as occur when animating game play. The system does not implement or assume a particular timer architecture. The system can be plugged into or extended for an existing timer architecture. See the [*@micosmo/ticker/aframe-ticker*](./md/aframe-ticker.md) Aframe system/component that extends this system to hook into the Aframe tick and tock cycles.

The system is made up of two components. The *Ticker* is plugged into the timer event cycle and dispatches zero or more time dependent processes on each tick cycle. A ticker requires only the current time in milliseconds and the delta (also in milliseconds) since the last tick cycle. The ticker system itself does not require the current time to represent a current date/time value, only that a consistent time base is used across all tickers. Multiple tickers can be created allowing each ticker to manage a related set of processes. For example a single ticker can be employed to synchronise sound effects and visual animation. Pausing the ticker pauses the related processes.

The second component is the ticker process. This can simply be a generator function that manages the full life cycle of the process or can be more declarative using a combination of the inbuilt process construction services. A process can be created and started many times although it can only be attached to one ticker at a time. Each process can be assigned a default ticker (or will be assigned the inbuilt *DefaultTicker*), but this may also be overwritten when the process is started. On completion, each process is automatically detached from the ticker. Processes may also be manually stopped which will immediately remove them from the tickers process queue. They also may be individually paused.

## PREREQUISITES

* An ECAScript 2015 complient Javascript environment

## INSTALLATION

* NPM Package - npm install @micosmo/ticker

## IMPORTING

```javascript
// Imports the generic ticker system for integrating into a timer event cycle 
const ticker = require('@micosmo/ticker');
```
or

```javascript
// Imports the Aframe implementation of the ticker system
import ticker from '@micosmo/ticker/aframe-ticker';
```

## CONTENTS

### [ticker](md/ticker.md)

Generic *ticker* system.

### [aframe-ticker](md/aframe-ticker.md)

Aframe *ticker* implementation

## VERSIONS

0.1.0 - Initial release

## AUTHORS

* Bruce Twite - Initial work

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
