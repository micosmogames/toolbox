# @micosmo/async/worker

Workers are asynchronous containers that serialise tasks. Each task can exhibit synchronous or asynchronous behaviour with the Worker running a task as an *executor* of a *promise*. Tasks can be any form of function including a [*Threadable*](threadable.md) where the default async driver of a generator based *Threadable* will control the *Threadable's* life cycle.


## API

### IMPORTING

```javascript
const { Worker } = require('@micosmo/async/worker');
```
or
```javascript
const { Worker, ... } = require('@micosmo/async');
```

### OBJECTS

#### Object: Worker

Serialises the execution of tasks that are submitted to a *Worker*. Each task will only be dispatched when the previous task has completed and all promise handlers have been notified.

##### COMPOSERS

Export | Description
-------- | -----------
Worker() | Returns a new *Worker*.

##### METHODS

Method | Description
------ | -----------
run(f,&nbsp;...args) | Adds the task defined by the function *f* and arguments *args* to the *Worker's* work queue. Returns a *Promise*. See [PROMISES](threadlet.md#PROMISES) for more detail.
bindRun(This,&nbsp;f,&nbsp;...args) | As for *run* but will bind *This* to the function *f*.
bindRun(This,&nbsp;methName,&nbsp;...args) | As for *run* but will bind *This* to *This[methName]*.
stop() | The *Worker* will no longer accept tasks to run and will stop once the task queue is empty. Cannot be restarted. Use *pause* and *resume* otherwise. Returns *Worker*.
pause() | The *Worker* is placed in a paused state at the when the current task has ended. Returns *Worker*.
resume() | The *Worker* is resumed from a pause. Returns *Worker*.
reject(v) | Passes *v* to the default rejection handler.

##### PROPERTIES

