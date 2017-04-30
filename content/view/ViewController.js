angular.module(SERIFYAPP).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/view/:base64hash?', { templateUrl: 'view/view.html', controller: 'viewController' });
}]);
angular.module(SERIFYAPP).controller('viewController', [
	'$scope',
	'$routeParams',
	'loginStatusProvider',
	'pageService',
	'userManager',
	'ngDialog',
	'utilities',
	'linkManager',
	'eventHandler',
	'storageProviderService',
function($scope, $routeParams, loginStatusProvider, pageService, userManager, ngDialog, utilities, linkManager, eventHandler, storageProviderService) {
	eventHandler.interaction('View', 'Profile');
	var storageProvider = storageProviderService.GetStorageProvider('announcements');
	$scope.hideBanner = storageProvider.Get('bigideas-2017');
	$scope.closeAlert = function() {
		eventHandler.interaction('Banner', 'Dismissed', 'Message', 'bigideas-2017');
		$scope.hideBanner = true;
		storageProvider.Save('bigideas-2017', true);
	};

	$scope.voteButtonClick = function() {
		eventHandler.interaction('Banner', 'Voted', 'Message', 'bigideas-2017');
		$scope.hideBanner = true;
		storageProvider.Save('bigideas-2017', true);
		window.open('http://platform.votigo.com/fbcontests/showentry/2017-Big-Ideas-Peoples-Choice-Video-Contest/2206327');
	};

	loginStatusProvider.validateUnauthenticationPromise()
	.then(function() {
		return linkManager.ResolveHashPromise($routeParams.base64hash)
		.then(function(data) {
			if(data === null) {
				return Promise.reject({title: 'No data for hash', base64Hash: $routeParams.base64hash});
			}
			return userManager.GetUserDataPromise(data.UserId)
			.then(function(user){
				$scope.$apply(function(){
					var nonNullUser = user || {};
					var userData = nonNullUser.userData || {};
					$scope.linkname = data.Linkname || 'NULL';
					$scope.username = userData.username || data.Username || 'Anonymous';
					$scope.profile = userData.profile;
					var verifications = nonNullUser.Verifications || [];
					verifications.map(function(verification) {
						verification.Inverse = verification.Name !== 'HPV' && verification.Name !== 'PrEP';
					});
					var uniqueVerificationsMap = {};
					verifications.filter(function(v) { return TESTS[v.Name] && v.Status === 'Verified'; }).map(function(v){
						v.displayName = TESTS[v.Name || v.name].name;
						if(!uniqueVerificationsMap[v.Name]) {
							uniqueVerificationsMap[v.Name] = v;
						}
						else {
							var d = uniqueVerificationsMap[v.Name].Date;
							var formatMap = {
								'0': null,
								'1': 'MM/YYYY',
								'2': 'MM/DD/YYYY'
							};
							var currentDate = moment(d, formatMap[d.split('/').length - 1]);
							var possibleDate = moment(v.Date, formatMap[v.Date.split('/').length - 1]);
							if (possibleDate > currentDate) {
								uniqueVerificationsMap[v.Name] = v;
							}
						}
					});
					$scope.verifications = Object.keys(uniqueVerificationsMap).map(function(v){ return uniqueVerificationsMap[v]; });
				});
			});
		});
	})
	.catch(function(error){
		$scope.$apply(function(){
			$scope.error = 'This link is no longer valid.';
		});
	});
}]);