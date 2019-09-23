# @micosmo/ticker/aframe-ticker

Aframe specific implementation of [@micosmo/ticker](./ticker.md)

## API

### IMPORTING

```javascript
import * as ticker from '@micosmo/ticker/aframe-ticker';
```
or
```javascript
import { Ticker, startProcess, ... } from '@micosmo/ticker/aframe-ticker';
```

### SYSTEMS

#### System: ticker

Hosts the *DefaultTicker* in the systems *tick* method.

##### METHODS

Method | Description
------ | -----------
start() | Start the ticker.
stop() | Stop the ticker and clear the tickers process queue.
pause() | Pause the ticker.

##### PROPERTIES

None

#### System: tocker

Hosts the *DefaultTocker* in the systems *tock* method. The *tocker* system is not automatically registered at application startup. The application will need to call *startDefaultTocker* to register and start the *DefaultTocker*.

##### METHODS

Method | Description
------ | -----------
start() | Start the ticker.
stop() | Stop the ticker and clear the tickers process queue.
pause() | Pause the ticker.

##### PROPERTIES

None

### COMPONENTS

#### Component: ticker

Creates a new ticker object and hosts the ticker in the components *tick* method.

##### SCHEMA

None

##### METHODS

Method | Description
------ | -----------
start() | Start the ticker.
stop() | Stop the ticker and clear the tickers process queue.
pause() | Pause the ticker.

##### PROPERTIES

None

#### Component: tocker

Creates a new ticker object and hosts the ticker in the components *tock* method.

##### SCHEMA

None

##### METHODS

Method | Description
------ | -----------
start() | Start the ticker.
stop() | Stop the ticker and clear the tickers process queue.
pause() | Pause the ticker.

##### PROPERTIES

None

### OBJECTS

#### Ticker

