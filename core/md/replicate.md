# @micosmo/core/replicate

A set of functions for assigning, copying and cloning Javascript objects at both a descriptor and value level. The services are also integrated with the *private* properties mechanism provided by *@micosmo/core/private*[./private.md], allowing copy and clone operations to be extended to the private properties.

Note that the replication services will accept any javascript data type. Types that cannot be copied or cloned are returned asis. Arrays are supported.

## API

### IMPORTING

```javascript
const replicate = require('@micosmo/core/replicate');
```
or
```javascript
const { copy, clone, ... } = require('@micosmo/core/replicate');
```

### EXPORTS

Function | Description
-------- | -----------
assign(from[,&nbsp;to]) | Descriptor level assignment from the *from* object to the *to* object. If not provided a *to* object will be created. Returns the *to* object.
openAssign(from[,&nbsp;to]) | As for *assign* except that the descriptors are set to *configurable*.
closedAssign(from[,&nbsp;to]) | As for *assign* except that the descriptors are set to not *configurable*.
assignValues(from[,&nbsp;to]) | Equivalent to *Object.assign*, except that a *to* object will be created if not provided. Returns the *to* object.
copy(from[,&nbsp;to]) | Descriptor level copy of the *from* object. A target *to* object can be provided. Includes *private* properties. Returns the *to* object.
openCopy(from[,&nbsp;to]) | As for *copy* except that the descriptors are set to *configurable*.
closedCopy(from[,&nbsp;to]) | As for *copy* except that the descriptors are set to not *configurable* anf the target object is sealed.
copyValues(from[,&nbsp;to]) | Similar to *assignValues* except the function call would normally create the *to* object. Returns the *to* object.
reverseCopy(from) | Returns a  reverse copy of an array. If *from* is any other data type then request is passed to *copy*.
clone(from[,&nbsp;to]) | Descriptor level clone of the *from* object. A target *to* object can be provided. Includes *private* properties. Returns the *to* object. The clone process is effectively a deep copy, with circular or duplicate references mapped to a single cloned value. Returns the *to* object.
openClone(from[,&nbsp;to]) | As for *clone* except that the descriptors are set to *configurable*.
closedClone(from[,&nbsp;to]) | As for *clone* except that the descriptors are set to not *configurable* and the target object is sealed.
cloneValues(from[,&nbsp;to]) | As for *clone* except the deep copy is based on the values only.

### NOTES

#### MICOPY & MICLONE

Object values may inject their own behaviour for copying and cloning by defining a *micopy* or *miclone* method. The replication process will pass control to *micopy* or *miclone* to complete the operation for the given object. They must return a value that represents the copied or cloned version of the object. Any value can be returned including the original object.

The *micopy* and *myclone* methods are passed a *context* object that defines the replication process that has been requested. The *context* contains two properties that are of interest to the target object:


Property | Description
-------- | -----------
replicate(from[,&nbsp;to]) | A function that calls the context's replication processor to replicate the *from* value. A target *to* object can also be provided if the *from* value is an object.
copyContext | *miclone* context parameter only. The alternate matching context for copying values instead of cloning.
cloneContext | *micopy* context parameter only. The alternate matching contect for cloning values instead of copying.

##### Example: No replication

```javascript
  {
    ...
    micopy() { return this },
    miclone() { return this },
    ...
  }
```

##### Example: Copy must clone

```javascript
  {
    ...
    micopy(ctxt) { return ctxt.cloneContext.replicate(this) },
    ...
  }
```

##### Example: Partial copy

```javascript
  {
    foo: 1,
    bar: 2,
    _temp: ...,
    micopy(ctxt) { 
      return {
        foo: this.foo,
        bar: this.bar        
      };
    }
  }
```

##### Example: Partial clone

```javascript
  {
    foo: { ... },
    bar: { ... },
    _temp: ...,
    miclone(ctxt) { 
      return {
        foo: ctxt.replicate(this.foo),
        bar: ctxt.replicate(this.bar)
      };
    }
  }
```

#### PUBLIC ONLY REPLICATION

The *copy* and *clone* group of functions can also perform public level only copy or clone operations, via a *public* function that is a property of the required *copy* or *clone* function . In this case any *private* properties are not replicated. See example below.

```javascript
const fPrivate = require('@micosmo/core/private').newPrivateSpace();
const foo = {
  a: 1,
  b: 2
};
fPrivate.setObject(foo, {
  x: 11,
  y: 12
});
const fooCopy = copy(foo); // Both public and private properties of 'foo' are replicated.
const fooPublicCopy = copy.public(foo); // Only the public properties of 'foo' are replicated.

console.log(fooCopy, Private(fooCopy));
/*
  {
    a: 1,
    b: 2
  }
  { 
    x: 11,
    y: 12
  }
*/
console.log(fooPublicCopy, Private(fooPublicCopy))
/*
  {
    a: 1,
    b: 2
  }
  { }
*/
```
## HISTORY

### Version 0.1.1
* Replicate context table was assigned the incorrect alternate context for public only replication contexts.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
