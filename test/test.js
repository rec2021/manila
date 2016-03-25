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
	desired = fs.readFileSync(__dirname + '/output.html', { encoding: 'utf8' }).replace(/\s/g, ''),
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

exports.checkOutput = test => {

	manila(__dirname + '/views/input.mnla', context, (err, output) => {

		if (err) {
			console.trace(err.stack);
		}

		test.ok(output.replace(/\s/g, '') === desired, 'output should be correct');
		test.done();
	});
};

exports.checkPromise = test => {

	manila('input.mnla', context).then(output => {
		test.ok(output.replace(/\s/g, '') === desired, 'should support promises');
		test.done();
	}).catch(error => {
		console.trace(error.stack);
	});
};

exports.checkCustomExtension = test => {

	manila2('input.html', context, (err, output) => {
		test.ok(output.replace(/\s/g, '') === desired, 'should accept custom extension');
		test.done();
	});
};

exports.checkNoExtension = test => {

	manila2('input', context, (err, output) => {
		test.ok(output.replace(/\s/g, '') === desired, 'should work with no extension');
		test.done();
	});
};

exports.compileThenRender = test => {

	manila2.compile('input', (error, render) => {
		test.ok(render(context).replace(/\s/g, '') === desired, 'should have compile and render steps');
		test.done();
	});
};

exports.compilePromise = test => {

	manila2.compile('input').then(render => {
		test.ok(render(context).replace(/\s/g, '') === desired, 'should support compile promises');
		test.done();
	}).catch(error => {
		console.trace(error.stack);
	});
};