See [Ticker](./ticker.md#Ticker).

#### Ticker Process

##### COMPOSERS

Export | Description
-------- | -----------
createProcess(onTick[,&nbsp;ticker]) | Returns a new Ticker process that has a default Ticker of *DefaultTicker* if the *ticker* parameter has not been provided. The *onTick* parameter is the process function. All function types are supported. See [RETURN-CODES](./ticker.md#RETURN-CODES) for a list of codes that can be returned from the *onTick* function. The *ticker* parameter can be either and actual *ticker* object, an entity element object or a selector identifying a specific entity element. A *tryLocateTicker* method is used to resolve an entity element specification. The resolved ticker is assigned as the processes default ticker. See [Configuration:tryLocateTicker](#CONFIGURATION-OBJECT) for more details.The process is not started. 
createProcess(cfg) | As per above except the Ticker process is defined by a configuration object. See [CONFIGURATION-OBJECT](#CONFIGURATION-OBJECT) for more detail.
startProcess(onTick[,&nbsp;ticker]) | Returns a new Ticker process that has been started on the *DefaultTicker* if the *ticker* parameter has not been provided. The *onTick* parameter is the process function. All function types are supported. See [RETURN-CODES](./ticker.md#RETURN-CODES) for a list of codes that can be returned from the *onTick* function. The *ticker* parameter can be either and actual *ticker* object, an entity element object or a selector identifying a specific entity element. A *tryLocateTicker* method is used to resolve an entity element specification. The resolved ticker is assigned as the processes default ticker. See [Configuration:tryLocateTocker](#CONFIGURATION-OBJECT) for more details.The process is started.
startProcess(cfg) | As per above except the Ticker process is defined by a configuration object. See [CONFIGURATION-OBJECT](#CONFIGURATION-OBJECT) for more detail.

##### METHODS & PROPERTIES

See [Ticker-Process](./ticker.md#Ticker-Process).

### EXPORTS

#### FUNCTIONS

Function | Description
-------- | -----------
locateTicker(spec) | Locates a ticker based on the *spec*. If *spec* is *'default'* function returns *DefaultTicker*, if *spec* is any other string then it is assumed to be selector for a specific aframe entity. If *spec* is an actual ticker then the ticker is returned, otherwise the parameter is assumed to be an entity element. When the *spec* resolves to an entity element, the function searches for a *ticker* component along the entity parent element path starting at the *spec* element. If a *ticker* component is located then the ticker object that is hosted by the component is returned. If no *ticker* component was located then a warning is written to the browsers console log and *DefaultTicker* is returned.
tryLocateTicker(spec) | As for *locateTicker* except that no warning is issued if the *DefaultTicker* is returned.
locateTocker(startEl) | As for *locateTicker* except that a search will be for a *tocker* component. Note that *aframe-ticker* creates a *DefaultTocker* ticker object.
tryLocateTocker(spec) | As for *locateTocker* except that no warning is issued if the *DefaultTocker* is returned.
getTicker(spec) | The *spec* parameter is as for *locateTicker*, but if resolved to an entity element then the element must have an Aframe *ticker* component and the function will return the ticker that is hosted by the component.
getTocker(spec) | As for *getTicker* except an entity element *spec* nust resolve to an element with an Aframe *tocker* component.
startDefaultTocker() | Registers the Aframe *tocker* system which hosts and starts the *DefaultTocker*. The *ticker* system is registered and hosts the *DefaultTicker* which is started during application initialisation.
beater(s,&nbsp;elSpec[,&nbsp;evt]) | Extension of [ticker:beater](./ticker.md#EXPORTS) that allows an element specification (*elSpec* can be a selector or an element object) and an optional event name (*evt*) as an alternative to the function parameter. If supplied an internal function is passed to the *beater* that will emit (no bubbling) an event to the resolved element. The event name will default to *heartbeat* if *evt* is not provided. The name of the Ticker process is passed as the event *detail.name* for filtering of events, and the elapsed time in *detail.elapsed* in the time unit of the *beater*.
sBeater(s,&nbsp;elSpec[,&nbsp;evt]) | Extension of [ticker:sBeater](./ticker.md#EXPORTS) with alternative parameters as per *beater* above.
msBeater(ms,&nbsp;elSpec[,&nbsp;evt]) | Extension of [ticker:msBeater](./ticker.md#EXPORTS) with alternative parameters as per *beater* above.
iterator(...af), | See [ticker:iterator](./ticker.md#EXPORTS).
looper(count,&nbsp;f) | See [ticker:looper](./ticker.md#EXPORTS). 
timer(s,&nbsp;f) | See [ticker:timer](./ticker.md#EXPORTS).
sTimer(s,&nbsp;f) | See [ticker:sTimer](./ticker.md#EXPORTS).
msTimer(ms,&nbsp;f) | See [ticker:msTimer](./ticker.md#EXPORTS).
waiter(s[,&nbsp;f]), | See [ticker:waiter](./ticker.md#EXPORTS).
sWaiter(s[,&nbsp;f]) | See [ticker:sWaiter](./ticker.md#EXPORTS). 
msWaiter(ms[,&nbsp;f]) | See [ticker:msWaiter](./ticker.md#EXPORTS).

#### PROPERTIES

None

### CONFIGURATION-OBJECT

The *startProcess*/*createProcess* configuration object provides additional input properties to setup a Ticker process.

Property | Description
-------- | -----------
name | See [ticker:name](./ticker.md#CONFIGURATION-OBJECT).
onTick | See [ticker:onTick](./ticker.md#CONFIGURATION-OBJECT).
onEnd | See [ticker:onEnd](./ticker.md#CONFIGURATION-OBJECT).
msTimeout | See [ticker:msTimeout](./ticker.md#CONFIGURATION-OBJECT).
sTimeout | See [ticker:sTimeout](./ticker.md#CONFIGURATION-OBJECT).
ticker | Can be set to a ticker object, *'default'* which assigns the *DefaultTicker*, other string which is assumed to be selector for a specific aframe entity or an entity element object. When the value resolves to an entity element then the element must have an Aframe *ticker* component and the ticker that is hosted by the component is assigned.
tocker | Can be set to a ticker object, *'default'* which assigns the *DefaultTocker*, other string which is assumed to be selector for a specific aframe entity or an entity element object. When the value resolves to an entity element then the element must have an Aframe *tocker* component and the ticker that is hosted by the component is assigned.
locateTicker | Can be set to a ticker object, *'default'* which assigns the *DefaultTicker*, other string which is assumed to be selector for a specific aframe entity or an entity element object. When the value resolves to an entity element, the function searches for a *ticker* component along the entity parent element path starting at the specified element. If a *ticker* component is located then the ticker object that is hosted by the component is assigned. If no ticker component was located then a warning is written to the browsers console log and *DefaultTicker* is assigned.
tryLocateTicker | As for *locateTicker* except that no warning is issued if the *DefaultTicker* is returned.
locateTocker | Can be set to a ticker object, *'default'* which assigns the *DefaultTocker*, other string which is assumed to be selector for a specific aframe entity or an entity element object. When the value resolves to an entity element, the function searches for a *tocker* component along the entity parent element path starting at the specified element. If a *tocker* component is located then the ticker object that is hosted by the component is assigned. If no *tocker* component was located then a warning is written to the browsers console log and *DefaultTocker* is assigned.
tryLocateTocker | As for *locateTocker* except that no warning is issued if the *DefaultTocker* is returned.

### RETURN-CODES

See [ticker:RETURN-CODES](./ticker.md#RETURN-CODES).

#### NOTES

1. The *createProcess* and *startProcess* function behaviour will vary when the functions are called while the application scene is being loaded (such as during component *init()* calls). For *createProcess* a ticker specification that resolves to an entity element will return the process object, but the assignment of the default ticker for the process will only occur once the scene *loaded* event is signalled. This also applies to *startProcess* except that in addition the process will only be started when the scene *loaded* event is signalled.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
