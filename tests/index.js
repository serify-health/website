'use strict;'
var esprima = require('esprima');
var mocha = require('mocha');
var assert = require('chai').assert;
var fs = require('fs');
var path = require('path');

describe('src/index.js', function() {
	describe('Syntax', function () {
		it('Should be valid Javascript', function() {
			try {
				var userStringToTest = fs.readFileSync(path.resolve('src/index.js'));
				esprima.parse(userStringToTest);
				assert(true);
			}
			catch(e) {
				console.error(e.stack);
				assert(false, e.toString());
			}
		});
		it('Should be valid node', function(){
			try {
				var app = require('../src/index');
				assert(true);
			}
			catch(e) {
				console.error(e.stack);
				assert(false, e.toString());
			}
		});
	});
	describe('Test Exports Callbacks', function () {
		it('Event not defined', function(done) {
			try {
				var lambda = require('../src/index');
				new Promise((s, f) => {
					lambda.handler(null, {}, (failure, success) => {
						if(success && !failure) { return s(success); }
						else { f(failure); }
					}, true);
				})
				.catch(failure => {
					assert.strictEqual(failure.statusCode, 400, 'Error should be a 400 on no event');
					assert.strictEqual(failure.error, 'Event not defined.', 'Correct error message');
					return true;
				}).then(success => done(), failure => done(failure));
			}
			catch(e) {
				console.error(e.stack);
				assert(false, e.toString());
			}
		});
		it('Identity not defined', function(done) {
			try {
				var lambda = require('../src/index');
				new Promise((s, f) => {
					lambda.handler({}, {}, (failure, success) => {
						if(success && !failure) { return s(success); }
						else { f(failure); }
					}, true);
				})
				.catch(failure => {
					assert.strictEqual(failure.statusCode, 400, 'Error should be a 400 on missing Identity');
					assert.strictEqual(failure.error, 'No identity defined', 'Correct error message');
					return true;
				}).then(success => done(), failure => done(failure));
			}
			catch(e) {
				console.error(e.stack);
				assert(false, e.toString());
			}
		});
		it('Identity not defined 2', function(done) {
			try {
				var lambda = require('../src/index');
				new Promise((s, f) => {
					lambda.handler({}, { identity: null}, (failure, success) => {
						if(success && !failure) { return s(success); }
						else { f(failure); }
					}, true);
				})
				.catch(failure => {
					assert.strictEqual(failure.statusCode, 400, 'Error should be a 400 on missing Identity');
					assert.strictEqual(failure.error, 'No identity defined', 'Correct error message');
					return true;
				}).then(success => done(), failure => done(failure));
			}
			catch(e) {
				console.error(e.stack);
				assert(false, e.toString());
			}
		});
		it('Identity not defined 2', function(done) {
			try {
				var lambda = require('../src/index');
				new Promise((s, f) => {
					lambda.handler({}, { 
						identity: {
							cognitoIdentityId: null
						}
					}, (failure, success) => {
						if(success && !failure) { return s(success); }
						else { f(failure); }
					}, true);
				})
				.catch(failure => {
					assert.strictEqual(failure.statusCode, 400, 'Error should be a 400 on missing Identity');
					assert.strictEqual(failure.error, 'No identity defined', 'Correct error message');
					return true;
				}).then(success => done(), failure => done(failure));
			}
			catch(e) {
				console.error(e.stack);
				assert(false, e.toString());
			}
		});
		it('Resource Path not defined', function(done) {
			try {
				var lambda = require('../src/index');
				new Promise((s, f) => {
					lambda.handler({}, { 
						identity: {
							cognitoIdentityId: 'id'
						}
					}, (failure, success) => {
						if(success && !failure) { return s(success); }
						else { f(failure); }
					}, true);
				})
				.then(response => {
					assert.strictEqual(response.statusCode, 400, 'Error should be a 400 on missing Identity');
					assert.strictEqual(response.error, 'The API resourcePath or httpMethod were not defined.', 'Correct error message');
					return done();
				}, failure => done(new Error(JSON.stringify(failure))))
				.catch(failure => done(failure));
			}
			catch(e) {
				console.error(e.stack);
				assert(false, e.toString());
			}
		});
		it('No Resource', function(done) {
			try {
				var lambda = require('../src/index');
				new Promise((s, f) => {
					lambda.handler({
						httpMethod: 'GET',
						resourcePath: 'DOES-NOT-EXIST'
					}, {
						identity: {
							cognitoIdentityId: 'id'
						}
					}, (failure, success) => {
						if(success && !failure) { return s(success); }
						else { f(failure); }
					}, true);
				})
				.then(response => {
					assert.strictEqual(response.statusCode, 400, 'Error should be a 400 on missing Identity');
					assert.strictEqual(response.error, 'No route found for that api', 'Correct error message');
					return done();
				}, failure => done(new Error(JSON.stringify(failure))))
				.catch(failure => done(failure));
			}
			catch(e) {
				console.error(e.stack);
				assert(false, e.toString());
			}
		});
	});
	describe('Non-RESTful Test', function () {
		/*
		it('GET', function(done) {
			try {
				var lambda = require('../src/index');
				new Promise((s, f) => {
					lambda({}, {}, (failure, success) => {
						if(success && !failure) { return s(success); }
						else { f(failure); }
					});
				})
				.then(output => {
					done();
				})
				.catch(failure => done(failure));
			}
			catch(e) {
				console.error(e.stack);
				assert(false, e.toString());
			}
		});
		*/
	});
});