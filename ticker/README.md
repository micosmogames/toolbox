# @micosmo/ticker

The *ticker* package contains a generic system for managing processes that are dependent on timer events such as occur when animating game play. The system does not implement or assume a particular timer architecture. The system can be plugged into or extended for an existing timer architecture. See the [*@micosmo/aframe/components/ticker*](https://github.com/micosmogames/aframe/blob/master/components/md/ticker.md) Aframe component that extends this system to hook into the Aframe tick and tock cycles.

The system is made up of two components. The *Ticker* is plugged into the timer event cycle and dispatches zero or more time dependent processes on each tick cycle. A ticker requires only the current time in milliseconds and the delta (also in milliseconds) since the last tick cycle. Tke ticker system itself does not require the current time to represent a current date/time value, only that a consistent time base is used across all tickers. Multiple tickers can be created allowing each ticker to manage a related set of processes. For example a single ticker can be employed to synchronise sound effects and animation. Pausing the ticker pauses the related processes.

The second component is the ticker process. This can simply be a generator function that manages the full life cycle of the process or can be more declarative using a combination of the inbuilt process construction services. A process can be created and started many times although it can only be attached to one ticker at a time. Each process can be assigned a default ticker (or will be assigned the inbuilt *DefaultTicker*), but this may also be overwritten when the process is started. On completion, each process is automatically detached from the ticker. Processes may also be manually stopped which will immediately remove them from the tickers process queue. They also may be individually paused.

## PREREQUISITES

* An ECAScript 2015 complient Javascript environment

## INSTALLATION

* NPM Package - `npm install @micosmo/ticker'

## API

### IMPORTING

```javascript
const ticker = require('@micosmo/ticker');
```
or
```javascript
const { Ticker, startProcess, ... } = require('@micosmo/ticker');
```

### OBJECTS

#### Object: Ticker

##### COMPOSERS

Export | Description
-------- | -----------
Ticker(name) | Returns a new started Ticker object with the specified *name*. The *name* parameter is required.

##### METHODS

Method | Description
------ | -----------
assignAsDefaultTo(...processes) | The Ticker is assigned as the default Ticker for the specified processes. The *processes* parameter may be a single array of processes or one or more processes in the parameter list. Returns the Ticker.
isPaused() | Returns a boolean value indicating if the Ticker has been stopped or paused.
isRunning() | Returns a boolean value indicating if the Ticker is running.
pause() | The Ticker is paused and ignores tick cycles. The process queue is suspended. Returns *false* if the Ticker is not running, otherwise *true*.
start() | The Ticker is started and the process queued is reactivated. Returns *false* if the Ticker is running, otherwise *true*.
stop() | The Ticker process queue is cleared and the Ticker is paused. Returns *false* if the Ticker was not running, otherwise *true*. 

##### PROPERTIES

Property | Description
-------- | -----------
isaTicker | Set to *true* indicating the object is a Ticker.
name | The name of the Ticker.

#### Object: Ticker Process

##### COMPOSERS

Export | Description
-------- | -----------
createProcess(onTick[,&nbsp;ticker]) | Returns a new Ticker process that has a default Ticker of *ticker* or *DefaultTicker* if the *ticker* parameter has not been provided. The *onTick* parameter is the process function. All function types are supported. See [RETURN-CODES](#RETURN-CODES) for a list of codes that can be returned from the *onTick* function. The process is not started. 
createProcess(cfg) | As per above except the Ticker process is defined by a configuration object. See [CONFIGURATION-OBJECT](#CONFIGURATION-OBJECT) for more detail.
startProcess(onTick[,&nbsp;ticker]) | Returns a new Ticker process that has been started on *ticker* or the *DefaultTicker* if the *ticker* parameter has not been provided. The *onTick* parameter is the process function. All function types are supported. See [RETURN-CODES](#RETURN-CODES) for a list of codes that can be returned from the *onTick* function.
startProcess(cfg) | As per above except the Ticker process is defined by a configuration object. See [CONFIGURATION-OBJECT](#CONFIGURATION-OBJECT) for more detail.

##### METHODS

Method | Description
------ | -----------
isAttached() | Returns a boolean indicating if the process is attached to a Ticker.
isPaused() | Returns a boolean indicating if the process is currently paused.
pause() | The process is paused and ignores tick cycles. Returns the process.
resume() | The process is resumed from a pause. Returns the process.
start([ticker]) | The process is attached to the *ticker* or if not provided the processes default Ticker and started. Returns the process.
stop() | If attached, the process is immediately detached from it's Ticker. If the process has an *onEnd* function then this will be passed a reason code of *stop*. Returns the process. 

##### PROPERTIES

Property | Description
-------- | -----------
isaProcess | Set to *true* indicating the object is a Ticker process.
name | The name of the Ticker process. If not provided will be set to *&lt;anonymous&gt;*.

### EXPORTS

#### FUNCTIONS

Function | Description
-------- | -----------
iterator(...af), | Creates an iterating Ticker process step that will perform each function in the *af* list in sequence. Each _f_ of *af* must return a *done* response to trigger the next *f* to be dispatched. The *af* parameter may be a single array of functions, or one or more functions in the parameter list.
looper(count,&nbsp;f) | Creates a looping Ticker process step that will execute the function *f count* times. Note that *count* does not refer to the number of timer tick cycles. The function *f* must return a *done* response to trigger the next loop iteration.
timer(s,&nbsp;f) | Creates a timer Ticker process step that will execute the function *f* for *s* seconds. The function _f_ can interrupt the timer by returning a *done* reponse. An error will occur if *s* is greater than 50 assuming that the interval may be specified in milliseconds. Use *sTimer* instead.
sTimer(s,&nbsp;f) | Same as *timer* except larger intervals can be specified.
msTimer(ms,&nbsp;f) | Same as *timer* except the timer interval is expressed in milliseconds.
waiter(s[,&nbsp;f]), | Creates a waiting Ticker process step that will wait for *s* seconds and then dispatch the *f* function if provided. An error will occur if *s* is greater than 50 assuming that the interval may be specified in milliseconds. Use *sWaiter* instead.
sWaiter(s[,&nbsp;f]) | Same as *waiter* except larger intervals can be specified.
msWaiter(ms[,&nbsp;f]) | Same as *waiter* except the timer interval is expressed in milliseconds.

#### PROPERTIES

Property | Description
-------- | -----------
DefaultTicker | The default Ticker.

### CONFIGURATION-OBJECT

The *startProcess*/*createProcess* configuration object provides additional input properties to setup a Ticker process.

Property | Description
-------- | -----------
name | The name to be associated with the process. Optional, defaults to *&lt;anonymous&gt;*.
onTick | The function or generator function that is to be dispatched on each tick cycle. A function will be passed up to 3 parameters, *tm* is the current time, *dt* is delta from the last tick cycle and *data* is additional information depending on the call. For *looper* *data* is the iteration number and for *timer* *data* is the remaining time. Generator functions receive a *state* parameter when initialised that contains *tm*, *dt* and *data* properties. These properties are updated prior to each *next()* call. See [RETURN-CODES](#RETURN-CODES) for a list of return codes. Required.
onEnd | Standard function that is always dispatched at end of the Ticker process, regardless of how the process is ended. Two parameters are passed, *rsn* is the reason code (*done*, *stop* or *timeout*) for how the process ended, and *process* is the reference to the Ticker process that has ended. Optional.
msTimeout | Ticker process level timeout period expressed in milliseconds. Optional.
sTimeout | Ticker process level timeout period expressed in seconds. Optional.
ticker | Ticker that is to assign as the default Ticker for this process. Optional, defaults to *DefaultTicker*.

### RETURN-CODES

#### GENERATOR FUNCTION

Type | Code | Action
---- | ---- | ------
return | undefined | The process step has finished.
yield | undefined | The process step is continuing.
return | done | The process step has finished.
yield | done | The process step has finished.
return | stop | The process is immediately stopped.
yield | stop | The process is immediately stopped.
return | *f* | Return code is a function. This current process step is finished and the process has chained to *f*. Invoked on next tick cycle.
yield | *f* | Return code is a function. The current process step has not finished and function *f* is called. Invoked in this tick cycle.

#### FUNCTION

Code | Action
---- | ------
undefined | The process step has finished.
more | The process step is continuing.
done | The process step has finished.
stop | The process is immediately stopped.
*f* | Return code is a function. This current process step is finished and the process has chained to *f*. Invoked on next tick cycle.

#### NOTES

* Functions do not have an option to *call* another process step. A generator function must be used in this case.
* Functions must return *more* if they are to continue.
* Functions are generally easier to use than generator functions when using the builtin process step services.
* When a process step calls another the Ticker process pushs the current process step onto a call stack. This ensures that there is only ever one level of process step connected to the Ticker. The process call stack is popped whenever the current process step is *done*. The Ticker process is finished when the call stack is empty.

## VERSIONS

0.1.0 - Initial release

## AUTHORS

* Bruce Twite - Initial work

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
