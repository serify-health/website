'use strict';

const fs = require('fs');
const uuid = require('uuid');
function LinkManager(docClient, s3client){
	this.DocClient = docClient;
}

LinkManager.prototype.GetUserFromLink = function(body, environment, userId, callback) {
	var base64hash = body.hash;
	var table = `links.health-verify.${environment}`;
	var queryPromise = this.DocClient.query({
		TableName: table,
		IndexName: 'HashLookup',
		Limit: 1,
		ScanIndexForward: false,
		KeyConditionExpression: 'Base64Hash = :base64hash',
		ExpressionAttributeValues: {
			':base64hash': base64hash
		}
	}).promise().then(result => result.Items[0]);
	return queryPromise.then(result => {
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
LinkManager.prototype.GetAllUserLinks = function(body, environment, userId, callback) {
		var table = `links.health-verify.${environment}`;
	var queryPromise = this.DocClient.query({
		TableName: table,
		ScanIndexForward: false,
		KeyConditionExpression: 'UserId = :userId',
		ExpressionAttributeValues: {
			':userId': userId
		}
	}).promise().then(result => result.Items);
	return queryPromise.then(result => {
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
LinkManager.prototype.CreateNewLink = function(body, environment, userId, callback) {
	var linkname = body.linkname;
	var username = body.username;
	var hash = userId.split(':')[1].replace(/-/g, '');
	var base64hash = new Buffer(hash, 'hex').toString('base64').replace(/\//g, '-');
	return this.DocClient.put({
		TableName: `links.health-verify.${environment}`,
		Item: {
			UserId: userId,
			Base64Hash: base64hash,
			Linkname: linkname,
			Username: username
		}
	}).promise()
	.then(result => {
		return callback({
			statusCode: 200,
			body: base64hash
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

module.exports = LinkManager;