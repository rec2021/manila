'use strict';

const fs = require('fs'),
	context = {
		title: '<span attr="test">hi \'ol boy</span>',
		items: [1, 2, 3, 4, 5],
		obj: {
			a: 1,
			b: 2,
			c: 3
		},
		flag: false
	},
	desired = fs.readFileSync(__dirname + '/output.html', { encoding: 'utf8' }),
	manila = require('../manila')({
		root: __dirname,
		partials: 'views/partials',
		views: 'views'
	}),
	manila2 = require('../manila')({
		root: __dirname,
		partials: 'views/partials',
		views: 'views',
		extension: 'html'
	});

exports.checkOutput = function(test) {
	manila('input.mnla', context, (err, output) => {
		test.ok(output.replace(/\s/g, '') === desired, 'output should be correct');
		test.done();
	});
};

exports.customExtension = function(test) {
	manila2('input.html', context, (err, output) => {
		test.ok(output.replace(/\s/g, '') === desired, 'should accept custom extension');
		test.done();
	});
};