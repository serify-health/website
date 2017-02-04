'use strict';

const fs = require('fs');

function VerificationManager(docClient, adminManager, userManager){
	this.DocClient = docClient;
	this.adminManager = adminManager;
	this.userManager = userManager;
}

VerificationManager.prototype.GetVerifications = function(body, environment, userId, callback) {
	if(!this.adminManager.IsAdmin(userId)) {
		return callback({
			statusCode: 400,
			error: `User is not admin`
		});
	}

	var requestPromise = this.DocClient.query({
		TableName: `verificationRequests.health-verify.${environment}`,
		IndexName: 'StatusLookup',
		ScanIndexForward: true,
		KeyConditionExpression: '#s = :statusType',
		ExpressionAttributeNames: {
			'#s': 'Status'
		},
		ExpressionAttributeValues: {
			':statusType': 'NEW'
		}
	}).promise().then(result => result.Items);
	var userMappingPromise = requestPromise
	.then(requests => {
		var userMapping = {};
		var currentPromise = Promise.resolve();
		requests.map(request => {
			currentPromise = currentPromise
			.then(() => {
				return this.userManager.GetUserAdmin(request.UserId, environment)
				.then(data => {
					userMapping[request.UserId] = data.identity
				});
			});
		});
		return currentPromise.then(() => userMapping);
	});

	Promise.all([requestPromise, userMappingPromise])
	.then(result => {
		var requests = result[0];
		var userMapping = result[1];
		var newResults = [];
		requests.map(request => {
			request.userIdentity = userMapping[request.UserId];
			newResults.push(request);
		});
		return callback({
			statusCode: 200,
			body: newResults
		});
	})
	.catch(error => {
		return callback({
			statusCode: 400,
			error: `Unable to retrieve verifications: ${error.stack || error.toString()}`,
			detail: error
		});
	});
};

VerificationManager.prototype.SetVerificationResult = function(body, environment, userId, callback) {
	if(!this.adminManager.IsAdmin(userId)) {
		return callback({
			statusCode: 400,
			error: `User is not admin`
		});
	}

	var updateUserId = body.updateUserId;
	var updateUserTime = body.updateUserTime;
	var verifications = body.verifications;
	var result = body.result;
	var userTable = `users.health-verify.${environment}`;
	if(result !== 'APPROVE') {
		return callback({
			statusCode: 400,
			error: `Unable to update using a non-approval method.`
		});
	}
	return this.DocClient.query({
		TableName: userTable,
		Limit: 1,
		ScanIndexForward: false,
		KeyConditionExpression: 'UserId = :id',
		ExpressionAttributeValues: {
			':id': updateUserId
		},
		ProjectionExpression: 'UserId, Verifications'
	}).promise().then(result => result.Items[0])
	.then(user => {
		var updatedVerificationIndex = {};
		verifications.map(v => updatedVerificationIndex[v.Id] = v);
		var updatedVerifications = user.Verifications.map(verification => {
			if(updatedVerificationIndex[verification.Id]) {
				verification.Status = 'Verified';
			}
			return verification;
		});

		return this.DocClient.update({
			TableName: userTable,
			Key: {
				'UserId': updateUserId
			},
			AttributeUpdates: {
				'Verifications': {
					Action: 'PUT',
					Value: updatedVerifications
				}
			},
			ReturnValues: 'NONE'
		}).promise();
	})
	.then(() => {
		//Update the verification request
		return this.DocClient.update({
			TableName: `verificationRequests.health-verify.${environment}`,
			Key: {
				'UserId': updateUserId,
				'Time': updateUserTime
			},
			AttributeUpdates: {
				'Status': {
					Action: 'PUT',
					Value: 'VERIFIED'
				}
			},
			ReturnValues: 'NONE'
		}).promise();
	})
	.then(result => {
		return callback({
			statusCode: 200,
			body: result
		});
	})
	.catch(error => {
		return callback({
			statusCode: 400,
			error: `Unable to retrieve verifications: ${error.stack || error.toString()}`,
			detail: error
		});
	});
};

module.exports = VerificationManager;