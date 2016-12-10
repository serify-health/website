'use strict';
const api = require('../src/index.js');
const _ = require('lodash');

// api.handler({
// 	httpMethod: 'POST',
// 	resourcePath: '/link',
// 	body: {
// 		linkname: 'website',
// 		username: 'me'
// 	}
// }, {
// 	functionVersion: '0',
// 	identity: {
// 		cognitoIdentityId: 'us-east-1:d0118e7b-774e-4d05-b6e6-63a7c8542430'
// 	}
// }, (a, c) => console.log(JSON.stringify(c, null, 2)));

api.handler({
	httpMethod: 'GET',
	resourcePath: '/links',
	body: {
		//hash: 'd2Vic2l0ZTptZQ=='
	}
}, {
	functionVersion: '0',
	identity: {
		cognitoIdentityId: 'us-east-1:62eb68de-e11b-4ca7-bc3b-a07b74f601ac'
	}
}, (a, c) => console.log(JSON.stringify(c, null, 2)));