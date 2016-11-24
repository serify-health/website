angular.module(GOLFPRO).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/', { templateUrl: 'login/login.html', controller: 'loginController' });
}]);
angular.module(GOLFPRO).controller('loginController', [
	'$scope', 'loginStatusProvider', 'guiManager', 'eventHandler', 'pageService', 'userManager',
function($scope, loginStatusProvider, guiManager, eventHandler, pageService, userManager) {
	$scope.LoginButtonsVisible = false;
	loginStatusProvider.validateAuthenticationPromise().then(
		function() { pageService.NavigateOrigin('home'); },
		function() { $scope.LoginButtonsVisible = true; }
	);
	$scope.eulaUrl = 'https://github.com/FutureSport-Technologies/Golf-Pro/blob/master/EULA.md';
	$scope.SignInWithUserNameButtonClick = function() {
		$scope.LoginButtonsVisible = false;
		pageService.NavigateToPage('signup');
	};
}]);