Property | Description
-------- | -----------
isaWorker | Set to *true*.
promises | *Worker* level promise handler services that define promise handlers that are attached to the *promise* associated with each task. See [PROMISES](threadlet.md#PROMISES) for more detail.
isReady | Returns *true* if the *Worker* is ready to run a task.
isPending | Returns *true* if the *Worker* has scheduled a task for execution and is waiting for control of the Javascript thread.
isRunning | Returns *true* if the *Worker* is running a task.
isPaused | Returns *true* if the *Worker* is pausing or has paused.
isStopped | Returns *true* if the *Worker* is stopping or has stopped.
state | Returns a string representation of the *Worker's* current state. See [STATES](#STATES) for more detail.

##### EXAMPLE

```javascript
  const { Worker, Promises, Threadable } = require('@micosmo/async');

  const task = Threadable(function * (name) {
    yield console.log(`Worker(${name}): Started`);
    yield console.log(`Worker(${name}): Yield point 1`);
    yield console.log(`Worker(${name}): Yield point 2`);
    yield console.log(`Worker(${name}): Yield point 3`);
    yield console.log(`Worker(${name}): Yield point 4`);
    return name;
  });

  const worker1 = Worker();
  worker1
    .promises
      .then(v => console.log(`Worker(${v}): Has finished.`))
      .owner.run(task, 'Worker1');

  const worker2 = Worker();
  const promise2 = worker2.run(task, 'Worker2');
  Promises(promise2)
    .then(v => console.log(`Worker(${v}): Has finished.`));

  const worker3 = Worker();
  worker3
    .promises
      .then(v => console.log(`Worker(${v}): Has finished.`))
      .owner.run(task, 'Worker3');

  /*
      Worker(Worker1): Started
      Worker(Worker2): Started
      Worker(Worker3): Started
      Worker(Worker1): Yield point 1
      Worker(Worker2): Yield point 1
      Worker(Worker3): Yield point 1
      Worker(Worker1): Yield point 2
      Worker(Worker2): Yield point 2
      Worker(Worker3): Yield point 2
      Worker(Worker1): Yield point 3
      Worker(Worker2): Yield point 3
      Worker(Worker3): Yield point 3
      Worker(Worker1): Yield point 4
      Worker(Worker2): Yield point 4
      Worker(Worker3): Yield point 4
      Worker(Worker1): Has finished.
      Worker(Worker2): Has finished.
      Worker(Worker3): Has finished.
  */
```

#### Object: Worker.Group

A variant of a *Worker* which that serialises the execution of tasks that are managed as a group. A *Worker.Group* has a single *promise* which will only be resolved when the complete group has been processed. A group is created in an open state

##### COMPOSERS

Export | Description
-------- | -----------
Worker() | Returns a new *Worker*.

##### METHODS

Method | Description
------ | -----------
run(f,&nbsp;...args) | Adds the task defined by the function *f* and arguments *args* to the *Worker's* work queue. Returns a *Promise*. See [PROMISES](threadlet.md#PROMISES) for more detail.
bindRun(This,&nbsp;f,&nbsp;...args) | As for *run* but will bind *This* to the function *f*.
bindRun(This,&nbsp;methName,&nbsp;...args) | As for *run* but will bind *This* to *This[methName]*.
stop() | The *Worker* will no longer accept tasks to run and will stop once the task queue is empty. Cannot be restarted. Use *pause* and *resume* otherwise. Returns *Worker*.
pause() | The *Worker* is placed in a paused state at the when the current task has ended. Returns *Worker*.
resume() | The *Worker* is resumed from a pause. Returns *Worker*.
reject(v) | Passes *v* to the default rejection handler.

##### PROPERTIES

Property | Description
-------- | -----------
isaWorker | Set to *true*.
promises | *Worker* level promise handler services that define promise handlers that are attached to the *promise* associated with each task. See [PROMISES](threadlet.md#PROMISES) for more detail.
isReady | Returns *true* if the *Worker* is ready to run a task.
isPending | Returns *true* if the *Worker* has scheduled a task for execution and is waiting for control of the Javascript thread.
isRunning | Returns *true* if the *Worker* is running a task.
isPaused | Returns *true* if the *Worker* is pausing or has paused.
isStopped | Returns *true* if the *Worker* is stopping or has stopped.
state | Returns a string representation of the *Worker's* current state. See [STATES](#STATES) for more detail.

##### EXAMPLE

```javascript
  const { Worker, Promises, Threadable } = require('@micosmo/async');

  const task = Threadable(function * (name) {
    yield console.log(`Worker(${name}): Started`);
    yield console.log(`Worker(${name}): Yield point 1`);
    yield console.log(`Worker(${name}): Yield point 2`);
    yield console.log(`Worker(${name}): Yield point 3`);
    yield console.log(`Worker(${name}): Yield point 4`);
    return name;
  });

  const worker1 = Worker();
  worker1
    .promises
      .then(v => console.log(`Worker(${v}): Has finished.`))
      .owner.run(task, 'Worker1');

  const worker2 = Worker();
  const promise2 = worker2.run(task, 'Worker2');
  Promises(promise2)
    .then(v => console.log(`Worker(${v}): Has finished.`));

  const worker3 = Worker();
  worker3
    .promises
      .then(v => console.log(`Worker(${v}): Has finished.`))
      .owner.run(task, 'Worker3');

  /*
      Worker(Worker1): Started
      Worker(Worker2): Started
      Worker(Worker3): Started
      Worker(Worker1): Yield point 1
      Worker(Worker2): Yield point 1
      Worker(Worker3): Yield point 1
      Worker(Worker1): Yield point 2
      Worker(Worker2): Yield point 2
      Worker(Worker3): Yield point 2
      Worker(Worker1): Yield point 3
      Worker(Worker2): Yield point 3
      Worker(Worker3): Yield point 3
      Worker(Worker1): Yield point 4
      Worker(Worker2): Yield point 4
      Worker(Worker3): Yield point 4
      Worker(Worker1): Has finished.
      Worker(Worker2): Has finished.
      Worker(Worker3): Has finished.
  */
```

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
