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
	'logoutService',
function($scope, $routeParams, loginStatusProvider, guiManager, eventHandler, pageService, userManager, ngDialog, utilities, linkManager, logoutService) {
	/******** SignInButton Block ********/
	$scope.UserAuthenticated = false;
	function SetupUser() {
		return loginStatusProvider.validateAuthenticationPromise()
		.then(function() {
			$scope.$apply(function() {
				$scope.UserAuthenticated = true;
			});
		})
		.catch(function(error) {
			console.log('Failed to log user in: ' + error);
		});
	}

	$scope.SignInButtonClick = function() {
		if($scope.UserAuthenticated) {
			logoutService.Logout();
			loginStatusProvider.logoutPromise()
			.then(function() {
				$scope.$apply(function(){ $scope.UserAuthenticated = false; });
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
					$scope.verifications = nonNullUser.Verifications || [];
				});
			});
		});
	})
	.catch(function(error){
		$scope.$apply(function(){
			$scope.error = 'This link is no longer valid.';
		});
	});
	$scope.ProfileButtonClick = function() {
		pageService.NavigateToPage('/');
	};
}]);