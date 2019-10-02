# @micosmo/core/string

String services.

## API

### IMPORTING

```javascript
const { StringBuilder, ... } = require('@micosmo/core/string');
```

or 

```javascript
const { StringBuilder, ... } = require('@micosmo/core');
```

### OBJECTS

#### StringBuilder

##### COMPOSERS

Export | Description
-------- | -----------
StringBuilder() | Returns a new StringBuilder helper object that joins one or more string segments into a single string. String concatenation is delayed until the full string is required using the array join method to construct the string.

##### METHODS

Method | Description
------ | -----------
name() | Returns the name of the object ('StringBuilder'). 
append(s) | Appends a string segment. Argument *s* is cast to a String.
pop() | Pop the last segment appended.
clear() | Clear and initialise the StringBuilder
atGet(idx) | Return the character at the specified index position
length() | Return the length of the current string being built
segmentCount() | Return the current number of string segments
toString() | Return a string resulting from joining the string segments
substr(...args) | See String.substr
substring(...args) | See String.substring
splice(...args) | See String.splice

### FUNCTIONS

Function | Description
-------- | -----------
parseNameValues(s[,&nbsp;oTgt[,&nbsp;sep]]) | Returns *oTgt* after populating *oTgt* with name value pairs contained in *s*. String format is a sequence of ```[:<sep>] [(<ty>)|([<ty>])] <name> : <value> <sep>``` where *sep* (; default) is the separator between name/value pairs, *ty* (*s* default) is the type of value to output. Type can be *s* for a trimmed string, *rs* for a raw string, *i* for integer, *n* for number, *b* for boolean and *v3* for a THREE.Vector3 or array if THREE not available. Type ```([<ty>])``` specifies that the value is an array of type *ty*, with values separated by a comma (,). If *oTgt* is not provided then *parseNameValues* will create a return object. The *sep* argument is the initial separator and defaults to semi-colon (;). Note that when ```:<sep>``` is encountered the new separator *sep* will apply until the end of *s* or another separator is defined. A separator definiton of ```::``` will restore the parse to the initial separator (or default) passed to *parseNameValues*.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
