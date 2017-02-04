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
var LinkManager = require('./LinkManager');
var linkManager = new LinkManager(docClient);
var EventManager = require('./EventManager');
var eventManager = new EventManager(docClient);
var AdminManager = require('./AdminManager');
var adminManager = new AdminManager();
var VerificationManager = require('./VerificationManager');
var verificationManager = new VerificationManager(docClient, adminManager, userManager);
var SummaryManager = require('./SummaryManager');
var summaryManager = new SummaryManager(docClient, adminManager);

var routes = {
	'/link': {
		'GET': (body, environment, userId, callback) => linkManager.GetUserFromLink(body, environment, userId, callback),
		'POST': (body, environment, userId, callback) => linkManager.CreateNewLink(body, environment, userId, callback)
	},
	'/links': {
		'GET': (body, environment, userId, callback) => linkManager.GetAllUserLinks(body, environment, userId, callback)
	},
	'/user': {
		'GET': (body, environment, userId, callback) => userManager.GetUser(body, environment, userId, callback),
		'PUT': (body, environment, userId, callback) => userManager.SetUserIdentifier(body, environment, userId, callback)
	},
	'/user/verifications': {
		'POST': (body, environment, userId, callback) => userManager.SetVerifications(body, environment, userId, callback)
	},
	'/user/data': {
		'PUT': (body, environment, userId, callback) => userManager.SetUserData(body, environment, userId, callback)
	},
	'/verifications': {
		'GET': (body, environment, userId, callback) => verificationManager.GetVerifications(body, environment, userId, callback),
		'POST': (body, environment, userId, callback) => verificationManager.SetVerificationResult(body, environment, userId, callback)
	},
	'/event': {
		'POST': (body, environment, userId, callback) => eventManager.CreateEvent(body, environment, userId, callback)
	},
	'/summary': {
		'GET':  (body, environment, userId, callback) => summaryManager.GetSummary(body, environment, userId, callback)
	}
};


exports.handler = (event, context, callback, debug) => {
	console.log(JSON.stringify({LogType: 'Request', Event: event, Context: context}, null, 2));
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
	var environment = 'v1'; //functionVersion.match(/LATEST/) ? 'test' : 'prod';

	if(!context.identity || !context.identity.cognitoIdentityId) {
		let logResponse = {
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
			let logResponse = {
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
			/* jshint -W041 */
			if(x.statusCode == null) {
			/* jshint +W041 */
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