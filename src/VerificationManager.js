'use strict';

const fs = require('fs');

function VerificationManager(docClient){
	this.DocClient = docClient;
}

function IsAdmin(userId) {
	var adminUsers = {
		'us-east-1:e515087c-a24f-4d0e-9f00-8b47136dc691': true,
		'us-east-1:dd25300e-d365-4d74-8a56-94b917e92f63': true,
		'us-east-1:cf318438-b1d1-48b7-9af0-5c7bf271fc24': true,
		'us-east-1:bde636ae-408c-4905-b866-982be777b846': true,
		'us-east-1:b5c9e3b0-a191-4c83-9b7b-413a8dd6bfea': true,
		'us-east-1:9f3779f3-7f31-4821-95f3-bc1fccb351c8': true,
		'us-east-1:8f888fbc-8457-4b05-ad8e-540bd399c582': true,
		'us-east-1:62eb68de-e11b-4ca7-bc3b-a07b74f601ac': true,
		'us-east-1:3314fedf-d008-47ff-ba7a-997e5fa99e25': true,
		'us-east-1:2ab27d83-5b48-4d7b-a700-ed5461b9303f': true,
		'us-east-1:0013876b-6562-4f7f-bb72-f4f0d2b0367a': true,
		'us-east-1:6b8f8568-bac4-44ab-9c77-64c00212906a': true
	};
	return adminUsers[userId];
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
};

module.exports = VerificationManager;