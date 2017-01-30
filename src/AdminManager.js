'use strict';

function AdminManager(){}

AdminManager.prototype.IsAdmin = function(userId) {
	var adminUsers = {
		'us-east-1:e515087c-a24f-4d0e-9f00-8b47136dc691': true,
		'us-east-1:dd25300e-d365-4d74-8a56-94b917e92f63': true,
		'us-east-1:cf318438-b1d1-48b7-9af0-5c7bf271fc24': true,
		'us-east-1:bde636ae-408c-4905-b866-982be777b846': true,
		'us-east-1:b5c9e3b0-a191-4c83-9b7b-413a8dd6bfea': true,
		'us-east-1:9f3779f3-7f31-4821-95f3-bc1fccb351c8': true, // jasonparad@gmail.com
		'us-east-1:8f888fbc-8457-4b05-ad8e-540bd399c582': true,
		'us-east-1:62eb68de-e11b-4ca7-bc3b-a07b74f601ac': true,
		'us-east-1:3314fedf-d008-47ff-ba7a-997e5fa99e25': true,
		'us-east-1:2ab27d83-5b48-4d7b-a700-ed5461b9303f': true,
		'us-east-1:0013876b-6562-4f7f-bb72-f4f0d2b0367a': true,
		'us-east-1:6b8f8568-bac4-44ab-9c77-64c00212906a': true, // nastar@pl.o2
		'us-east-1:5ba6798f-29c5-41b0-b373-5db09938823b': true, // Kristine.Tran29@gmail.com
		'us-east-1:a6759634-6dda-4c50-9472-4bc3cbbdffda': true // jasonparad2@gmail.com
	};
	return adminUsers[userId];
};
module.exports = AdminManager;