# @micosmo/async/promise

Contains objects and services to extend and manage native promsies. At the core is a *Contract* object that records promise settlement handlers that are applied to a promise during the promise's life cycle. When a contract is *sealed* it will produce a promise *proxy* that provides a management layer over a native promise. A proxy provides a single point of reference for constructing a promise chain and interleaving contract handlers with those that are assigned directly to a proxy. 

A promise proxy is a promise *thenable* object meaning that it can be substituted into any native promise operations. The one difference being that as a *thenable* object the *then*, *catch* and *finally* methods cannot be defined within the proxy's prototype. A separate *promises* sub-object contains these methods and a *Promises* function will take any value and return the object that exposes a *then*, *catch* and *finally* (referred to as *promises*) interface.

## API

### IMPORTING

```javascript
const { Contract, Promises, ... } = require('@micosmo/async/promise');
```
or
```javascript
const { Contract, Promises, ... } = require('@micosmo/async');
```

### OBJECTS

#### Contract

A contract defines a set of asynchronous constraints or behaviours that must be applied to any promise that is created by the contract. Typically a contract is created by an *owner* object that is exposing asynchronous services such as a [*Threadlet*](threadlet.md), but can also be used for defining common constraints and behaviours for related asynchronous tasks.

A contract records a set of promise settlement handlers that are applied to a promise at defined points within the promise's life-cycle. The contract creates (called *sealing*) a promise proxy object that manages a native Javascript promise.

