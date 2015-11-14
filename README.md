# Manila

Manila is a template engine for Node. It's designed to be fast, simple, and pleasant to use. 

Documentation on using Manila with Express is coming shortly.

## Variables

`{{ <expression> }}`: This tag will be replaced with the HTML-escaped result of evaluating the expression or variable with the current context.

## Filters

`{{ <expression> | <filter> }}`: Filters can be used to modify the treatment of `<expression>`. At present, there are only two built-in filters:

`safe`: prevents HTML escaping the value. Use only when you can trust the content as code.
`skip`: prevents parsing of the tag. For example, `{{var|skip}}` would render `{{var|skip}}`.

## Includes

`{{ include <path/to/file> }}`: Includes the content of the named file as part of the current template. `<path/to/file>` is relative to `views/` by default, but the partials folder is configurable by passing `{ partials: 'path' }` to the `manila` function. Leave out the file extension - .mnla is assumed.

## Conditional Blocks

`{{ if <expression> }} ... {{ endif }}`: Renders the contained markup only if `<expression>` evaluates as truthy.

`{{ if <expression> }} ... {{ else }} ... {{ endif }}`: Renders the first block if `<expression>` is truthy, and the second block if `<expression>` is falsy.

Manila templates evaluate expressions as plain JavaScript, rather than implementing a custom expression parser. This has performance benefits, but it means that you can get unexpected results by writing expressions that throw JavaScript errors. Notably, be careful when using variables that may be undefined. For example, if you only want to render a block of content if value is falsy, you might try to use the following syntax:
```
{{ if !value }} ... {{ endif }}
```

Unfortunately, if `value` is undefined, then the expression `!value` will throw an Uncaught Reference error, and the expression will be treated as falsy. Like other template engines you may be familiar with, Manila provides a `not` operator to properly handle this scenario:
```
{{ if not value }} ... {{ endif }}
```

## Loops

#### Array Loops

`{{ for <item> in <array> }} ... {{ endfor }}`: Renders the contained markup once for each item in `<array>`. Within each loop, `{{<item>}}` will be replaced with the corresponding item in `<array>`.

#### Object Loops

`{{ for <key>.<value> in <object> }} ... {{ endfor }}`: Renders the contained markup once for each property on `<object>`. Within each loop, `{{<key>}}` will be replaced with the corresponding key in `<object>`, and `{{<value>}}` will be replaced with that key's value.
