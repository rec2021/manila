'use strict';

const read = require('fs').readFile,
    vm = require('vm'),
    path = require('path'),
    rx = {
        include: /{{\s*?include\s(\S*?)\s*?}}/i,
        variable: /{{([\s\S]*?)}}/,
        forIn: /{{\s*?for\s*?\S*?\s*?in\s*?\S*?\s*?}}/i,
        endFor: /{{\s*?endfor\s*?}}/i,
        ifBlock: /{{\s*?if\s*?[\s\S]*?\s*?}}/i,
        endIf: /{{\s*?endif\s*?}}/i,
        elseBlock: /{{\s*?else\s*?}}/i
    },
    escapeMap = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&apos;'
    },
    unescapeMap = {
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&apos;': '\''
    };

/*---------------- Utility functions ----------------*/

function run(expression, context) {
    return vm.runInNewContext(expression, context, {
        timeout: 1000
    });
}

function htmlEscape(str) {
    return str.replace(/[&<>'"]/g, c => {
        return escapeMap[c];
    });
}

function htmlUnescape(str) {
    return str.replace(/(&lt;)(&gt;)(&quot;)(&apos;)/g, c => {
        return unescapeMap[c];
    });
}

/*---------------- Parsing functions ----------------*/

function parseVars(template, context, match) {

    let value,
        raw = match[0],
        filters = match[1].split('|'),
        ref = filters.shift(0);

    filters.forEach(function(filter, i) {
        filters[i] = filter.replace(/\s/g, '');
    });

    if (filters.indexOf('skip') !== -1) {

        value = '&lcub;&lcub;' + ref + '&rcub;&rcub;';

    } else {

        try {
            value = run(ref, context);
            if (typeof value === 'string') {
                if (filters.indexOf('safe') !== -1) {
                    //value = htmlUnescape(value);
                } else {
                    value = htmlEscape(value);
                }
            } else if (value === undefined) {
                value = '';
            }
        } catch(err) {

            value = '';
        }
    }

    return render(template.replace(raw, value), context);
}

function parseLoops(template, context, match) {

    let raw     = match[0],
        index   = match[1],
        arrName = match[2],
        html    = match[3],
        list    = [],
        output  = '',
        key,
        subContext = Object.create(context);

    try {
        list = run(arrName, context);
    }
    catch(err) {}

    if (index.indexOf('.') !== -1) {
        let keys = index.split('.');
        index = keys[0];
        key = keys[1];
    }
    
    if (list) {
        Object.keys(list).forEach(function(value) {
            if (key) {
                subContext[index] = value;
                subContext[key] = list[value];
            } else {
                subContext[index] = list[value];
            }
            output += render(html, subContext);
        });
    }

    return render(template.replace(raw, output), context);
}

function parseIfs(template, context, match) {

    let raw = match[0],
        expression = match[1].trim(),
        html = match[2],
        doShow,
        negate;

    if (expression.indexOf('not ') === 0) {
        negate = true;
        expression = expression.substring(3).trim();
    }

    html = html.split(rx.elseBlock);

    try {
        doShow = run(expression, context);
    }
    catch(err) { }

    if (negate) {
        doShow = !doShow;
    }

    if (doShow) {
        html = html[0];
    } else if (html[1]) {
        html = html[1];
    } else {
        html = '';
    }

    return render(template.replace(raw, html), context);
}

// Recursively asyncronously parses partial includes
// then calls the callback with the result
function parseIncludes(template, callback, opts) {

    let match = rx.include.exec(template),
        raw, include;

    if (match !== null) {

        raw  = match[0];
        include = opts.partialsDir + match[1];

        if (!include.match(new RegExp(opts.extension + '$'))) {
            include += opts.extension;
        }
        
        read(include, { encoding: 'utf8' }, function(err, html) {
            parseIncludes(template.replace(raw, html), callback, opts);
        });
    } else {
        callback(template);
    }
}

