# @micosmo/async/threadlet

Threadlets are asynchronous containers that serialise tasks. Threadlets tasks can be defined as a generator function where each yield point enables the Threadlet to give up control of the Javascript thread for other threadlets or promise based tasks to be dispatched. Each task function is defined as a *Threadable* asynchronous function which allows the underlying Javascript function or method to be invoked with or without *Threadlet* support. Threadables can yield or return control to other threadables that can represent synchronous style applications that run in an asynchronous manner.

Threadlets are based on promises with threadables akin to Javascript *async* functions, and support the following features:

1. Tasks are independent and each task is assigned a promise when dispatched to a *Threadlet*.
2. A threadlet has a [*Contract*](promise.md#Contract) that defines threadlet specific promise settlement handlers that are assigned during various stages of tasks's life cycle.
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

#### Threadlet

Serialises the execution of tasks that are submitted to a *Threadlet*. Each task will only be dispatched when the previous task has completed and all promise handlers have been notified.

##### COMPOSERS

Export | Description
-------- | -----------
Threadlet([name[,&nbsp;controls]]) | Returns a new *Threadlet*. Optional *name* and scheduling *controls* can also be provided. See [*ThreadletControls*](#ThreadletControls) for more detail.
Threadlet(controls) | Returns a new *Threadlet* configured with the supplied scheduling *controls*. See [*ThreadletControls*](#ThreadletControls) for more detail.

##### METHODS

Method | Description
------ | -----------
run(f,&nbsp;...args) | Adds the task defined by the function *f* and arguments *args* to the *Threadlet's* work queue. Returns a *Promise*. See [Promises](promise.md#Promises) for more detail.
bindRun(This,&nbsp;f,&nbsp;...args) | As for *run* but will bind *This* to the function *f*.
bindRun(This,&nbsp;methName,&nbsp;...args) | As for *run* but will bind *This* to *This[methName]*.
publicInterface() | Returns an object that only exposes the *run* and *bindRun* methods. Callers of the public interface will will be returned a *promise*. See [Promises](promise.md#Promises) for more detail.
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
controls | Scheduling controls. See [*ThreadletControls*](#ThreadletControls) for more detail.
contract | Contract defining settlement handlers for each task. See [Contract](promise.md#Contract) for more detail.
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
    .contract.whenResolved
      .then(v => console.log(`Threadlet(${v}): Has finished.`))
      .parent.run(task, thread1);

  const thread2 = Threadlet('Thread2', { priority: Threadlet.Priority.Default });
  const promise2 = thread2.run(task, thread2)
  Promises(promise2)
    .then(v => console.log(`Threadlet(${v}): Has finished.`));

  const thread3 = Threadlet('Thread3', { priority: Threadlet.Priority.Low });
  thread3
    .contract.whenResolved
      .then(v => console.log(`Threadlet(${v}): Has finished.`))
      .parent.run(task, thread3);

  /*
      Threadlet(Thread1): Started
      Threadlet(Thread1): Yield point 1
      Threadlet(Thread2): Started
      Threadlet(Thread1): Yield point 2
      Threadlet(Thread1): Yield point 3
      Threadlet(Thread3): Started
      Threadlet(Thread1): Yield point 4
      Threadlet(Thread2): Yield point 1
      Threadlet(Thread2): Yield point 2
      Threadlet(Thread1): Has finished.
      Threadlet(Thread3): Yield point 1
      Threadlet(Thread2): Yield point 3
      Threadlet(Thread2): Yield point 4
      Threadlet(Thread3): Yield point 2
      Threadlet(Thread2): Has finished.
      Threadlet(Thread3): Yield point 3
      Threadlet(Thread3): Yield point 4
      Threadlet(Thread3): Has finished.
  */
```

#### ThreadletControls

An object that is instantiated when a new *Threadlet* is created. Values can be provided by a *controls* seed object when creating the *Threadlet* or will be defaulted. The *controls* are employed by the *Threadlet Scheduler* to schedule *Threatlet* execution.

##### COMPOSERS

None 

##### METHODS

None

##### PROPERTIES

Property | Description
-------- | -----------
priority | The execution priority of the *Threadlet*. See [*ThreatletPriorities*](#ThreatletPriorities) below. Default is *Threadlet.Priority.Default*.
timeslice | The time allocated to a *Threatlet* for each  processing interval as a number expressed in milliseconds with microsecond precision (where supported). A *Threadlet* maintains control of the Javascript thread until the *timeslice* expires. If a *Threadlet* yields during a timeslice the scheduler will place the *Threadlet* at the end of the schedulers *run* queue. At the end of a *timeslice* a *Threatlet* will be returned to it's priority queued depending on the *yieldInterval*. The *timeslice* may be set to zero which will force the *Threatlet* to be rescheduled at each yield point. Default is 0.
yieldInterval | The minimum time between processing intervals as an integer expressed in milliseconds. At the end of each *timeslice* the scheduler will place the *Threadlet* into a wait state for the remainder of the *yieldInterval* less the actual processing time. If the *Threadlet's* processing time is greater than the *yieldInterval* then the *Threatlet* is immediately placed on the *Threatlet's* priority queue. If the *yieldInterval* is set to zero then threatlet scheduling will be based on the *timeslice* only. Default is 0.

#### ThreatletPriorities

##### COMPOSERS

Export | Description
------ | -----------
Threadlet.Priority | Property that returns a static object of priority values.

##### METHODS

None

##### PROPERTIES

Property | Description
-------- | -----------
Low | Lowest scheduling priority.
Default | Default scheduling priority. Threadlets at this priority will be dispatched on average twice as often as low priority threadlets.
High | Highest scheduling priority. Threadlets at this priority will be dispatched on average twice as often as default priority threadlets.

### STATES

State | Description
----- | -----------
ready | The threatlet is ready to run a new task.
running | The threadlet is running a task.
pausing | The threadlet will pause at the the next yield point.
paused | The threadlet has paused and is waiting for a resume request.
ending | The threadlet is cleaning up after a tasked has ended.
ended | The previous task has ended.
failed | The previous task has failed.
waiting | The threadlet is waiting on a promise.
stopped | The threadlet has stopped. No tasks can be submitted to the threadlet.

NOTE: The threadlet *endState* can be one of *ready* (only before first task), *running*, *ended* or *failed*.

### THREADLETS

Threadlets that are created by the async package for general use.

Threadlet | Description
--------- | -----------
Threadlet.LowPriority | Returns the public interface for a general use *low* priority threadlet.
Threadlet.DefaultPriority | Returns the public interface for a general use *default* priority threadlet.
Threadlet.HighPriority | Returns the public interface for a general use *high* priority threadlet.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
