'use strict';
const aws = require('aws-sdk');
if (!aws.config.region) { aws.config.update({region: 'us-east-1'}); }
const docClient = new aws.DynamoDB.DocumentClient();
const snsClient = new aws.SNS();
const s3Client = new aws.S3();
const _ = require('lodash');
const http = require('http');

var UserManager = require('./UserManager');
var userManager = new UserManager(docClient, s3Client);
var EventManager = require('./EventManager');
var eventManager = new EventManager(docClient);

var routes = {
	'/user': {
		'GET': (body, environment, userId, callback) => userManager.GetUser(body, environment, userId, callback),
	},
	'/user/verifications': {
		'POST': (body, environment, userId, callback) => userManager.SetVerifications(body, environment, userId, callback),	
	},
	'/event': {
		'POST': (body, environment, userId, callback) => eventManager.CreateEvent(body, environment, userId, callback)
	}
};


exports.handler = (event, context, callback, debug) => {
	var request = {
		Event: event,
		Context: context
	};

	if(!event) {
		if(!debug) { console.error('Event not defined'); }
		return callback({statusCode: 400, error: 'Event not defined.'});
	}
	var httpMethod = event.httpMethod;
	var resourcePath = event.resourcePath;
	var body = event.body;
	var functionVersion = context.functionVersion || 'PROD';
	var environment = 'prod'; //functionVersion.match(/LATEST/) ? 'test' : 'prod';

	if(!context.identity || !context.identity.cognitoIdentityId) {
		var logResponse = {
			statusCode: 400,
			error: 'No identity defined',
			detail: {
				api: {
					httpMethod: httpMethod,
					resourcePath: resourcePath
				}
			}
		};
		if(!debug) { console.error(`No Identity defined: ${JSON.stringify(logResponse, null, 2)}`); }
		return callback(logResponse);
	}

	var userId = context.identity.cognitoIdentityId;
	try {
		if(!resourcePath || !httpMethod) {
			var logResponse = {
				statusCode: 400,
				error: 'The API resourcePath or httpMethod were not defined.',
				detail: {
					api: {
						httpMethod: httpMethod,
						resourcePath: resourcePath,
						userId: userId
					},
					requestBody: body
				}
			};
			if(!debug) { console.error(JSON.stringify(logResponse, null, 2)); }
			return callback(null, logResponse);
		}
		if(!routes[resourcePath] || !routes[resourcePath][httpMethod]) {
			var logResponse = {
				statusCode: 400,
				error: 'No route found for that api',
				detail: {
					api: {
						httpMethod: httpMethod,
						resourcePath: resourcePath,
						userId: userId
					},
					requestBody: body
				}
			};
			if(!debug) { console.error(JSON.stringify(logResponse, null, 2)); }
			return callback(null, logResponse);
		}

		return userManager.HeadUser(userId, environment, userId)
		.then(result => {
			if(result) { return true; }
			return putUser({}, environment, userId, () => {});
		})
		.then(() => {
			return routes[resourcePath][httpMethod](body, environment, userId, x => {
				var logResponse = {
					statusCode: x.statusCode,
					request: body,
					response: {
						body: x.detail || x.body,
						message: x.title || x.error
					},
					api: {
						httpMethod: httpMethod,
						resourcePath: resourcePath,
						userId: userId
					}
				};
				if(x.statusCode == null) {
					if(!debug) { console.error(`StatusCode not defined: ${JSON.stringify(logResponse, null, 2)}`); }
					return callback(null, {
						statusCode: 500,
						error: 'statusCode not defined',
						body: x
					});
				}
				else if(logResponse.statusCode >= 400) {
					if(!debug) { console.error(JSON.stringify(logResponse, null, 2)); }
					return eventManager.CreateEvent({
						eventType: 'ApiFailure',
						detail: logResponse
					}, environment, userId, () => { return callback(null, x); });
				}
				if(!debug) { console.log(JSON.stringify(logResponse, null, 2)); }
				return callback(null, x);
			});
		});
	}
	catch(exception) {
		var response = {
			statusCode: 400,
			error: 'Failed to retrieve data',
			detail: {
				exception: exception.stack || exception,
				api: {
					httpMethod: httpMethod,
					resourcePath: resourcePath
				},
				requestBody: body
			}
		};
		if(!debug) { console.log(JSON.stringify(response, null, 2)); }
		return callback(null, response);
	}
};