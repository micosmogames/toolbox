# @micosmo/core/character

A collection of functions for determining ucs-2 character types.

Note: Currently only supports the ascii representation of alphas and digits.

## API

### IMPORTING

```javascript
const character = require('@micosmo/core/character');
```
or
```javascript
const { isAlpha, isDigit, ... } = require('@micosmo/core/character');
```

### EXPORTS

Function | Description
-------- | -----------
isAlpha(ch) | Tests *ch* is in the ascii alphabet range.
isDigit(ch) | Tests *ch* is a digit from 0-9.
isAlphaNumeric(ch) | Tests *ch* is either a alpha or a digit.
isNumeric(ch) | Tests *ch* has a numeric value. Currently only tests for digits.
isControl(ch) | Tests *ch* is a device control character such as a form feed.
isOperator(ch) | Tests *ch* is a operator type character.
isWhitespace(ch) | Tests *ch* is whitespace.
isSpecial(ch) | Tests *ch* is not a alpha, digit, operator, whitespace or bell character.
isEndOfLine(ch) | Tests *ch* represents end of a line
isEndOfStream(ch) | Tests *ch* represents end of a stream

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
