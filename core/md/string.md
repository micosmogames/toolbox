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
append(s) | Appends a string segment. Argument *s* is cast to a String.
atGet(idx) | Return the *StringBuilder* segment at *idx* position.
atPut(idx, s) | Assign string representation of *s* to the *Stringbuilder* segment at *idx* position. Returns the *StringBuilder*.
charAt(idx) | Return the character at *idx* position.
clear() | Clear and initialise the StringBuilder. Returns *Stringbuilder*.
length() | Return the length of the current string being built.
pop() | Pop and return the last segment appended.
segmentCount() | Return the current number of string segments.
shift() | Remove and return the first segment.
splice(...args) | See *String.prototype.splice*.
substr(...args) | See *String.prototype.substr*. Note that *String.prototype.substr* may be removed in a future release of Javascript.
substring(...args) | See *String.prototype.substring*.
toString() | Return a string resulting from joining the string segments.

##### PROPERTIES

Property | Description
-------- | -----------
isaStringBuilder | Returns *true*.
name | Returns the name of the object ('StringBuilder'). Deprecated - use *isaStringBuilder*.

### FUNCTIONS

Function | Description
-------- | -----------
skipRight(s[,&nbsp;iStart]) | Returns an adjusted *iStart* by skipping whitespace to the right in *s* starting at *iStart* (defaults to 0). .
skipLeft(s[,&nbsp;iEnd]) | Returns an adjusted *iEnd* by skipping whitespace to the left in *s* starting at *iEnd* (defaults to *s.length - 1*). .
skip(s[,&nbsp;iStart[,&nbsp;iEnd]]) | Skips whitespace in *s* from the right starting at *iStart* and to the left starting at *iEnd*. Returns adjusted *iStart* and *iEnd* values in a static array. Typically a *skip* call be used in an expression similar to ```[iStart, iEnd] = skip(<string>, iStart, iEnd)```.
parseNameValues(s[,&nbsp;oTgt[,&nbsp;sep]]) | Returns *oTgt* after populating *oTgt* with name value pairs contained in *s*. String format is a sequence of ```[:<sep>] [(<ty>)|([<ty>])] <name> : <value> <sep>``` where *sep* (; default) is the separator between name/value pairs and *ty* is the type of value to output. See [ParseNameValues.Types](#ParseNameValues.Types) for more detail. If *oTgt* is not provided then *parseNameValues* will create a return object. The *sep* argument is the initial separator and defaults to semi-colon (;). Note that when ```:<sep>``` is encountered the new separator *sep* will apply until the end of *s* or another separator is defined. A separator definiton of ```::``` will restore the parse to the initial separator passed to *parseNameValues*.

#### ParseNameValues.Types

Type | Description
---- | -----------
s | Returns a string that is left and right trimmed of whitespace.
rs | Returns the raw string. No whitespace is removed.
i | Returns an integer number.
n | Returns a number.
b | Returns a boolean value of *true* or *false*.
v2 | Returns an { x, y } vector object with input of the form '&lt;x&gt;&nbsp;&lt;y&gt;'. Missing values are set to 0.
v3 | Returns an { x, y, z } vector object with input of the form '&lt;x&gt;&nbsp;&lt;y&gt;&nbsp;&lt;z&gt;'. Missing values are set to 0.
v4 | Returns an { x, y, z, w } vector object with input of the form '&lt;x&gt;&nbsp;&lt;y&gt;&nbsp;&lt;z&gt;&nbsp;&lt;w&gt;'. Missing values are set to 0.

##### Notes:
  * Type *s* is the default.
  * The type specification ```([<ty>])``` defines that the input is an array of *ty* with values separated by a comma (,).

## HISTORY

### Version 0.2.0
* Added *parseNameValues* as a simple css style formatted string parser that includes imbedded types and separator specification.
* Changes to *Stringbuffer* to get and put individual segments. Change *atGet* to *charAt* for consistency. *atGet* now returns segment.
* *name* property deprecated, replaced by *isaStringBuilder* property.
* Added *skip*, *skipRight*, *skipLeft* for adjusting indicies within a string that contain leading to trailing whitespace.

## LICENSE

ISC - Internet Systems Consortium

Copyright 2019 Micosmo ([www.micosmo.com](http://www.micosmo.com))

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
