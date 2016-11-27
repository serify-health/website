'use strict';

const fs = require('fs');

function UserManager(docClient, s3client){
	this.DocClient = docClient;
	this.S3client = s3client;
};

UserManager.prototype.GetUser = function(body, environment, userId, callback) {
	var lookupUser = body.user || userId;
	return this.DocClient.query({
		TableName: `users.health-verify.${environment}`,
		Limit: 1,
		ScanIndexForward: false,
		KeyConditionExpression: 'UserId = :id',
		ExpressionAttributeValues: {
			':id': lookupUser
		}
	}).promise().then(result => result.Items[0])
	.then(result => {
		return callback({
			statusCode: 200,
			body: result
		});
	})
	.catch(error => {
		return callback({
			statusCode: 400,
			error: `Unable to retrieve user: ${error.stack || error.toString()}`,
			detail: error
		});
	});
};

UserManager.prototype.SetVerifications = function(body, environment, userId, callback) {
	return this.DocClient.update({
		TableName: `users.health-verify.${environment}`,
		Key: {
			'UserId': userId
		},
		AttributeUpdates: {
			'Verifications': {
				Action: 'PUT',
				Value: body
			}
		},
		ReturnValues: 'NONE'
	}).promise()
	.then(result => {
		return callback({
			statusCode: 200,
			body: result
		});
	})
	.catch(error => {
		return callback({
			statusCode: 400,
			error: `Unable to set verifications: ${error.stack || error.toString()}`,
			detail: error
		});
	});
};

module.exports = UserManager;