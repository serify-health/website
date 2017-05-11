angular.module(SERIFYAPP).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/view/:base64hash?', { templateUrl: 'view/view.html', controller: 'viewController' });
}]);
angular.module(SERIFYAPP).controller('viewController', [
	'$scope',
	'$routeParams',
	'loginStatusProvider',
	'pageService',
	'userManager',
	'utilities',
	'linkManager',
	'eventHandler',
	'storageProviderService',
function($scope, $routeParams, loginStatusProvider, pageService, userManager, utilities, linkManager, eventHandler, storageProviderService) {
	eventHandler.interaction('PublicView', 'View', null, $routeParams.base64hash);
	var storageProvider = storageProviderService.GetStorageProvider('announcements');
	$scope.hideBanner = true;
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
		.then(function(user) {
			if(user === null) {
				return Promise.reject({title: 'No data for hash', base64Hash: $routeParams.base64hash});
			}
			$scope.$apply(function() {
				$scope.user = user;
				var userData = user.userData || {};
				$scope.username = userData.username || 'Anonymous';
				$scope.profile = userData.profile;
				var verifications = user.verifications || [];
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
	})
	.catch(function(error){
		$scope.$apply(function(){
			$scope.error = 'This link is no longer valid.';
		});
	});
}]);