# @micosmo/core/method

The *this* keyword in Javascript is a common root cause to many programming errors. The main reason is the implicit binding of *this* only occurs when a non arrow function property of an object is invoked as a method. By method we mean that the function is referenced by the object '.' notation in the call expression. At any other time *this* will only be valid if a function (property or direct function reference) is either bound (*bind* call) or is called using the *call* function property and passing the target *this* as the first parameter.

One way of reducing programming errors and mitigating the impact of incorrect use of functions that reference *this* is to implement a programming policy that limits the use of 'this' to explicitly defined methods. Explicit methods are:

1. Function definitions that are explicitly defined within the body of an object literal. If such definitons reference *this* then they are assumed to be a method. Inline object literal function definitions that do not reference *this* are assumed to be normal functions assigned to a property of the object.
2. Function definitions that are defined outside of the body of an object literal that are explcitly declared as a method. Such definitions can be assigned to object properties and behave as a method. See *declareMethod* and *declareMethods* decorator functions.
3. Normal functions that accept a target object as the first parameter and are explicitly promoted to a method and assigned to an object property. See *asDeclaredMethod* decorator function.

Example codeing style:

```javascript
  declareMethods(meth1, meth2, ...); // At top of module
  ...
  const myObject = {
    meth1: method(meth1), // Requires that 'meth1' is a method and has been declared
    meth2: checkThis(method(meth2)), // 'meth2' must be a method and makes sure that when called there is a valid 'this'
    meth3: asDeclaredMethod(f1), // Promotes 'f1' to be a method. Maps 'this' to arg0
    ...
  };
  ...
  method(meth1); // Defines the function 'meth1' as a method and makes sure that it is declared
  function meth1() {
    ...
  }
```

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
checkThis(v) | Performs an immediate check of *v* and throws an error if *v* is set to the default *this* for the current javascript execution environment and mode. This call can be imbedded in a function in preference to wrapping the function. Returns *v*.
checkThis(f, true) | As for *checkThis(v)*, i.e. *f* is treated as a value. Returns *f*.
declareMethod(f) | Marks *f* as a method function. Returns *f*.
isaDeclaredMethod | Returns a boolean indicating whether the function is a declared method.
method(f) | Defines *f* as a method and checks that it has been declared. Returns *f*. As of *core* package version 0.2.0, *method* no longer promotes non methods to methods.

### EXAMPLE

```javascript
const { asDeclaredMethod, checkThis, declareMethod, declareMethods, method } = require('@micosmo/core/method');

declareMethods(meth1, meth4);

const foobar = {
  name: 'foobar',
  meth1: method(meth1), // Declared method
  meth2: asDeclaredMethod(f), // Function 'f' promoted to a method
  meth3: declareMethod(function () { // Optionally delare an inline function as a method.
    console.log('meth3: Object Name =', this.name);
  }),
  meth4: checkThis(method(meth4)), // Wrap method to validate 'this' value.
  meth5: declareMethod(meth5) // Can declare external functions as methods inline but must occur before method definition
}

method(meth1); // Defines as a method and validates declaration
function meth1() {
  console.log('meth1: Object Name =', this.name);
}

function f(o) {
  console.log('f: Object Name =', o.name);
}

method(meth4); // Defines as a method and validates declaration
function meth4() {
  console.log('meth4: Object Name =', this.name);
}

method(meth5); // Defines as a method and validates declaration
function meth5() {
  checkThis(this); // Inline check to enure that 'this' is valid
  console.log('meth5: Object Name =', this.name);
}


foobar.meth1();
/*
  meth1: Object Name = foobar
*/
foobar.meth2();
/*
  f: Object Name = foobar
*/
foobar.meth3();
/*
  meth3: Object Name = foobar
*/
foobar.meth4();
/*
  meth3: Object Name = foobar
*/
foobar.meth5();
/*
  meth3: Object Name = foobar
*/
try {
    const f = foobar.meth4;
    f();
} catch (err) {
    console.log('meth4: Failed with error:', err.message);
}
/*
  meth4: Failed with error: micosmo:method:checkThis: Attempting to call a method as a function. Require o.method(...), method.bind(o)(...) or method.call(o, ...)
*/
try {
    const f = foobar.meth5;
    f();
} catch (err) {
    console.log('meth5: Failed with error:', err.message);
}
/*
  meth5: Failed with error: micosmo:method:checkThis: Inline - Attempting to call a method as a function. Require o.method(...), method.bind(o)(...) or method.call(o, ...)
*/
```

## HISTORY

### Version 0.2.0
* Rework of interface to improve usability.
* Main change to *method* function which no longer promotes non methods to methods. Now throws an error if method has not been declared.

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
