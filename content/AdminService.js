angular.module(GOLFPRO).service('adminService', [ 'apiService', 'loginStatusProvider', function(apiService, loginStatusProvider) {
	this.GetCountsPromise = function(userId) {
		return apiService.getPromise('GET', '/summary', {})
		.catch(function(failure) {
			console.error(JSON.stringify({Title: 'Failed to get summary', UserId: userId, Error: failure.stack || failure.toString(), Detail: failure}, null, 2));
			return Promise.reject({
				Error: 'Unable to get serify summary, please try again later.',
				Detail: failure
			});
		});
	};
}]);