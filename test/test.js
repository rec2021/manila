const fs = require('fs'),
	manila = require('../manila')({
		root: __dirname,
		partials: 'views/partials',
		views: 'views'
	}),
	context = {
		title: '<span attr="test">hi \'ol boy</span>',
		items: [1, 2, 3, 4, 5],
		obj: {
			a: 1,
			b: 2,
			c: 3
		},
		flag: false
	};

exports.test = function(test) {
	manila('input.mnla', context, (err, output) => {
		fs.readFile(__dirname + '/output.html', { encoding: 'utf8' }, (err, desired) => {
			if (err) {
				console.trace(err);
			} else {
				test.ok(output.replace(/\s/g, '') === desired, 'output should be correct');
			    test.done();
			}
		});
	});
};