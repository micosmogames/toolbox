# @micosmo/async/worker

Workers are asynchronous containers that serialise tasks. Each task can exhibit synchronous or asynchronous behaviour with the Worker running a task under a *Promise*. Tasks can be any form of function including a [*Threadable*](threadable.md) where the default async driver of a generator based *Threadable* will control the *Threadable's* life cycle.


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

#### Worker

Serialises the execution of tasks that are submitted to a *Worker*. Each task will only be dispatched when the previous task has completed and all promise handlers have been notified.

Goto [Worker.Group](#Worker.Group), [Worker.Process](#Worker.Process), [StepArg](#StepArg), [States](#States)

##### COMPOSERS

Export | Description
-------- | -----------
Worker() | Returns a new *Worker*.

##### METHODS

Method | Description
------ | -----------
run(f,&nbsp;...args) | Adds the task defined by the function *f* and arguments *args* to the *Worker's* work queue. Returns a *Promise*. See [Promises](promise.md#Promises) for more detail.
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
contract | Contract defining settlement handlers for each task. See [Contract](promise.md#Contract) for more detail.
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
    .contract.whenResolved
      .then(v => console.log(`Worker(${v}): Has finished.`))
      .parent.run(task, 'Worker1');

  const worker2 = Worker();
  const promise2 = worker2.run(task, 'Worker2');
  Promises(promise2)
    .then(v => console.log(`Worker(${v}): Has finished.`));

  const worker3 = Worker();
  worker3
    .contract.whenResolved
      .then(v => console.log(`Worker(${v}): Has finished.`))
      .parent.run(task, 'Worker3');

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

#### Worker.Group

A variant of a *Worker* that serialises the execution of tasks that are managed as a group. A *Worker.Group* has a single *promise* which will only be resolved when the complete group has been processed. A group is created in an open state

Goto [Worker](#Worker), [Worker.Process](#Worker.Process), [StepArg](#StepArg), [States](#States)

##### COMPOSERS

Export | Description
-------- | -----------
Worker.Group() | Returns a new *Worker.Group* object that is in an open state. By open we mean that it will accept requests to add tasks to the group.

##### METHODS

Method | Description
------ | -----------
run(f,&nbsp;...args) | Adds the task defined by the function *f* and arguments *args* to the groups open list. Returns a *Promise*. See [Promises](promise.md#Promises) for more detail.
bindRun(This,&nbsp;f,&nbsp;...args) | As for *run* but will bind *This* to the function *f*.
bindRun(This,&nbsp;methName,&nbsp;...args) | As for *run* but will bind *This* to *This[methName]*.
tasks(...tasks) | Defines a set of tasks for the group. Can be either a single parameter which is an array or is the parameter list itself. Each task definition is either just a function or an array that contains a function followed by 1 or more parameters. For example ```group.tasks(f1, [f2, arg1, ...], ...)```.
start() | Informs the *Worker.Group* that the task processing can start before all the tasks have been added to the group. The group remains open. Returns the group *Promise*.
close() | Informs the *Worker.Group* that the group is now closed and processing can be finalised. The group promise will be resolved once all of the tasks have been completed. The resolved value will be an array with a return value for each task in the order the tasks were added to the group. Returns the final group *Promise*.
reject(v) | Passes *v* to the default rejection handler.

##### PROPERTIES

Property | Description
-------- | -----------
isaWorkerGroup | Set to *true*.
contract | Contract defining settlement handlers for the group. See [Contract](promise.md#Contract) for more detail.
state | Returns a string representation of the current state. See [STATES](#STATES) for more detail.

#### Worker.Process

A variant of a *Worker* serialises the execution of steps where the return value of one step is a parameter or parameters of the next step. A *Worker.Process* has a single *promise* which will only be resolved when the complete process has been completed with a return value that is returned from the final step. A process is created in an open state.

Goto [Worker](#Worker), [Worker.Group](#Worker.Group), [StepArg](#StepArg), [States](#States)

##### COMPOSERS

Export | Description
-------- | -----------
Worker.Process() | Returns a new *Worker.Process* object that is in an open state. By open we mean that it will accept requests to add steps to the process.

##### METHODS

Method | Description
------ | -----------
run([stepArg,&nbsp;]f,&nbsp;...args) | Adds the step defined by the function *f* and arguments *args* to the processes open list. The optional *stepArg* is a [StepArg](#StepArg) function that performs the mapping of the previous step's return value as a parameter for this step. Default is *StepArg.none*.
bindRun(This,&nbsp;[stepArg,&nbsp;]f,&nbsp;...args) | As for *run* but will bind *This* to the function *f*.
bindRun(This,&nbsp;[stepArg,&nbsp;]methName,&nbsp;...args) | As for *run* but will bind *This* to *This[methName]*.
steps(...steps) | Defines a set of steps for the process. Can be either a single parameter which is an array or is the parameter list itself. Each step definition is either just a function or an array that contains a function followed by 1 or more parameters. For example ```group.tasks(f1, [StepArg.arg(0), f2, arg1, ...], ...)```.
start() | Informs the *Worker.Process* that step processing can start before all the steps have been added to the process. The process remains open. Returns the process *Promise*.
close() | Informs the *Worker.Process* that the process is now closed and processing can be finalised. The process promise will be resolved once the final step has ended. The resolved value will be the return value of the last step. Returns the final process *Promise*.
reject(v) | Passes *v* to the default rejection handler.

##### PROPERTIES

Property | Description
-------- | -----------
isaWorkerProcess | Set to *true*.
contract | Contract defining settlement handlers for the process. See [Contract](promise.md#Contract) for more detail.
state | Returns a string representation of the current state. See [STATES](#STATES) for more detail.

#### StepArg

A static object that contains mapping functions for mapping the return value from one process step to a parameter or parameters of the next process step.

Goto [Worker](#Worker), [Worker.Group](#Worker.Group), [Worker.Process](#Worker.Process), [States](#States)

##### COMPOSERS

None

##### METHODS

Method | Description
------ | -----------
arg(iArg) | Returns a StepArg function that maps a return value to the target argument list at *iArg* position. If *iArg* is negative then the position is taken from the end of the argument list with -1 mapping to last argument position. *iArg* is relative to 0.
map(mappings) | Returns a StepArg function that maps an array return value to positions in the target argument list. If the return value is not an array then it is wrapped in an array. The *mappings* must be an array where the element sequence corresponds to the positions in the return value array, i.e. the first element of the return value array corresponds to the first element in the *mappings* array and so on. Each mapping array element can be either *undefined* meaning no mapping for this position, or an index number into the target argument list where the return element is to be placed. Negative indexs are taken from the end of the target argument list with -1 mapping to the last argument. For example - ```Mappings[0,undefined,-1] for [10,20,30] to Args[undefined,1,2,undefined] gives Parameters[10,1,2,30]```.
run(f) | Returns a StepArg function that calls *f(v,args)* where *v* is the return value of the previous step and *args* is the argument list for the next step. *f* must return a parameter list array after applying *v* to *args*. The *args* array may be modified and returned.

##### PROPERTIES

Property | Description
-------- | -----------
none | Returns a noop StepArg function.
prepend | Returns a StepArg function that prepends the return value from the previous step to the argument list of the next step.
append | Returns a StepArg function that appends the return value from the previous step to the argument list of the next step.
any | Returns a StepArg function that replaces the first *undefined* value in the argument list of the next step. Appends otherwise.
anyNull | Returns a StepArg function that replaces the first *null* value in the argument list of the next step. Appends otherwise.
all | Returns a StepArg function that maps an array to each *undefined* element in the argument list of the next step. Excess mappings are appended to the end. Performs a *StepArg.any* if return value from previous step is not an array.
allNull | Returns a StepArg function that maps an array to each *null* element in the argument list of the next step. Excess mappings are appended to the end. Performs a *StepArg.anyNull* if return value from previous step is not an array.
args | Returns a StepArg function that sets the argument list of the next step to the array returned from the previous step. If return value is not an array then the value is wrapped in an array.

### STATES

State | Description
----- | -----------
ready | The worker is ready to run a task.
running | The worker is running a task.
paused | The worker has paused and is waiting for a resume request.
pending | The worker is waiting for the next task to start.
failed | A Group or Process has failed due to a failing task or step.
closed | The Group or Process has been closed.
stopped | The worker has been stopped. No tasks can be submitted to the worker. Does not apply to Groups and Processes.

Goto [Worker](#Worker), [Worker.Group](#Worker.Group), [Worker.Process](#Worker.Process), [StepArg](#StepArg)

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
