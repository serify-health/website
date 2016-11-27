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
	resourcePath: '/user',
	body: {
		//user: 'us-east-1:d0118e7b-774e-4d05-b6e6-63a7c8542430'
	}
}, {
	functionVersion: '0',
	identity: {
		cognitoIdentityId: 'us-east-1:d0118e7b-774e-4d05-b6e6-63a7c8542430'
	}
}, (a, c) => console.log(JSON.stringify(c, null, 2)));

//***************** Update Push ID *****************/
// api.handler({
// 	httpMethod: 'POST',
// 	resourcePath: '/push',
// 	body: {
// 		token: 'ekgsk3csykk:APA91bG40FLAzwYSGK2xd3HGJiPo0ILJtJxsxlpFvISFIh3-bNcrb_J7ry2AYM428FuAG23tK6zNhhP-2bhzODfaf_IflquchmcuxOu9tvCrCGy_ZVwqR-9FlwhcdzCsnFfvF81vSmaE',
// 		platform: 'Android'
// 	}
// }, {
// 	functionVersion: '0',
// 	identity: {
// 		cognitoIdentityId: 'us-east-1:8e36e7e2-b154-4f65-ba35-dd8084bcce9e'
// 	}
// }, (a, c) => console.log(JSON.stringify(c, null, 2)));

// api.handler({
// 	httpMethod: 'POST',
// 	resourcePath: '/users',
// 	body: {
// 		name: 'Joly'
// 	}
// }, {
// 	functionVersion: '0',
// 	identity: {
// 		cognitoIdentityId: 'us-east-1:4528e62b-c174-4933-9ffd-8ba1c6e1771e'
// 	}
// }, (a, c) => console.log(JSON.stringify(c, null, 2)));

// api.handler({
// 	httpMethod: 'DELETE',
// 	resourcePath: '/friends',
// 	body: {
// 		friendId: 'Hello2',
// 	}
// }, {
// 	functionVersion: '0',
// 	identity: {
// 		cognitoIdentityId: 'us-east-1:4528e62b-c174-4933-9ffd-8ba1c6e1771e'
// 	}
// }, (a, c) => console.log(JSON.stringify(c, null, 2)));