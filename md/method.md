# @micosmo/toolbox/method

The *this* keyword in Javascript is a common root cause to many programming errors. The main reason for this is that the implicit binding of *this* only occurs when a non arrow function property of an object is invoked as a method. By method we mean that the function is referenced by the object '.' notation in the call expression. At any other time *this* will only be valid if a function (property or direct function reference) is either bound (*bind* call) or is called using the *call* function property and passing *this* as the first parameter.

One way of reducing programming errors and mitigating the impact of incorrect use of *this* is to implement a programming policy that restricts where *this* is permitted to be used.

The *method* service defined within supports a very restrictive policy of only permitting *this* to be referenced by functions that are defined within the scope of an object literal and will only be accessed by the object '.' notation when called. All other function definitions are considered non methods and should not reference *this*. Functions that interact with a primary object will require the primary object reference to be defined as the first argument.

This has important benefits as it ensures that the function can be called from anywhere and the primary focus of the function is explicitly declared and not tightly coupled to a implicit binding that may not be obvious. There is one shortcoming however, and that is that we may actially want to expose an external function as a method of an object.

The *method* service provides a decorator function that uplifts a function that has a primary object first argument to a method by automatically mapping *this* to the first parameter.

## API

### IMPORTING

```javascript
const { method } = require('@micosmo/toolbox/method');
```

### FUNCTIONS

<div style="width:175px">Function</div> | Description
-------- | -----------
method(f) | Return a new function that maps *this* to the first parameter of *f*.

```javascript
const { method } = require('@micosmo/toolbox/method');

const foo = {
  bar: method(fBar)
}

function fBar(o, n) {
  console.log(o, n);
}

foo.bar(100);
/*
  { bar: [function] } 100
*/
```

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
