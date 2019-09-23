# @micosmo/async/threadable

A *Threadable* is an asynchronous generator function that can be managed by a *Threatlet*. Each yield point within the generator provides the *Threadlet* scheduler an opportunity to schedule higher priority *Threadlets*. A *Threadable* is similar to a Javascript async function in that it promotes asynchronous programming in a synchronous style.

A *Threadable* can also be called without the support of a *Threadlet*. The default *Threadable* implementation is an async function that drives the threadable's generator, however this is not a synchronous implementation as the caller will be returned a *Promise*. A *Threadlet* unwraps a *Threadable* to become the driver of the threadable's generator.

A *Threadable* can also be created over other function types. In this case a simple generator function is attached and the function is wrapped to return a *Promise*.

## API

### IMPORTING

```javascript
const { Threadable } = require('@micosmo/async/threadable');
```
or
```javascript
const { Threadable } = require('@micosmo/async');
```

### OBJECTS

#### Threadable

Object that is a decorated function implemented as a generator that can be managed by a *Threadlet*. Defaults to an asynchronous function for direct calls.

##### COMPOSERS

Export | Description
-------- | -----------
Threadable(f) | Returns a function decorated as a *Threadable*. If *f* is a generator function then the *Threadable* is returned as an asynchronous driver function for *f* and *f* becomes a property. If *f* is any other function type then the *Threadable* is a wrapper function that calls *f* returning a *Promise* and a simple generator function that calls *f* is saved as the generator property.

##### METHODS

Method | Description
------ | -----------
with(...args) | Returns a generator instance after calling *fGenerator(...args)*.
bindWith(This,&nbsp;...args) | Returns a generator instance after calling *fGenerator.call(This, ...args)*

##### PROPERTIES

Property | Description
-------- | -----------
isaThreadable | Returns *true*.
fGenerator | Returns the generator function for this *Threadable*.

##### EXAMPLE

```javascript
  const { Threadable, Threadlet } = require('@micosmo/async');

  function * myGenerator (title) {
    const myThreadable1 = Threadable(function * (n, msg) { console.log(`${n}.${title}:myThreadable1: ${msg}`) });
    const myThreadable2 = Threadable(function (n, msg) { console.log(`${n}.${title}:myThreadable2: ${msg}`) });
    myThreadable1(1, 'Direct call to a Threadable generator function');
    myThreadable2(2, 'Direct call to a Threadable non generator function');
    console.log(`${title}: Sleeping ...`);
    yield Threadable.msSleep(500); // Threadable will sleep for 500 ms
    yield myThreadable1.with(3, 'Yield a generator instance with parms');
    yield Threadable.with(myThreadable2, 4, 'Yield a generator instance with parms');
    yield Threadable(() => console.log(`5.${title}:ArrowFunction: Yield a generator function, not an instance`));
    const v = yield Threadable.with(20, 30); // Will construct a generator instance that returns the values in an array
    console.log('6.${title}: Value from last yield is', v);
    return title;
  }

  Threadable(myGenerator)('Direct');
  Threadlet().run(myGenerator, 'Threadlet');

  /*
      1.Direct:myThreadable1: Direct call to a Threadable generator function
      2.Direct:myThreadable2: Direct call to a Threadable non generator function
      Direct: Sleeping ...
      1.Threadlet:myThreadable1: Direct call to a Threadable generator function
      2.Threadlet:myThreadable2: Direct call to a Threadable non generator function
      Threadlet: Sleeping ...
      3.Direct:myThreadable1: Yield a generator instance with parms
      4.Direct:myThreadable2: Yield a generator instance with parms
      5.Direct:ArrowFunction: Yield a generator function, not an instance
      6.Direct: Value from last yield is [ 20, 30 ]
      3.Threadlet:myThreadable1: Yield a generator instance with parms
      4.Threadlet:myThreadable2: Yield a generator instance with parms
      5.Threadlet:ArrowFunction: Yield a generator function, not an instance
      6.Threadlet: Value from last yield is [ 20, 30 ]
  */
```

### FUNCTIONS

Function | Description
-------- | -----------
Threadable.with(f,&nbsp;...args) | Returns a *Threadable* generator instance for *f* with *args*.
Threadable.bindWith(This,&nbsp;f,&nbsp;...args) | Returns a *Threadable* generator instance for *f.bind(This)* with *args*.
Threadable.sleep(s) | Returns a *Promise* for a *s* seconds sleep.
Threadable.msSleep(ms) | Returns a *Promise* for a *ms* milliseconds sleep.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
