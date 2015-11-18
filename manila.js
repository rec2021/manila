'use strict';

const fs = require('fs'),
    read = fs.readFile,
    vm = require('vm'),
    path = require('path'),
    includeRegx = /{{\s*?include\s(\S*?)\s*?}}/i,
    varRegx = /{{([\s\S]*?)}}/,
    forIn = /{{\s*?for\s*?\S*?\s*?in\s*?\S*?\s*?}}/i,
    endfor = /{{\s*?endfor\s*?}}/i,
    ifBlock = /{{\s*?if\s*?[\s\S]*?\s*?}}/i,
    endif = /{{\s*?endif\s*?}}/i,
    elseBlock = /{{\s*?else\s*?}}/i,
    escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#39;'
    },
    unescapeMap = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': '\''
    };

let partialsDir;

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
    return str.replace(/(&amp;)(&lt;)(&gt;)(&quot;)(&#39;)/g, c => {
        return unescapeMap[c];
    });
}

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
                    value = htmlUnescape(value);
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

    return parse(template.replace(raw, value), context);
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
            output += parse(html, subContext);
        });
    }

    return parse(template.replace(raw, output), context);
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

    html = html.split(elseBlock);

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

    return parse(template.replace(raw, html), context);
}

// Recursively asyncronously parses partial includes
// then calls the callback with the result
function parseIncludes(template, callback) {
    
    let match = includeRegx.exec(template),
        raw, include;

    if (match !== null) {

        raw  = match[0];
        include = match[1];

        read(partialsDir + include + '.mnla', { encoding: 'utf8' }, function(err, html) {

            parseIncludes(template.replace(raw, html), callback);
        });
    } else {
        callback(template);
    }
}

// In order to support nesting, we need to build
// a regex that ignores the correct number of closing tags.
function getLoopRegx(template) {
    
    let result,

        secondHalf = template.split(forIn)[1];

    if (!secondHalf) {

        result = false;
    // If another for-in loop starts before this one is closed...
    } else if (secondHalf.search(forIn) < secondHalf.search(endfor)) {
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
        match = ifBlock.exec(template);

    if (match) {

        let secondHalf = template.substring(template.search(ifBlock) + match[0].length);

        // If another if block starts before this one is closed...
        if (secondHalf.search(ifBlock) < secondHalf.search(endif)) {
            // use greedy matching
            result = /{{\s*?if\s*?([\s\S]*?)\s*?}}([\s\S]*){{\s*?endif\s*?}}/i;

        } else {
            // use lazy matching
            result = /{{\s*?if\s*?([\s\S]*?)\s*?}}([\s\S]*?){{\s*?endif\s*?}}/i;
        }
    }
    
    return result;
}

// Parsing functions that run syncronously are executed here.
function parse(template, context) {

    let match, regx,

        loopFirst = template.search(forIn) < template.search(ifBlock);

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

    match = varRegx.exec(template);

    if (match) {
        template = parseVars(template, context, match);
    }

    return template;
}

function render(filepath, context, callback) {

    read(filepath, { encoding: 'utf8' }, function(err, template) {

        if (err) {
            callback(err);
        } else {

            parseIncludes(template, fullTemplate => {

                callback(undefined, parse(fullTemplate, context));
            });
        }
    });
}

module.exports = opts => {
    partialsDir = opts ? opts.partials || 'views' : 'views';
    partialsDir = path.join(path.dirname(module.parent.filename), partialsDir, '/');
    return render;
};
