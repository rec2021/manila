# Manila

Manila is a no-frills template engine for Node 4+.

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
<h1><:message:></h1>
```

Run `node index` and open `http://localhost:3000` in your browser to see the rendered result.

# Use with vanilla Node

```javascript
// index.js
const http = require('http'),
	manila = require('manila')();

http.createServer((req, res) => {

	manila('index.mnla', { message: 'Hello, world!' }, function(err, html) {
		res.writeHead(200, 'text/html; charset=UTF-8');
		res.end(html);
	});

}).listen(3000);
```

```html
<!-- views/index.mnla -->
<h1><: message :></h1>
```

# Promise Support

When calling `manila`, you can either provide a callback or use a promise. The following is effectively the same as the example above:

```javascript
// index.js
const http = require('http'),
	manila = require('manila')();

http.createServer((req, res) => {

	manila('index.mnla', { message: 'Hello, world!' })
		.then(html => {
			res.writeHead(200, 'text/html; charset=UTF-8');
			res.end(html);
		}).catch(err => {
        	console.trace(err);
        });

}).listen(3000);
```

## Configuration

The Manila module accepts a configuration object with the following optional properties:

`root`: the absolute path to the root of your app. Defaults to the directory which contains the application entry point.

`views`: the path to the directory in which to look for views, relative to the root. Defaults to 'views'.

`partials`: the directory in which to look for partial mnla files to use with `<: include ... :>` tags, realtive to the root. Defaults to `views`.

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

`<: expression :>`: This tag will be replaced with the HTML-escaped result of evaluating the expression or variable with the current context. 

`<:: expression ::>`: Use two colons instead of one to prevent HTML-escaping of the expression.

## Includes

`<: include path/to/file :>`: Includes the content of the named file as part of the current template. `path/to/file` is relative to `views/` unless overwritten during configuration.

## Blocks

Manila tags are executed as plain 'ol JavaScript, so there's no template language to learn. While you can use any JavaScript you want, here are some examples:

#### Conditionals
```
<: if (expression) { :>
	<p>This markup renders if expression is truthy</p>
<: } else { :>
	<p>This markup renders if expression is falsy</p>
<: } :>
```

#### Array Loops

```
<: list.forEach(item => { :>
	<li><: item :></li>
<: }) :>
```

#### Object Loops

```
<: for (key in obj) { :>
	<li> <: key :> is <: obj[key] :> </li>
<: } :>
```
