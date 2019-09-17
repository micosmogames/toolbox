# @micosmo/async/threadlet

Threadlets are asynchronous containers that serialise tasks. Threadlets tasks can be defined as a generator function where each yield point enables the Threadlet to give up control of the Javascript thread for other threadlets or promise based tasks to be dispatched. Each task function is defined as a *Threadable* asynchronous function which allows the underlying Javascript function or method to be invoked with or without *Threadlet* support. Threadables can yield or return control to other threadables that can represent synchronous style applications that run in an asynchronous manner.

Threadlets are based on promises with threadables akin to Javascript *async* functions, and support the following features:

1. Tasks are independent and each task is assigned a promise when dispatched to a *Threadlet*.
2. A threadlet can be assign default task settlement handlers that are attached to every task.
3. All tasks are assigned a default *catch* handler.
4. Threadlet scheduling is handled by a separate scheduler. Threadlets can be configured with a *priority*, *timeslice* and *yieldInterval* that guides the scheduler dispatching decisions.
5. Threadlets can abstract away the handling of promises and async functions potentially helping to simplify the structure of asynchronous applications.
6. All tasks are run asynchronously regardless of whether they have asynchronous behaviour.
7. Implements a traditional threaded style of asynchronous programming.

## API

### IMPORTING

```javascript
const { Threadlet } = require('@micosmo/async/threadlet');
```
or
```javascript
const { Threadlet, ... } = require('@micosmo/async');
```

### OBJECTS

#### Object: Threadlet

Serialises the execution of tasks that are submitted to a *Threadlet*. Each task will only be dispatched when the previous task has completed and all promise handlers have been notified.

##### COMPOSERS

Export | Description
-------- | -----------
Threadlet([name[,&nbsp;controls]]) | Returns a new *Threadlet*. Optional *name* and scheduling *controls* can also be provided. See Object section below on *Threadlet Controls* for more detail.
Threadlet(controls) | Returns a new *Threadlet* configured with the supplied scheduling *controls*. See Object section below on *Threadlet Controls* for more detail.

##### METHODS

Method | Description
------ | -----------
run(f,&nbsp;...args) | Adds the task defined by the function *f* and arguments *args* to the *Threadlet's* work queue. Returns a *Promise*. See [PROMISES](#PROMISES) for more detail.
bindRun(This,&nbsp;f,&nbsp;...args) | As for *run* but will bind *This* to the function *f*.
bindRun(This,&nbsp;methName,&nbsp;...args) | As for *run* but will bind *This* to *This[methName]*.
stop() | The *Threadlet* will no longer accept tasks to run and will stop once the task queue is empty. Cannot be restarted. Use *pause* and *resume* otherwise. Returns *Threadlet*.
pause() | The *Threadlet* is placed in a paused state at the next yield point. Returns *Threadlet*.
resume() | The *Threadlet* is resumed from a pause. Returns *Threadlet*.
reject(v) | Passes *v* to the default rejection handler.

##### PROPERTIES

