# @micosmo/async/semaphore

Asynchronous primitives for synchronizing asynchronous tasks or critical sections of asynchronous code.

## API

### IMPORTING

```javascript
const { Semaphore, CriticalSection } = require('@micosmo/async/semaphore');
```
or
```javascript
const { Semaphore, CriticalSection } = require('@micosmo/async');
```

### OBJECTS

#### Semaphore

Object for synchronizing one or more asynchronous tasks. Allows one or more tasks (as defined by the *Semaphore*) to own the semaphore and whilst other tasks that attempt to acquire the *Semaphore* are placed on a semaphore wait list. Once a task releases the *Semaphore*, the first task on the wait list will gain control of the *Semaphore*.

##### COMPOSERS

Export | Description
-------- | -----------
Semaphore() | Returns a new *Semaphore*. All asynchronous tasks that attempt to acquire the *Semaphore* will be placed on the wait queue until another asynchronous task releases the *Semaphore*.
Semaphore(signalCount) | Returns a new *Semaphore* with a pending *signalCount* that defines how many asynchronous tasks that can concurrently acquire the *Semaphore*.
Semaphore(signalValues) | Returns a new *Semaphore* with an array of pending *signalValues* where the length of *signalValues* defines how many tasks can concurrently acquire the *Semaphore*. Each task that acquires the *Semaphore* will be passed a signal value from the *signalValues* array in the order that the *Semaphore* is acquired.

##### METHODS

Method | Description
------ | -----------
signal([v]) | Releases *Semaphore* with the optional return value *v*, or *undefined*. If there is an asynchronous task waiting on the wait queue then the top task is removed from the wait queue and signalled to terminate the *wait* with the return value. If the wait queue is empty then the return value is pushed onto a queue of pending signals. Returns the *Semaphore*.
wait() | Requests access to the *Semaphore*. If the *Semaphore* has a pending signal count then the caller will immediately acquire access to the *Semaphore* otherwise will be added to the end of the wait queue. Returns a *Promise* that will be resolved to the signal value when the *Semaphore* is acquired. This method would typically be called on a *await* statement in an async function or a *yield* statement in a *Threadable*.
wait(ms[,&nbsp;timeoutValue]) | As for *wait()*, except that *ms* defines a millisecond timeout period that that caller will wait for the *Semaphore* to be signalled. The optional *timeoutValue* or *undefined* will beome the resolved value of the returned *Promise* should the timeout period expire.

##### PROPERTIES

Property | Description
-------- | -----------
isaSemaphore | Returns *true*.

##### EXAMPLE

```javascript
  const { Semaphore } = require('@micosmo/async/semaphore');

  const sem1 = Semaphore();
  const sem2 = Semaphore(['Get going']);
  async function f1() {
    console.log('f1: Before wait');
    console.log('f1: Semaphore signalled', await sem1.wait());
    console.log('f1: After wait');
  }
  async function f2() {
    console.log('f2: Before wait');
    console.log('f2: Semaphore signalled', await sem2.wait());
    console.log('f2: After wait');
    sem1.signal('done');
  }
  f1();
  f2();

  /*
    f1: Before wait
    f2: Before wait
    f2: Semaphore signalled Get going
    f2: After wait
    f1: Semaphore signalled done
    f1: After wait
  */
```

#### CriticalSection

Object for serialising access to an asynchronous section of code that can only be performed by one task at a time.

##### COMPOSERS

Export | Description
-------- | -----------
CriticalSection() | Returns a new *CriticalSection*.

##### METHODS

Method | Description
------ | -----------
start() | Caller requests entry to the *CriticalSection*. Returns a *Promise* if waiting or *undefined* if immediately enters the *CriticalSection*.
end() | Caller signals that end of the *CriticalSection*, the next waiting task is allowed entry. Returns *undefined*.
run(f,&nbsp;...args) | *f(...args)* is called when the *CriticalSection* is acquired. Returns a *Promise* that will resolve to *f(...args)* return value.
bindRun(This,&nbsp;f,&nbsp;...args) | As for *run* except that the function call will be *f.call(This, ...args)*.

##### PROPERTIES

Property | Description
-------- | -----------
isaCriticalSection | Returns *true*.

##### EXAMPLE

```javascript
  const { Threadlet, CriticalSection } = require('@micosmo/async');

  const cs = CriticalSection();
  Threadlet().run(function * () {
    yield cs.start();
    console.log('Threadlet owns the critical section');
    console.log('Threadlet sleeping...');
    yield Threadable.sleep(1);
    console.log('Threadlet still owns the critical section');
    cs.end();
  });
  cs.run(async function () {
    console.log('async function owns critical section');
    console.log('async function sleeping...');
    await Threadable.sleep(1);
    console.log('async function still owns critical section');
  })

  /*
    async function owns critical section
    async function sleeping...
    async function still owns critical section
    Threadlet owns the critical section
    Threadlet sleeping...
    Threadlet still owns the critical section
  */
```

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
