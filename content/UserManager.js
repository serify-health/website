angular.module(GOLFPRO).service('userManager', [ 'apiService', 'loginStatusProvider', function(apiService, loginStatusProvider) {
	this.UserId = null;
	this.GetUserIdPromise = function() {
		if(this.UserId) { return Promise.resolve(this.UserId); }
		return new Promise(function(s, f) {
			AWS.config.credentials.get(function(error) { error ? f(error) : s(AWS.config.credentials.identityId); });
		})
		/* jshint -W093 */
		.then(function(id) { return this.UserId = id; });
		/* jshint +W093 */
	};
	this.SendMessage = function(userIds, update) {
		return apiService.getPromise('PUT', '/push', {
			users: userIds,
			update: update
		});
	};
	this.GetUserExistsPromise = function(userId) {
		return apiService.getPromise('HEAD', '/user', {
			user: userId
		})
		.then(function(user) {
			return user != null; //jshint ignore:line
		})
		.catch(function(failure) {
			console.error(JSON.stringify({Title: 'Failed to get user', UserId: userId, Error: failure.stack || failure.toString(), Detail: failure}, null, 2));
			return Promise.reject({
				Error: 'Unable to get user profile, please try again later.',
				Detail: failure
			});
		});
	};
	this.GetUserDataPromise = function(userId) {
		return apiService.getPromise('GET', '/user', {
			user: userId
		})
		.catch(function(failure) {
			console.error(JSON.stringify({Title: 'Failed to get user', UserId: userId, Error: failure.stack || failure.toString(), Detail: failure}, null, 2));
			return Promise.reject({
				Error: 'Unable to get user profile, please try again later.',
				Detail: failure
			});
		});
	};
	this.UpdateUserPromise = function(data) {
		return apiService.getPromise('PUT', '/user', data)
		.then(function(result) {
			console.log(JSON.stringify({Title: 'User Update Result', Result: result.toString(), Detail: result}, null, 2));
			return result;
		})
		.catch(function(failure) {
			console.error(JSON.stringify({Title: 'Failed to update user.', Error: failure.stack || failure.toString(), Detail: failure}, null, 2));
			return Promise.reject({
				Error: 'Unable to update current user, please resumbit.',
				Detail: failure
			});
		});
	};

	var normalizeUser = function(user, facebookInfo) {
		var bestRating = null;
		if(user.Stats && user.Stats.BestRating) { bestRating = user.Stats.BestRating; }
		return {
			edit: false,
			pushId: user.PushId,
			id: user.UserId,
			facebookId: facebookInfo.id || 0,
			name: facebookInfo.name || 'DisplayName',
			totalGames: (user.Stats || {}).TotalGames || 0,
			rating: (user.Rating || 1).toFixed(3),
			bestRating: (bestRating || user.Rating || 1).toFixed(3)
		};
	};
	this.SearchUsers = function(nameIndex) {
		return apiService.getPromise('POST', '/users', {
			name: nameIndex
		}).then(function(data){ return data.users; });
	};
	this.GetFriends = function() {
		return apiService.getPromise('GET', '/friends', {}).then(function(data){ return data.friends; });
	};
	this.IsFriend = function(friendId) {
		return apiService.getPromise('GET', '/friends', {
			friendId: friendId
		});
	};
	this.AddFriend = function(friendId) {
		return apiService.getPromise('POST', '/friends', {
			friendIds: [friendId]
		});
	};
	this.RemoveFriend = function(friendId) {
		return apiService.getPromise('DELETE', '/friends', {
			friendIds: [friendId]
		});
	};
}]);