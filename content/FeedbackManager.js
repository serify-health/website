angular.module(SERIFYAPP).service('feedbackManager', [ 'apiService', 'loginStatusProvider', function(apiService, loginStatusProvider) {
	this.CreateFeedback = function(feedback) {
		return apiService.getPromise('POST', '/feedback', feedback)
		.catch(function(failure) {
			console.error(JSON.stringify({Title: 'Failed to send feedback', Error: failure.stack || failure.toString(), Detail: failure}, null, 2));
			return Promise.reject({
				Error: 'Unable to send feedback, please try again later.',
				Detail: failure
			});
		});
	};
	this.GetFeedback = function() {
		return apiService.getPromise('GET', '/feedback')
		.catch(function(failure) {
			console.error(JSON.stringify({Title: 'Failed to get feedback', Error: failure.stack || failure.toString(), Detail: failure}, null, 2));
			return Promise.reject({
				Error: 'Unable to get feedback, please try again later.',
				Detail: failure
			});
		});
	};
}]);