/*---------------- Regex generating functions ----------------*/

// In order to support nesting, we need to dynamically build
// a regex that ignores the correct number of closing tags.
function getLoopRegx(template) {
    
    let result,

        secondHalf = template.split(rx.forIn)[1];

    if (!secondHalf) {

        result = false;
    // If another for-in loop starts before this one is closed...
    } else if (secondHalf.search(rx.forIn) < secondHalf.search(rx.endFor)) {
        // use lazy matching
        result = /{{\s*?for\s*?(\S*?)\s*?in\s*?(\S*?)\s*?}}([\s\S]*?){{\s*?endfor\s*?}}/i;

    } else {
        // use greedy matching
        result = /{{\s*?for\s*?(\S*?)\s*?in\s*?(\S*?)\s*?}}([\s\S]*){{\s*?endfor\s*?}}/i;
    }
    
    return result;
}

function getIfRegx(template) {

    let result,
        match = rx.ifBlock.exec(template);

    if (match) {

        let secondHalf = template.substring(template.search(rx.ifBlock) + match[0].length);

        // If another if block starts before this one is closed...
        if (secondHalf.search(rx.ifBlock) < secondHalf.search(rx.endIf)) {
            // use greedy matching
            result = /{{\s*?if\s*?([\s\S]*?)\s*?}}([\s\S]*){{\s*?endif\s*?}}/i;

        } else {
            // use lazy matching
            result = /{{\s*?if\s*?([\s\S]*?)\s*?}}([\s\S]*?){{\s*?endif\s*?}}/i;
        }
    }
    
    return result;
}

/*---------------- Main rendering function (syncronous) ----------------*/

function render(template, context) {

    let match, regx,

        loopFirst = template.search(rx.forIn) < template.search(rx.ifBlock);

    if (loopFirst) {

        regx = getLoopRegx(template);

        if (regx) {

            template = parseLoops(template, context, regx.exec(template));
        }

        regx = getIfRegx(template);

        if (regx) {

            template = parseIfs(template, context, regx.exec(template));
        }
        
    } else {

        regx = getIfRegx(template);

        if (regx) {

            template = parseIfs(template, context, regx.exec(template));
        }

        regx = getLoopRegx(template);

        if (regx) {

            template = parseLoops(template, context, regx.exec(template));
        }
    }

    match = rx.variable.exec(template);

    if (match) {
        template = parseVars(template, context, match);
    }

    return template;
}

/*---------------- Manila ----------------*/

function manila(opts) {

    let partialsDir,
        viewsDir,
        root,
        extension = '.mnla';

    root = opts.root || path.dirname(require.main.filename);
    viewsDir = path.join(root, 'views');
    viewsDir = path.join(opts ? opts.views || viewsDir : viewsDir, '/');
    partialsDir = path.join(root, opts ? opts.partials || viewsDir : viewsDir, '/');
    extension = opts.extension ? '.' + opts.extension : extension;
    extension = extension.replace('..', '.');

    // By creating and returning a closure we can support multiple
    // "instances" of manila with different configurations running
    // in one app. All configurable variable references go here:
    function compile(filepath) {

        return new Promise((resolve, reject) => {
            // Support paths relative to views directory
            if (filepath.indexOf(root) !== 0) {
                filepath = path.join(root, viewsDir, filepath);
            }

            read(filepath, { encoding: 'utf8' }, function(err, template) {

                if (err) {
                    reject(err);
                } else {
                    
                    parseIncludes(template, fullTemplate => {
                        resolve(fullTemplate);
                    }, {
                        partialsDir: partialsDir,
                        extension: extension
                    });
                }
            });
        });
    }
    
    function parse(filepath, context, callback) {

        compile(filepath)
            .then(template => {
                callback(undefined, render(template, context));
            })
            .catch(error => {
                callback(error);
            });
    }

    return parse;
}

module.exports = opts => {
    return manila(opts || {});
};
