# @micosmo/core/method

The *this* keyword in Javascript is a common root cause to many programming errors. The main reason is the implicit binding of *this* only occurs when a non arrow function property of an object is invoked as a method. By method we mean that the function is referenced by the object '.' notation in the call expression. At any other time *this* will only be valid if a function (property or direct function reference) is either bound (*bind* call) or is called using the *call* function property and passing the target *this* as the first parameter.

One way of reducing programming errors and mitigating the impact of incorrect use of functions that reference *this* is to implement a programming policy that limits the use of 'this' to explicitly defined methods. Explicit methods are:

1. Function definitions that are explicitly defined within the body of an object literal. If such definitons reference *this* then they are assumed to be a method. Inline object literal function definitions that do not reference *this* are assumed to be normal functions assigned to a property of the object.
2. Function definitions that are defined outside of the body of an object literal that are explcitly declared as a method. Such definitions can be assigned to object properties and behave as a method. See *declareMethod* decorator function.
3. Normal functions that accept a target object as the first parameter and are explicitly promoted to a method and assigned to an object property. See *asDeclaredMethod* decorator function.

## API

### IMPORTING

```javascript
const { declareMethod, method, ... } = require('@micosmo/core/method');
```

### EXPORTS

Function | Description
-------- | -----------
asDeclaredMethod(f) | Returns a method function that wraps *f* that is assumed to accept a target object as the first argument. The promoted function passes *this* as the first parameter to *f*.
checkThis(f) | Returns a new *wrapper* method function that validates the *this* binding of the method function *f* (*f* will be promoted to a method if required). The *wrapper* method will throw an error if the *this* value is set to the default *this* for the current javascript execution environment and mode. Enforces the requirement for an explicit *this* value be bound to the method by either invoking as *object.method(...)*, *method.bind(object)(...)* or *method.call(object, ...)*. The wrapped method function *f* is assigned to the *method* property of the returned function.
checkThis(o) | Performs an immediate check of *o* and throws an error if *o* is set to the default *this* for the current javascript execution environment and mode. This call can be imbedded in a function in preference to wrapping the function. Returns *o*.
declareMethod(f) | Marks *f* as a method function. Returns *f*.
isaDeclaredMethod | Returns a boolean indicating whether the function is a declared method.
method(f) | Returns a method function that expects a *this* binding. Returns *f* if *f* is already a method or promotes *f* to a method by calling *asDeclaredMethod*. Typically *method* will be employed to assign external methods to object properties.

### EXAMPLE

```javascript
const { asDeclaredMethod, declareMethod, method } = require('@micosmo/core/method');

const meth1 = declareMethod(function () {
  console.log('meth1: Object Name =', this.name);
});

const meth2 = asDeclaredMethod(function (o) {
  console.log('meth2: Object Name =', o.name);
});

function meth3(o) {
  console.log('meth3: Object Name =', o.name);
};

const foobar = {
  name: 'foobar',
  meth1: method(meth1), // Declared method
  meth2: method(meth2), // Declared promoted method
  meth3: method(meth3) // Implicitly promoted method
}

foobar.meth1();
/*
  meth1: Object Name = foobar
*/
foobar.meth2();
/*
  meth2: Object Name = foobar
*/
foobar.meth3();
/*
  meth3: Object Name = foobar
*/
```

## HISTORY

### Version 0.1.1
* 'isGlobalThis' moved to object.js

### Version 0.1.1
* Removed automatic wrapping of methods with validation of *this* in *declaredMethod* and *asDeclaredMethod*. Methods now carry and retain an *isaDeclaredMethod* flag.
* Added *checkThis* function to either wrap a method or perform inline *this* validation.
* Removed method unwrapping from *method* function.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
