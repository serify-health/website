const aws = require('aws-sdk');
const Api = require('openapi-factory');
const jwtManager = require('jsonwebtoken');
const jwkConverter = require('jwk-to-pem');
const axios = require('axios');

module.exports = api = new Api();

let localUserId = "us-east-1:localUser";
let links = [
    {
        "UserId": localUserId,
        "Base64Hash": "dW5kZWZpbmVkOnVuZGVmaW5lZDp1cy1lYXN0LTE6NjJlYjY4ZGUtZTExYi00Y2E3LWJjM2ItYTA3Yjc0ZjYwMWFj",
        currentLink: true
    }
];
api.get('/link', (event, context) => {
    return new Api.Response(links[0], 200, { 'Content-Type': 'application/json' });
});
api.post('/link', (event, context) => {
    return new Api.Response(links.find(l => l.currentLink).Base64Hash, 200, { 'Content-Type': 'application/json' });
});
api.get('/links', (event, context) => {
    return new Api.Response(links, 200, { 'Content-Type': 'application/json' });
});

let users = [
    {
        userId: localUserId,
		UserId: localUserId,
        userData: {},
        Verifications: [],
        verifications: [],
        admin: true
    }
];
api.get('/user', (event, context) => {
    return new Api.Response(users[0], 200, { 'Content-Type': 'application/json' });
});
api.put('/user', (event, context) => {
    return new Api.Response({}, 200, { 'Content-Type': 'application/json' });
});
let verifications = [];
api.post('/user/verifications', (event, context) => {
    verifications.push({
        Info: event.body,
        Status: 'NEW'
    });
    return new Api.Response({}, 200, { 'Content-Type': 'application/json' });
});
api.put('/user/data', (event, context) => {
    return new Api.Response({}, 200, { 'Content-Type': 'application/json' });
});
api.get('/verifications', (event, context) => {
    return new Api.Response([], 200, { 'Content-Type': 'application/json' });
});
api.post('/verifications', (event, context) => {
    return new Api.Response({}, 200, { 'Content-Type': 'application/json' });
});
api.post('/event', (event, context) => {
    return new Api.Response({}, 200, { 'Content-Type': 'application/json' });
});
api.get('/summary', (event, context) => {
    return new Api.Response({}, 200, { 'Content-Type': 'application/json' });
});
let feedbackData = {
    feedbackList: [
        {
            time: new Date(),
            information: {
                username: 'me'
            }
        }
    ]
};
api.get('/feedback', (event, context) => {
    return new Api.Response(feedbackData, 200, { 'Content-Type': 'application/json' });
});
api.post('/feedback', (event, context) => {
    feedbackData.feedbackList.push({
        time: new Date(),
        information: event.body
    });
    return new Api.Response({}, 200, { 'Content-Type': 'application/json' });
});