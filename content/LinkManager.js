angular.module(SERIFYAPP).service('linkManager', [ 'apiService', 'loginStatusProvider', function(apiService, loginStatusProvider) {
	this.GetNewLinkPromise = function(linkname, username) {
		return apiService.getPromise('POST', '/link', {
			linkname: linkname,
			username: username
		})
		.catch(function(failure) {
			console.error(JSON.stringify({Title: 'Failed to create link', Error: failure.stack || failure.toString(), Detail: failure}, null, 2));
			return Promise.reject({
				Error: 'Cannot create link.',
				Detail: failure
			});
		});
	};
	this.ResolveHashPromise = function(hash) {
		return apiService.getPromise('GET', '/link', {
			hash: hash
		})
		.catch(function(failure) {
			console.error(JSON.stringify({Title: 'Failed to resolve hash to link', Error: failure.stack || failure.toString(), Detail: failure}, null, 2));
			return Promise.reject({
				Error: 'Cannot resolve hash to link.',
				Detail: failure
			});
		});
	};
}]);