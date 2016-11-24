var module = angular.module(GOLFPRO).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/logout', { templateUrl: 'login/login.html', controller: 'logoutController' });
}]);
angular.module(GOLFPRO).controller('logoutController', ['$scope', 'loginStatusProvider', 'guiManager', 'pageService', function($scope, loginStatusProvider, guiManager, pageService) {
	loginStatusProvider.logoutPromise()
	.then(function() {
		guiManager.toast('Successfully logged out.', 1000, 'center');
		pageService.NavigateToPage('/');
	}, function(failure) {
		console.log(failure);
		guiManager.toast('Failed to log out.', 1000, 'center');
	});
}]);