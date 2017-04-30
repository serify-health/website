const aws = require('aws-sdk');
const Api = require('openapi-factory');
const jwtManager = require('jsonwebtoken');
const jwkConverter = require('jwk-to-pem');
const axios = require('axios');
const uuid = require('uuid');

module.exports = api = new Api();

let localUserId = "us-east-1:localUser";
let links = [
    {
        "UserId": localUserId,
        "Base64Hash": "UNIT-TEST-IGNORE",
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

let verifications = [
    {
        Name: 'DoesNotExist',
        Date: new Date(),
        Status: 'Verified'
    },
    {
        Name: 'Syphilis',
        Date: new Date(),
        Status: 'Unknown'
    },
    {
        Name: 'HIV',
        Date: '04/2017',
        Status: 'Verified'
    },
    {
        Name: 'PrEP',
        Date: '04/2018',
        Status: 'Verified'
    },
    {
        Name: 'HerpesI',
        Date: new Date(),
        Status: 'Unknown'
    },
    {
        Name: 'HerpesII',
        Date: new Date(),
        Status: 'Rejected'
    }
];
let users = [
    {
        userId: localUserId,
		UserId: localUserId,
        userData: {},
        Verifications: verifications,
        verifications: verifications,
        admin: true
    }
];
api.get('/user', (event, context) => {
    return new Api.Response(users[0], 200, { 'Content-Type': 'application/json' });
});
api.put('/user', (event, context) => {
    return new Api.Response({}, 200, { 'Content-Type': 'application/json' });
});
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
let verificationRequests = [
    {
        Status: 'NEW',
        UserId: localUserId,
        Time: new Date(),
        info: {
            user: {
                name: localUserId,
                dob: new Date(),
                clinicName: 'this is a test clinic',
                clinicInfo: 'not a real address',
            },
            verifications: [
                {
                    Name: 'Syphilis',
                    Date: '04/2017',
                    Id: uuid.v4(),
                    Status: 'Unknown'
                },
                {
                    Name: 'Herpes',
                    Date: '04/2017',
                    Id: uuid.v4(),
                    Status: 'Unknown'
                }
            ]
        },
        userIdentity: {
            email: 'not@an-email.com'
        }
    }
];

api.get('/verifications', (event, context) => {
    return new Api.Response(verificationRequests, 200, { 'Content-Type': 'application/json' });
});
api.post('/verifications', (event, context) => {
    return new Api.Response({}, 200, { 'Content-Type': 'application/json' });
});
api.post('/event', (event, context) => {
    return new Api.Response({}, 200, { 'Content-Type': 'application/json' });
});
api.get('/summary', (event, context) => {
    return new Api.Response({
        userCount: 1,
        requestCount: 1
    }, 200, { 'Content-Type': 'application/json' });
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
api.get('/admin/user', (event, context) => {
    return new Api.Response({}, 400, { 'Content-Type': 'application/json' });
});
api.post('/feedback', (event, context) => {
    feedbackData.feedbackList.push({
        time: new Date(),
        information: event.body
    });
    return new Api.Response({}, 200, { 'Content-Type': 'application/json' });
});