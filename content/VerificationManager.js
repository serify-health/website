angular.module(SERIFYAPP).service('verificationManager', [ 'apiService', 'loginStatusProvider', function(apiService, loginStatusProvider) {
	this.GetVerifications = function() {
		return apiService.getPromise('GET', '/verifications', {})
		.catch(function(failure) {
			console.error(JSON.stringify({Title: 'Failed to get verifications', Error: failure.stack || failure.toString(), Detail: failure}, null, 2));
			return Promise.reject({
				Error: 'Unable to get verifications, please try again later.',
				Detail: failure
			});
		});
	};
	this.ApproveVerifications = function(verifications, userId, time) {
		return apiService.getPromise('POST', '/verifications', {
			verifications: verifications,
			updateUserId: userId,
			updateUserTime: time,
			result: 'APPROVE'
		})
		.then(function(result) {
			console.log(JSON.stringify({Title: 'Verification Request Update Result', Result: result.toString(), Detail: result}, null, 2));
			return result;
		})
		.catch(function(failure) {
			console.error(JSON.stringify({Title: 'Failed to set verification as approved.', Error: failure.stack || failure.toString(), Detail: failure}, null, 2));
			return Promise.reject({
				Error: 'Unable to update verification request, please resumbit.',
				Detail: failure
			});
		});
	};
	this.RejectVerifications = function(verifications, userId, time) {
		return apiService.getPromise('POST', '/verifications', {
			verifications: verifications,
			updateUserId: userId,
			updateUserTime: time,
			result: 'REJECT'
		})
		.then(function(result) {
			console.log(JSON.stringify({Title: 'Verification Request Update Result', Result: result.toString(), Detail: result}, null, 2));
			return result;
		})
		.catch(function(failure) {
			console.error(JSON.stringify({Title: 'Failed to set verification as approved.', Error: failure.stack || failure.toString(), Detail: failure}, null, 2));
			return Promise.reject({
				Error: 'Unable to update verification request, please resumbit.',
				Detail: failure
			});
		});
	};
}]);