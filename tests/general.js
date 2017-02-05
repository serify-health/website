'use strict;'
var esprima = require('esprima');
var mocha = require('mocha');
var assert = require('chai').assert;
var fs = require('fs');
var path = require('path');
var jshint = require('jshint').JSHINT;
var glob = require('glob');

describe('validate all files', function() {
	describe('style', function() {
		var filesPromise = new Promise((s, f) => { glob(path.resolve("content/**/*.js"), { }, (error, files) => error ? f(error) : s(files)); });
		it('Files should be found', function(done){
			filesPromise.then(() => {
				assert('Files Found.');
				done();
			}, error => {
				assert(false, 'Failed to find files.');
				done(error);
			});
		});
		it('Check all files', function(done){
			filesPromise.then(files => {
				files.forEach(file => {
					var isLibraryFile = file.match(/(userpool-|)lib\/.*/);
					if(isLibraryFile) { return; }
					var userStringToTest = fs.readFileSync(path.resolve(file)).toString('UTF-8');
					jshint(userStringToTest, {
						esversion: 5,
						expr: true,
						globals: {
							angular: false
						}
					});
					if(jshint.errors.length > 0) {
						console.log(`JSHINT ERROR in file ${file}`);
						console.error(jshint.errors);
						assert.strictEqual(jshint.errors.length, 0, 'Errors found through jshint');
					}
				});
			}).then(() => done(), fail => done(fail));
		});
	});
});