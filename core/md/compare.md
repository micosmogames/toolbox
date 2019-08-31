# @micosmo/core/compare

Value comparison services.

## API

### IMPORTING

```javascript
var { equivalent, ... } = require('@micosmo/core/compare');
```

### EXPORTS

#### FUNCTIONS

Function | Description
-------- | -----------
equivalent(a1,&nbsp;a2) | Compares *v1* and *v2* for equivalence.
equivalentArrays(a1,&nbsp;a2) | As for *equivalent* but assumes that the values are arrays.
equivalentObjects(a1,&nbsp;a2) | As for *equivalent* but assumes that the values are objects but not arrays or functions.

#### PROPERTIES

None

#### NOTES
* All value types can be compared.
* Values are considered equivalent if they have the same type and value(s).
* Arrays and objects are recursively processed, and recursive references are detected.
* *null* and *undefined* are considered equivalent.
* Equivalent objects must have the same prototype.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