Goto [SealedContract](#SealedContract), [ProxyPromise](#ProxyPromise), [AsyncPromise](#AsyncPromise), [LazyPromise](#LazyPromise), [Promises](#Promises), [Promises.Recorder](#Promises.Recorder), [Promises.Applier](#Promises.Applier)

##### COMPOSERS

Export | Description
-------- | -----------
Contract() | Returns a new *Contract*.
Contract(owner) | Returns a new *Contract* with an *owner* that is assigned to the *contract* supporting owner object chained method calls.
Contract(fFinally) | Returns a new *Contract*. The *fFinally* function is a settlement handler that is appended to the end of a promise chain and will be called regardless of whether the promise was resolved or rejected. This is uesful for triggering dependent asynchronous tasks or steps.
Contract(owner,&nbsp;fFinally) | Returns a new *Contract* with both an *owner* and *fFinally* function.

##### METHODS

Method | Description
------ | -----------
asyncSeal() | As for *seal*.
asyncSeal(fExecutor) | Returns an [*AsyncPromise*](#AsyncPromise) that is bound by the *contract*. The *fExecutor* function will be run asynchronously.
seal() | Returns a [*LazyPromise*](#LazyPromise) that is bound by the *contract*.
seal(fExecutor) | Returns a [*ProxyPromise*](#ProxyPromise) that is bound by the *contract*. The *fExecutor* function will be run synchronously when the native promise is instantiated, or as implemented by the hosting Javascript environment.

##### PROPERTIES

Property | Description
-------- | -----------
isaContract | Returns *true*.
owner | Returns the owner of the contract or *undefined*.
whenSealed | Returns a [*Promises.Recorder*](#Promises.Recorder) object for capturing settlement handlers that are to be applied to a [*SealedContract*](#SealedContract) prior to the explicit assigment of any settlement handlers to the *SealedContract*. For example ```contract.whenSealed.then(...)```
whenResolved | Returns a [*Promises.Recorder*](#Promises.Recorder) object for capturing settlement handlers that are to be applied to a [*SealedContract*](#SealedContract) at the point the *SealedContract* is resolved. For eaxmple ```contract.whenResolved.then(...)```
whenRejected | Returns a [*Promises.Recorder*](#Promises.Recorder) object for capturing settlement handlers that are to be applied to a [*SealedContract*](#SealedContract) at the point the *SealedContract* is rejected. For example ```contract.whenRejected.catch(...)```
whenSettled | Returns a [*Promises.Recorder*](#Promises.Recorder) object for capturing settlement handlers that are to be applied to a [*SealedContract*](#SealedContract) at the point the *SealedContract* is either resolved or rejected. For example ```contract.whenSettled.finally(...)```

##### EXAMPLE

```javascript
  const { Contract } = require('@micosmo/async');
  const contract = Contract(v => console.log(`Contract has been finalised. Value(${v})`));
  contract
    .whenResolved
      .then(v => { console.log(`Resolved contract value is ${v}.`); return v })
      .owner
    .whenRejected
      .catch(v => { console.log(`Rejected contract value is ${v}.`); return v })
      .owner
    .whenSettled
      .then(v => { console.log(`Settled contract value is ${v}.`); return v });

  contract.asyncSeal((resolve, reject) => reject('Rejected Contract'));
  contract.seal(resolve => resolve('Resolved Contract'));
  /*
      Resolved contract value is Resolved Contract.
      Rejected contract value is Rejected Contract.
      Settled contract value is Resolved Contract.
      Settled contract value is Rejected Contract.
      Contract has been finalised. Value(Resolved Contract)
      Contract has been finalised. Value(Rejected Contract)
  */
```

#### SealedContract

A *SealedContract* is a template object that defines behaviour for all proxy objects that are bound to a contract. Internally there is an *EmptyContract* that allows a proxy object to be created without contract behaviour or constraints.

The *Contract* settlement handlers are attached to the underying *Promise* chain at the following points:

* Sealing : The *whenSealed* handlers are attached immediately the *SealedContract* is created.
* Resolving : The *whenResolved* and *whenSettled* handlers are attached in that order, followed by a default *catch* handler and *finally* handler.
* Rejecting : The *whenRejected* and *whenSettled* handlers are attached in that order, followed by a default *catch* handler and *finally* handler.

Goto [Contract](#Contract), [ProxyPromise](#ProxyPromise), [AsyncPromise](#AsyncPromise), [LazyPromise](#LazyPromise), [Promises](#Promises), [Promises.Recorder](#Promises.Recorder), [Promises.Applier](#Promises.Applier)

##### COMPOSERS

None 

##### METHODS

Method | Description
------ | -----------
then(resolve) | Method that defines this object as *thenable*. Allows the object to be substituted for a *Promise*. Resolves the proxy promise (*SealedContract*) to the underlying native promise.

##### PROPERTIES

Property | Description
-------- | -----------
isaSealedContract | Returns *true*.
isSettled | Returns *true* when the native promise of the *SealedContract* has been settled, otherwise *false*.
contract | Returns the *Contract* that the *SealedContract* is bound to.
promise | Returns last the native *Promise* in the promise chain.
rootPromise | Returns the *Promise* that is at the root of the promise chain.
promises | Returns the [*Promises.Applier*](#Promises.Applier) object that implements the *Promises* interface for the *SealedContract*.

#### ProxyPromise

Implements the standard [*SealedContract*](#SealedContract) behaviour.

Goto [Contract](#Contract), [SealedContract](#SealedContract), [AsyncPromise](#AsyncPromise), [LazyPromise](#LazyPromise), [Promises](#Promises), [Promises.Recorder](#Promises.Recorder), [Promises.Applier](#Promises.Applier)

##### COMPOSERS

Export | Description
------ | -----------
ProxyPromise(fExecutor[,&nbsp;contract]) | Returns a *ProxyPromise* for *fExecutor* bound to *contract*. If there is no *contract* then defaults to the *EmptyContract*.

##### METHODS

None

##### PROPERTIES

Property | Description
-------- | -----------
isaProxyPromise | Returns *true*.

#### AsyncPromise

Implements the standard [*SealedContract*](#SealedContract) behaviour except that the *executor* will be run asynchronously.

Goto [Contract](#Contract), [SealedContract](#SealedContract), [ProxyPromise](#ProxyPromise), [LazyPromise](#LazyPromise), [Promises](#Promises), [Promises.Recorder](#Promises.Recorder), [Promises.Applier](#Promises.Applier)

##### COMPOSERS

Export | Description
------ | -----------
AsyncPromise(fExecutor[,&nbsp;contract]) | Returns an *AsyncPromise* for *fExecutor* bound to *contract*. If there is no *contract* then defaults to the *EmptyContract*.

##### METHODS

None

##### PROPERTIES

Property | Description
-------- | -----------
isanAsyncPromise | Returns *true*.

#### LazyPromise

Extension of [*SealedContract*](#SealedContract) where there is no *executor* provided and the underlying *Promise* enters a *pending* state waiting for the *LazyPromise* to be explicitly resolved or rejected by the creator of the *LazyPromise*.

Goto [Contract](#Contract), [SealedContract](#SealedContract), [ProxyPromise](#ProxyPromise), [AsyncPromise](#AsyncPromise), [Promises](#Promises), [Promises.Recorder](#Promises.Recorder), [Promises.Applier](#Promises.Applier)

##### COMPOSERS

Export | Description
------ | -----------
LazyPromise([contract]) | Returns a *LazyPromise* bound to *contract*. If there is no *contract* then defaults to the *EmptyContract*.
LazyPromise.resolve(v) | Returns a resolved *LazyPromise* with value *v*. Bound to the *EmptyContract*.
LazyPromise.reject(v) | Return a rejected *LazyPromise* with value *v*. Bound to the *EmptyContract*.

##### METHODS

Method | Description
------ | -----------
resolve(v) | Resolves the underlying *Promise* with the value *v*.
reject(v) | Rejects the underlying *Promise* with the value *v*.

##### PROPERTIES

Property | Description
-------- | -----------
isaLazyPromise | Returns *true*.
isResolved | Returns *true* when the *LazyPromise* has been resolved, *false* when the *LazyPromise* has been rejected and *undefined* otherwise.
value | Returns either the resolved or rejected value, otherwise will be *undefined*.

#### Promises

An interface specification for defining an object that implements the *then*, *catch* and *finally* methods for attaching to a *Promise* chain. There are currently two implementations; *Promises.Recorder* that records settlement handlers for later attachment and *Promises.Applier* for attaching settlement handlers directly to a native *Promise*. This abstraction allows an object to be a proxy for a *Promise* that is both *thenable* and manages settlement handlers for the *Promise*.

All micosmo asynchronous services return a native *Promise* that is created and managed by a *LazyPromise*. A *LazyPromise* as well as *AsyncPromise*, are *SealedContract* variants that will not settle (resolve or reject) unless the code that created the *SealedContract* returns control to the Javascript kernel. Before this occurs the code can attach settlement handlers that will take precedence over the *Contract* *whenResolved*, *whenRejected*, *whenSettled*, default rejection and contract finally handlers. However, this can only be achieved if the code calls ```Promises(promise).then(...)...``` to allow the *LazyPromise* to manage the promise chain. If not then a split chain will be created which will be independent of the LazyPromise chain.

Once a *SealedContract* has settled, any new attachment of settlement handlers against the *SealedContract* will be placed after those from the bound *Contract*. At this point any rejections have been handled and a resolved value is propagated. If this is not the desired outcome then settlement handlers can be attached to the original returned native *Promise* to receive the resolved or rejected value after being processed only by the *Contract* *whenSealed* handlers. Alternatively the settlement handlers can be attached to the *rootPromise* of the *SealedContract* to get access to the raw resolved or rejected value. The *rootPromise* can be accessed by the property expression ```<promise>.sealedContract.rootPromise``` where ```<promise>``` is the reference to the *Promise*.

Goto [Contract](#Contract), [SealedContract](#SealedContract), [ProxyPromise](#ProxyPromise), [AsyncPromise](#AsyncPromise), [LazyPromise](#LazyPromise), [Promises.Recorder](#Promises.Recorder), [Promises.Applier](#Promises.Applier)

##### COMPOSERS

None

##### METHODS

Method | Description
------ | -----------
then(onFulfilled,&nbsp;onRejected) | Must implement *then*. Returns the *promises* object.
catch(onRejected) | Must implement *catch*. Returns the *promises* object.
finally(onFinally) | Must implement *finally*. Returns the *promises* object.

##### PROPERTIES

Property | Description
-------- | -----------
isaPromises | Must return *true*.
owner | Must return the owner of the *promises* object.
parent | Must either return the owner of the owner, or if no parent just the owner.

##### FUNCTIONS

Function | Description
-------- | -----------
Promises(v) | Returns an object that implements the *Promises* interface for *v*. This can be a *Promises* object itself, an object that has a *promises* property, a native *Promise* or a native *Promise* which is attached to a *SealedContract*. In the latter case *Promises()* will return *SealedContract.promises*. Any other value will be wrapped in a native *Promise*. It should be noted that direct calls to a native *Promise* that is attached to a *SealedContract* may result in a split *Promise* chain, which may not be the desired outcome.
Promises.reject(v[,&nbsp;msg]) | Runs the default rejection handler with value *v*. Optional *msg* will be injected into logged rejection messages if supported by the rejection handler. See *setDefaultCatchHandler* for setting an alternate default rejection handler which is initially set to *Promises.miReject*.
Promises.miReject(v[,&nbsp;msg]) | The rejected value *v* is processed by the default micosmo rejection handler. If *v* is an *Error* the error message and stack, if available, are written to *console.error*. If *v* is a *promise* or *thenable* (promisable) then an error message is written to *console.error* and promisable is returned. All other values are written out in a rejection message to *console.error*. Optional *msg* will be injected into logged messages. Returns *Promise(retValue)* where *retValue* will be a promisable or *undefined*.

#### Promises.Recorder

Promises implementation that records settlement handlers for later attaching to a *Promise* or *SealedContract*

Goto [Contract](#Contract), [SealedContract](#SealedContract), [ProxyPromise](#ProxyPromise), [AsyncPromise](#AsyncPromise), [LazyPromise](#LazyPromise), [Promises](#Promises), [Promises.Applier](#Promises.Applier)

##### COMPOSERS

Export | Description
------ | -----------
Promises.Recorder(owner[,&nbsp;parent]) - Returns a new *Promises.Recorder* object that is associated with the *owner* object. Optional *parent* (owner of *owner*) will default to *owner*.

##### METHODS

Method | Description
------ | -----------
then(onFulfilled[,&nbsp;onRejected]) | Adds a new *onFulFilled* and optional *onRejected* handler to the *Promises.Recorder* list. Returns the *Promises.Recorder* object.
catch(onRejected) | Adds a new *onRejected* handler to the *Promises.Recorder* list. Returns the *Promises.Recorder* object.
finally(onFinally) | Adds a new *onFinally* handler to the *Promises.Recorder* list. Returns the *Promises.Recorder* object.
apply(promise) | Attaches the handler list to the *promise* (either a *Promise* or a *SealedContract*) in the order that they were added. Returns the *Promises.Recorder* object.
applyAndClear(promise) | Applies the handler list to the *promise* (either a *Promise* or a *SealedContract*) and then clears the handler list. Returns the *Promises.Recorder* object.
clear() | Clears the handler list. Returns the *Promises.Recorder* object.

##### PROPERTIES

Property | Description
-------- | -----------
isaPromises | Returns *true*.
owner | Returns the owner of the *Promises.Recorder* object.
parent | Returns the parent (or owner) of the *Promises.Recorder* object.

#### Promises.Applier

Promises implementation that attaches settlement handlers to a native *Promise* that is managed by the owner of the *Promises.Applier* object.

Goto [Contract](#Contract), [SealedContract](#SealedContract), [ProxyPromise](#ProxyPromise), [AsyncPromise](#AsyncPromise), [LazyPromise](#LazyPromise), [Promises](#Promises), [Promises.Recorder](#Promises.Recorder)

##### COMPOSERS

Export | Description
------ | -----------
Promises.Applier(owner[,&nbsp;parent]) | Returns a new *Promises.Applier* object that is associated with the *owner* object. Optional *parent* (owner of *owner*) will default to *owner*.

##### CALLBACKS

Callback | Type | Description
-------- | ---- | -----------
promise | Property | Should contain the last *Promise* in the promise chain.
nextPromise(promise) | Method | Responsible for saving the new end of chain *promise* and performing any related management processing.
applyDefaultCatch() | Method | Optional method responsible for applying a default *onRejected* handler to the end of the promise chain. Owner may choose to defer this operation if the default *onRejected* handler will be attached at a later point in the life-cycle of the *promise*. If not present the default rejection handler is immediately attached.

##### METHODS

Method | Description
------ | -----------
then(onFulfilled[,&nbsp;onRejected]) | Attaches a new *onFulFilled* and optional *onRejected* handler to the owners *promise*. Invokes the owner's *nextPromise* callback. Returns the *Promises.Applier* object.
catch(onRejected) | Attaches a new *onRejected* handler to the owners *promise*. Invokes the owner's *nextPromise* callback. Returns the *Promises.Applier* object.
catch() | Attaches the default rejection handler to the owners *promise*. If the owner has a *applyDefaultCatch* method then the request is passed on to the owner. Call this to insert a default rejection handler for a settlement handler that is attached to a managed promise after it has been resolved or rejected.
finally(onFinally) | Attaches a new *onFinally* handler to the owners *promise*. invokes the owner's *nextPromise* callback. Returns the *Promises.Applier* object.

##### PROPERTIES

Property | Description
-------- | -----------
isaPromises | Returns *true*.
owner | Returns the owner of the *Promises.Recorder* object.
parent | Returns the parent (or owner) of the *Promises.Recorder* object.

### FUNCTIONS

Function | Description
-------- | -----------
setDefaultCatchHandler(fReject) | Sets the default rejection handler for the micosmo async package to *fReject*. WARNING: This is a global change.

### PROPERTIES

Property | Description
-------- | -----------
ExcecutorIsSynchronous | Returns *true* if a *Promise* executor is run synchronously.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
