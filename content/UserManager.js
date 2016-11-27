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
	this.SetVerifications = function(verifications) {
		return apiService.getPromise('Post', '/user/verifications', data)
		.then(function(result) {
			console.log(JSON.stringify({Title: 'User Update Result', Result: result.toString(), Detail: result}, null, 2));
			return result;
		})
		.catch(function(failure) {
			console.error(JSON.stringify({Title: 'Failed to set verification results.', Error: failure.stack || failure.toString(), Detail: failure}, null, 2));
			return Promise.reject({
				Error: 'Unable to update current user, please resumbit.',
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
}]);