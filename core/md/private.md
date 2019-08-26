# @micosmo/core/private

Provides a service for creating private properties for a public object. Private properties are contained in a private object that is associated (loosely coupled) to a public object. Each private object is created within the scope of a private space. A private space is represented by an accessor function that can create and return the private object for any public object within that private space. The accessor function is effectively a private key to the private data. Without the private accessor function the private properties of an object are not visible nor can be accessed. An accessor function can be shared allowing broader but still limited visibility of the private properties.

An object can have private properties in one or more private spaces, each with their own unique accessor function. In this case each private space has no knowledge or visiblilty to a public object's private object in another private space. They are completely independent and decoupled.

For the most part however an object will have a single set of private properties that have been assigned by the creating module, with the module defining a single private space.

## API

### IMPORTING

```javascript
const { newPrivateSpace } = require('@micosmo/core/private');
```

### EXPORTS

Function | Description
-------- | -----------
newPrivateSpace() | Creates a new private space and returns a unique accessor function (*fPrivate*).
*fPrivate*(o) | Returns the private object of *o* from the *fPrivate* private space. Will create the private object if it does not exist.
*fPrivate*.setObject(o,&nbsp;oPrivate) | Sets the private object for *o* to *oPrivate* in the *fPrivate* private space. Will replace an existing private object. Returns *o*.
*fprivate*.exists(o) | Returns a boolean indicating if *o* has private properties in the *fPrivate* private space.

```javascript
const fPrivate = require('@micosmo/core/private').newPrivateSpace();

function createMyObject() {
  return fPrivate.setObject({
    adder(num) {
      return (num + fPrivate(this).foo);
    }
  },
  {
    foo: 1000;
  });
}

let bar = createMyObject();
console.log(bar.adder(12), bar.foo, fPrivate(bar).foo);
/*
    1012 undefined 1000
*/
```

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
