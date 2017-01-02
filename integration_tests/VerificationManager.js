'use strict';
const api = require('../src/index.js');
const _ = require('lodash');

// api.handler({
// 	httpMethod: 'POST',
// 	resourcePath: '/friends',
// 	body: {
// 		friendId: 'us-east-1:4528e62b-c174-4933-9ffd-8ba1c6e1771e',
// 	}
// }, {
// 	functionVersion: '0',
// 	identity: {
// 		cognitoIdentityId: 'us-east-1:4528e62b-c174-4933-9ffd-8ba1c6e1771e'
// 	}
// }, (a, c) => console.log(JSON.stringify(c, null, 2)));

api.handler({
	httpMethod: 'GET',
	resourcePath: '/verifications',
	body: {
	}
}, {
	functionVersion: '0',
	identity: {
		cognitoIdentityId: 'us-east-1:b5c9e3b0-a191-4c83-9b7b-413a8dd6bfea'
	}
}, (a, c) => console.log(JSON.stringify(c, null, 2)));