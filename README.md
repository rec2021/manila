# Manila

Manila is a template engine for Node. By at least [one benchmark](https://github.com/baryshev/template-benchmark), it is the fastest template engine tested at the time of writing:
```javascript
// rendering 100000 templates
1) manila               - 902ms
2) ECT                  - 1082ms
3) Gaikan               - 1367ms
4) Fest                 - 1514ms
5) Dust                 - 1579ms
6) doT                  - 1751ms
7) Hogan.js             - 1916ms
8) EJS without `with`   - 2660ms
9) Swig                 - 3607ms
10) Eco                 - 4077ms
11) Handlebars.js       - 4082ms
12) Underscore          - 4243ms
13) EJS                 - 5481ms
14) Jade without `with` - 5936ms
15) CoffeeKup           - 7622ms
16) Jade                - 18776ms
```

Manila was developed using ES2015 features and currently requires Node version 4.0.0 or later.

# Installation
```
npm install manila
```

# Use with Express

```javascript
// index.js
const app = require('express')(),
	manila = require('manila')();

app.get('/', (req, res) => {
	res.render('index', {
		message: 'Hello, world!'
	});
});

// Pass Manila to Express
app.engine('mnla', manila);
// Register Manila as a view engine
app.set('view engine', 'mnla');
// Set the views directory
app.set('views', './views');

app.listen(3000);
```

```html
<!-- views/index.mnla -->
<h1>{{message}}</h1>
```

Run `node .` and open `http://localhost:3000` in your browser to see the rendered result.

# Use with vanilla Node

```javascript
// index.js
const http = require('http'),
	manila = require('manila')();

http.createServer((req, res) => {

	manila(__dirname + 'views/index.mnla', { message: 'Hello, world!' }, (err, html) => {
		res.writeHead(200, 'text/html; charset=UTF-8');
		res.end(html);
	});

}).listen(3000);
```

```html
<!-- views/index.mnla -->
<h1>{{message}}</h1>
```

## Configuration

The Manila module accepts a configuration object with the following optional properties:

`root`: the absolute path to the root of your app. Defaults to the directory which contains the application entry point.

`views`: the path to the directory in which to look for views, relative to the root. Defaults to 'views'.

`partials`: the directory in which to look for partial mnla files to use with `{{include ... }}` tags, realtive to the root. Defaults to the same directory as the `views` setting.

`extension`: the file extension of your views/partials. Defaults to `'.mnla'`.

```javascript
// defaults:
const manila = require('manila')({
	root: path.dirname(require.main.filename),
	views: 'views',
	partials: 'views',
	extension: '.mnla'
});
```

## Variables

`{{ <expression> }}`: This tag will be replaced with the HTML-escaped result of evaluating the expression or variable with the current context.

## Filters

`{{ <expression> | <filter> }}`: Filters can be used to modify the treatment of `<expression>`. At present, there are only two built-in filters:

`safe`: prevents HTML escaping the value. Use only when you can trust the content as code.

`skip`: prevents parsing of the tag. For example, `{{var|skip}}` would render `{{var}}`.

## Includes

`{{ include <path/to/file> }}`: Includes the content of the named file as part of the current template. `<path/to/file>` is relative to `views/` by default, but the partials folder is configurable by passing `{ partials: 'path' }` to the `manila` function. 

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

## Use with Angular

Manila's double curly brace syntax is the same as Angular's tag syntax. If you try to write an Angular template as a Manila view, it will be interpolated by Manila before Angular gets it. You can get around this by using the `skip` filter on the tags you want to leave unparsed by Manila.