Property | Description
-------- | -----------
isaThreadlet | Set to *true*.
id | The *id* number associated with the *Threatlet*.
name | The name of the *Threadlet*. Defaults to *Threadlet:&lt;id&gt;*.
controls | Scheduling controls. See Object section below on *Threadlet Controls* for more detail.
promises | *Threadlet* level promise handler services that define promise handlers that are attached to the *promise* associated with each task. See [PROMISES](#PROMISES) for more detail.
isReady | Returns *true* if the *Threadlet* is ready to run a task.
isRunning | Returns *true* if the *Threadlet* is running a task.
isPausing | Returns *true* if the *Threadlet* will pause when the current task reaches a yield point or ends.
isPaused | Returns *true* if the *Threadlet* is attempting to pause or has paused.
isEnding | Returns *true* if the *Threadlet* is cleaning up after the current task has finished processing.
isStopping | Returns *true* if the *Threadlet* has been requested to stop and is waiting for the task queue to be processed.
isWaiting | Returns *true* if the *Threadlet's* current task is waiting on a promise.
hasPaused | Returns *true* if the *Threadlet* has paused.
hasStopped | Returns *true* if the *Threadlet* has stopped.
hasEnded | Returns *true* if the *Threadlet's* current task has ended.
hasFinished | Returns *true* if the *Threadlet's* current task is ending or has ended.
hasFailed | Returns *true* if the *Threadlet's* current task has failed.
state | Returns a string representation of the *Threadlet's* current state. See [STATES](#STATES) for more detail.
endState | The end state of the last task. Valid only when the *Threadlet* is not running. See [STATES](#STATES) for more detail.
endValue | The value returned by the last task. Valid only when the *Threadlet* is not running. Each task that is submitted for execution under a *Threadlet* will be assigned a promise that will provide the return value to assigned promise handlers.

##### EXAMPLE

```javascript
  const { Threadlet, Promises, Threadable } = require('@micosmo/async');

  const task = Threadable(function * (thrd) {
    yield console.log(`Threadlet(${thrd.name}): Started`);
    yield console.log(`Threadlet(${thrd.name}): Yield point 1`);
    yield console.log(`Threadlet(${thrd.name}): Yield point 2`);
    yield console.log(`Threadlet(${thrd.name}): Yield point 3`);
    yield console.log(`Threadlet(${thrd.name}): Yield point 4`);
    return thrd.name;
  });

  const thread1 = Threadlet('Thread1', { priority: Threadlet.Priority.High });
  thread1
    .promises
      .then(v => console.log(`Threadlet(${v}): Has finished.`))
      .owner.run(task, thread1);

  const thread2 = Threadlet('Thread2', { priority: Threadlet.Priority.Default });
  const promise2 = thread2.run(task, thread2)
  Promises(promise2)
    .then(v => console.log(`Threadlet(${v}): Has finished.`));

  const thread3 = Threadlet('Thread3', { priority: Threadlet.Priority.Low });
  thread3
    .promises
      .then(v => console.log(`Threadlet(${v}): Has finished.`))
      .owner.run(task, thread3);

  /*
      Threadlet(Thread1): Started
      Threadlet(Thread1): Yield point 1
      Threadlet(Thread2): Started
      Threadlet(Thread1): Yield point 2
      Threadlet(Thread1): Yield point 3
      Threadlet(Thread1): Yield point 4
      Threadlet(Thread3): Started
      Threadlet(Thread2): Yield point 1
      Threadlet(Thread1): Has finished.
      Threadlet(Thread2): Yield point 2
      Threadlet(Thread2): Yield point 3
      Threadlet(Thread3): Yield point 1
      Threadlet(Thread2): Yield point 4
      Threadlet(Thread3): Yield point 2
      Threadlet(Thread2): Has finished.
      Threadlet(Thread3): Yield point 3
      Threadlet(Thread3): Yield point 4
      Threadlet(Thread3): Has finished.
  */
```

#### Object: Threatlet Controls

An object that is instantiated when a new *Threadlet* is created. Values can be provided by a *controls* seed object when creating the *Threadlet* or will be defaulted. The *controls* are employed by the *Threadlet Scheduler* to schedule *Threatlet* execution.

##### COMPOSERS

None 

##### METHODS

None

##### PROPERTIES

Property | Description
-------- | -----------
priority | The execution priority of the *Threadlet*. See Object section below on *Threatlet Priorities*. Default is *Threadlet.Priority.Default*.
timeslice | The time allocated to a *Threatlet* for each  processing interval as a number expressed in milliseconds with microsecond precision (where supported). A *Threadlet* maintains control of the Javascript thread until the *timeslice* expires. If a *Threadlet* yields during a timeslice the scheduler will place the *Threadlet* at the end of the schedulers *run* queue. At the end of a *timeslice* a *Threatlet* will be returned to it's priority queued depending on the *yieldInterval*. The *timeslice* may be set to zero which will force the *Threatlet* to be rescheduled at each yield point. Default is 0.
yieldInterval | The minimum time between processing intervals as an integer expressed in milliseconds. At the end of each *timeslice* the scheduler will place the *Threadlet* into a wait state for the remainder of the *yieldInterval* less the actual processing time. If the *Threadlet's* processing time is greater than the *yieldInterval* then the *Threatlet* is immediately placed on the *Threatlet's* priority queue. If the *yieldInterval* is set to zero then threatlet scheduling will be based on the *timeslice* only. Default is 0.

#### Object: Threatlet Priorities

##### COMPOSERS

Export | Description
Threadlet.Priority | Property that returns a static object of priority values.

##### METHODS

None

##### PROPERTIES

Property | Description
-------- | -----------
Low | Lowest scheduling priority.
Default | Default scheduling priority. Threadlets at this priority will be dispatched on average twice as often as low priority threadlets.
High | Highest scheduling priority. Threadlets at this priority will be dispatched on average twice as often as default priority threadlets.

### PROMISES

The *Threatlet* and [*Worker*](Worker.md) asynchronous containers provide promise handler services defining promise handlers that are automatically attached to the *promise* object that is associated with each task. In addition, a *Threadlet* will attach a default *catch* (rejection handler) to the end of the *promise* chain. However, a *promise* that is associated with a *Threadlet* or *Worker* can be assigned handlers via the normal promise *then*, *catch* and *finally* methods which will extend the *promise* chain beyond the scope of a *Threadler* or *Worker*. This will result in split *promise* chains where we minimally end up with the default rejection handler not being at the end of the main *promise* chain. To avoid this the micosmo async package has a *Promises* object and function that enables the management of a single *promise* chain.

The *Promises* object is based on a standard promises interface that must implement a *then*, *catch* and *finally* methods which are attached to an object's *promises* property. Each promises implementation can be object specific but would be expected to apply the promise handlers to one or more *promise* objects at some point within the object's life cycle. The requirement for a *promises* property ensures that an object, as a resolved value, is not considered to be a *thenable* object when a *Promise* is being resolved. A *Promises* should also have a *owner* property that returns the owner object and a *link* property to return the last *promise* linked in the chain.

Example:

```javascript
  ...
  // Apply resolve handler to an object's promise structure
  object.promises.then(() => { .... });
  // Will create a resolved promise with 'object' as the value.
  Promise.resolve(object); 
  ...
  // The 'then' method of  'object' that applies resolve handler to an object's promise structure
  object.then(() => { .... });
  // Will create a resolved promise BUT will attempt to resolve 'object' as a 'thenable' 
  // rather than using 'object' as the value
  Promise.resolve(object); 
```

#### Object: Promises

The default *Promises* implementation creates a *Promises* object that defers the attachment of promise handlers to a *Promise* or [*LazyPromise*](lazypromise.md)). The *then*, *catch* and *finally* methods add their associated handlers on to a list and the *Promises* owner applies the handlers to a target promise type as required.

##### COMPOSERS

Export | Description
------ | -----------
Promises(owner) - Returns a new *Promises* object that is related to the *owner* object.

##### METHODS

Method | Description
------ | -----------
then(onFulfilled,&nbsp;onRejected) | Adds new *then* handlers to the *promises* list. Returns the *promises* object.
catch(onRejected) | Adds a new *catch* hamdler to the *promises* list. Returns the *promises* object.
finally(onFinally) | Adds a new *finally* hamdler to the *promises* list. Returns the *promises* object.
apply(promise) | Applies the handler list to the *promise* in the order that they were added. Returns the *promises* object.
clear([promise]) | Clears the handler list after calling *apply* if a *promise* is provided. Returns the *promises* object.

##### PROPERTIES

Property | Description
-------- | -----------
owner | Contains the owner of the *promises* object.
link | Contains the last *promise* in the chain created by applying the handlers to a *promise* or *lazyPromise*.

##### FUNCTIONS

Function | Description
------ | -----------
Promises(promise) | Returns the *promise* or if the *promise* is related to a *LazyPromise* then as per *Promises(lazyPromise)*.
Promises(lazyPromise) | Returns *lazyPromise.promises*.
Promises(promises) | Returns *promises*.
Promises(object) | Returns *object.promises* of if no *promises* property then returns a new *Promises* with *object* as the owner.
Promises(v) | For any other value will return *Promise.resolve(v)*. 
Promises.reject(v[,&nbsp;msg]) | The rejected value *v* is processed by the default rejection handler. The optional *msg* can be displayed in any logged detail. See *setDefaultCatchHandler* in [utils](lib/utils.md) for setting a alternate default rejection handler. Is initially set to *Promises.miReject*.
Promises.miReject(v[,&nbsp;msg]) | The rejected value *v* is processed by the default micosmo rejection handler. If *v* is an *Error* the error message and stack, if available, are written to *console.error*. If *v* is a *promise* or *thenable* (promisable) then an error message is written to *console.error* and promisable is returned. All other values are written out in a rejection message to *console.error*. Returns *Promise(retValue)* where *retValue* will be a promisable or *undefined*.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
