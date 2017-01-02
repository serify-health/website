'use strict';

const fs = require('fs');

function VerificationManager(docClient){
	this.DocClient = docClient;
};

function IsAdmin(userId) {
	var adminUsers = {
		'us-east-1:b5c9e3b0-a191-4c83-9b7b-413a8dd6bfea': true
	};
	return adminUsers[userId]
}
VerificationManager.prototype.GetVerifications = function(body, environment, userId, callback) {
	if(!IsAdmin(userId)) {
		return callback({
			statusCode: 400,
			error: `User is not admin`
		});
	}

	return this.DocClient.query({
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
	}).promise().then(result => result.Items)
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

VerificationManager.prototype.SetVerificationResult = function(body, environment, userId, callback) {
	if(!IsAdmin(userId)) {
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
}

module.exports = VerificationManager;