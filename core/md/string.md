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
parseNameValues(s[,&nbsp;oTgt[,&nbsp;options]]) | Returns *oTgt* after populating *oTgt* with name value pairs contained in *s*. String format is a sequence of ```[;<eSep> | :<nvSep> | ,<vSep>]... [(<ty>)|([<ty>])] <name> <nvSep> <value> <eSep>```. See [ParseNameValues.Options](#ParseNameValues.Options) for more detail on the processing *options*. *&lt;eSep&gt;* is the separator between name/value entries, *&lt;nvSep&gt;* is the separator between name and value of an entry, and *&lt;vSep&gt;* is the separator between the values of an array type. *ty* is the type of value to output, see [ParseNameValues.Types](#ParseNameValues.Types) for more detail. If *oTgt* is not provided then *parseNameValues* will create a return object. Separators may be any operator, separator or whitespace characters. If *vSep* is set to a whitespace character then any leading occurrences of *vSep* are treated as whitespace. For example the formated string ```', ([rs])val: foo bar'``` will return ```{ val: [' foo', 'bar']}```

#### ParseNameValues.Options

Option | Default | Description
------ | ------- | -----------
entrySeparator | ';' | Character seperating name/value entries.
nameValueSeparator | ':' | Character separating an entries' name and value.
valuesSeparator | ',' | Character seperating array values.
appendDuplicates | false | Set to *true* to append duplicate named entry values to an array, otherwise overwrite.


#### ParseNameValues.Types

Type | Description
---- | -----------
b | Returns a boolean value of *true* or *false*.
f | Returns a floating point number.
i | Returns an integer number.
s | Returns a string that is left and right trimmed of whitespace.
t | Returns a raw text string. No whitespace is removed.
v2 | Returns an { x, y } vector object with input of the form '&lt;x&gt;&nbsp;&lt;y&gt;'. Missing values are set to 0.
v3 | Returns an { x, y, z } vector object with input of the form '&lt;x&gt;&nbsp;&lt;y&gt;&nbsp;&lt;z&gt;'. Missing values are set to 0.
v4 | Returns an { x, y, z, w } vector object with input of the form '&lt;x&gt;&nbsp;&lt;y&gt;&nbsp;&lt;z&gt;&nbsp;&lt;w&gt;'. Missing values are set to 0.

##### Notes:
  * Type *s* is the default.
  * The type specification ```([<ty>])``` defines that the input is an array of *ty* with values separated by *&lt;vSep&gt;*.

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
