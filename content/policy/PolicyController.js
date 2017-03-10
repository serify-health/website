angular.module(GOLFPRO).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/policy', { templateUrl: 'policy/policy.html', controller: 'policyController' });
}]);
angular.module(GOLFPRO).controller('policyController', [
	'$scope',
	'$anchorScroll',
	'$routeParams',
	'loginStatusProvider',
	'eventHandler',
	'pageService',
	'userManager',
	'ngDialog',
	'utilities',
	'linkManager',
	'logoutService',
function($scope, $anchorScroll, $routeParams, loginStatusProvider, eventHandler, pageService, userManager, ngDialog, utilities, linkManager, logoutService) {
	/******** SignInButton Block ********/
	$scope.closeAlert = function(){ $scope.alert = null; };
	$scope.UserAuthenticated = false;
	$rootScope.UserAuthenticated = false;
	$scope.links = [];
	
	function SetupUser() {
		return loginStatusProvider.validateAuthenticationPromise()
		.then(function(authData) {
			$scope.$apply(function() { $rootScope.UserAuthenticated = true; });
		}).catch(function(f){ console.log(f); });
	}

	$scope.SignInButtonClick = function() {
		if($rootScope.ScopeUserAuthenticated) {
			logoutService.Logout()
			.catch(function(failure) {
				console.log(failure);
				$scope.$apply(function(){
					$scope.alert = { type: 'danger', msg: 'Failed to log out' };
				});
			});
			return;
		}
		ngDialog.open({
			closeByNavigation: true,
			width: 320,
			template: 'login/signup.html',
			controller: 'signinController',
			className: 'ngdialog-theme-default'
		}).closePromise.then(function(){
			return SetupUser();
		});
	};
	SetupUser();

	/******** SignInButton Block ********/
}]);