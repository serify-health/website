angular.module(GOLFPRO).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/view/:base64hash?', { templateUrl: 'view/view.html', controller: 'viewController' });
}]);
angular.module(GOLFPRO).controller('viewController', [
	'$scope',
	'$routeParams',
	'loginStatusProvider',
	'guiManager',
	'eventHandler',
	'pageService',
	'userManager',
	'ngDialog',
	'utilities',
	'linkManager',
function($scope, $routeParams, loginStatusProvider, guiManager, eventHandler, pageService, userManager, ngDialog, utilities, linkManager) {
	loginStatusProvider.validateUnauthenticationPromise()
	.then(function() {
		return linkManager.ResolveHashPromise($routeParams.base64hash)
		.then(data => {
			return userManager.GetUserDataPromise(data.UserId)
			.then(function(userData){
				$scope.$apply(function(){
					$scope.linkname = data.Linkname;
					$scope.username = data.Username;
					$scope.verifications = (userData || {}).Verifications || [];
				});
			});
		});
	}).catch(s => console.log(s));
}]);