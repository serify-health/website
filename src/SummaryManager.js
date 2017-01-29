'use strict';

const fs = require('fs');

function SummaryManager(docClient, adminManager){
	this.docClient = docClient;
	this.adminManager = adminManager;
}

SummaryManager.prototype.GetSummary = function(body, environment, userId, callback) {
	if(!this.adminManager.IsAdmin(userId)) {
		return callback({
			statusCode: 400,
			error: `User is not admin`
		});
	}

	var userCountPromise = this.docClient.scan({
		TableName: `users.health-verify.${environment}`,
		Select: 'COUNT'
	}).promise().then(result => result.Count);

	var requestCountPromise = this.docClient.scan({
		TableName: `verificationRequests.health-verify.${environment}`,
		Select: 'COUNT'
	}).promise().then(result => result.Count);

	Promise.all([userCountPromise, requestCountPromise])
	.then(result => {
		return callback({
			statusCode: 200,
			body: {
				userCount: result[0],
				requestCount: result[1]
			}
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

module.exports = SummaryManager;