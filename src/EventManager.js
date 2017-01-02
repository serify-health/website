'use strict';

function EventManager(docClient){
	this.DocClient = docClient;
}

EventManager.prototype.CreateEvent = function(body, environment, userId, callback) {
	if(!body.detail) {
		return callback({
			statusCode: 400,
			error: 'detail not specified',
			requestBody: body
		});
	}
	if(!body.eventType) {
		return callback({
			statusCode: 400,
			error: 'eventType not specified',
			requestBody: body
		});
	}
	var creationTime = new Date();
	return this.DocClient.put({
		TableName: `events.health-verify.${environment}`,
		Item: {
			UserId: userId,
			Time: creationTime.getTime(),
			TimeString: creationTime.toString(),
			EventType: body.eventType,
			Detail: body.detail
		}
	}).promise()
	.then(data => {
		return callback({
			statusCode: 200,
			body: {
				title: 'Event logged successfully',
				info: data,
				id: creationTime.getTime()
			}
		});
	})
	.catch(error => {
		return callback({
			statusCode: 400,
			error: 'Unable to log event',
			detail: error
		});
	});
};

module.exports = EventManager;