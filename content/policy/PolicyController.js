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
	$scope.links = [];
	
	function SetupUser() {
		return loginStatusProvider.validateAuthenticationPromise()
		.then(function(authData) {
			try {
				var data = JSON.parse(atob(authData.UserId.split('.')[1]));
				userManager.CaptureUserIdentity({
					cognitoSub: data.sub,
					email: data['cognito:username']
				});
			}
			catch (exception) {}
			$scope.UserAuthenticated = true;
			return userManager.GetUserIdPromise().then(function(id){
				$scope.$apply(function(){
					$scope.UserId = id;
					$scope.IsAdmin = adminService.IsAdmin(id);
				});
			});
		})
		.then(function(){
			var usernamemetadataPromise = userManager.GetUserDataPromise()
			.then(function(user){
				$scope.$apply(function(){
					$scope.userProfile = (user.userData || {}).profile;
					$scope.username = (user.userData || {}).username;
					var verifications = (user || {}).Verifications || [];
					verifications.map(function(verification) {
						verification.Inverse = verification.Name !== 'HPV' && verification.Name !== 'PrEP';
						verification.Name = TESTS.find(function(t){ return t.id === verification.Name; }).name;
					});
					$scope.verifications = verifications;
				});
			});
			var usernameLinkCreationPromise = linkManager.GetNewLinkPromise(null, null)
			.then(function(link){
				$scope.$apply(function(){
					$scope.userLink = WEBSITE_VIEW_URL + link;
				});
			});
			return Promise.all([usernamemetadataPromise, usernameLinkCreationPromise]);
		}).catch(function(f){ console.log(f); });
	}

	$scope.SignInButtonClick = function() {
		if($scope.UserAuthenticated) {
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

	$scope.ProfileButtonClick = function() {
		pageService.NavigateToPage('/');
	};
}]);