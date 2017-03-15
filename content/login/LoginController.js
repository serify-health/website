angular.module(SERIFYAPP).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/', { templateUrl: 'login/login.html', controller: 'loginController' });
	$routeProvider.when('/main', {redirectTo:'/'});
	$routeProvider.when('/home', {redirectTo:'/'});
}]);
angular.module(SERIFYAPP).controller('loginController', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$uibModal',
	'loginStatusProvider',
	'eventHandler',
	'pageService',
	'userManager',
	'ngDialog',
	'utilities',
	'linkManager',
	'logoutService',
function($scope, $rootScope, $routeParams, $uibModal, loginStatusProvider, eventHandler, pageService, userManager, ngDialog, utilities, linkManager, logoutService) {
	$scope.closeAlert = function(){ $scope.alert = null; };
	/******** SignInButton Block ********/
	// $scope.IsAdmin = false;
	// $rootScope.IsAdmin = false;
	$scope.UserAuthenticated = false;
	$rootScope.UserAuthenticated = false;
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
				$rootScope.email = data['cognito:username'];
			}
			catch (exception) {}
			$rootScope.UserAuthenticated = true;
			return userManager.GetUserIdPromise().then(function(id){
				$rootScope.$apply(function(){
					$rootScope.UserId = id;
				});
			});
		})
		.then(function(){
			var usernamemetadataPromise = userManager.GetUserDataPromise()
			.then(function(user){
				$rootScope.$apply(function(){
					$rootScope.IsAdmin = user.admin;
					$rootScope.userProfile = (user.userData || {}).profile;
					$rootScope.username = (user.userData || {}).username;
					var verifications = (user || {}).Verifications || [];
					verifications.map(function(verification) {
						verification.Inverse = verification.Name !== 'HPV' && verification.Name !== 'PrEP';
						verification.Name = TESTS.find(function(t){ return t.id === verification.Name; }).name;
					});
					$rootScope.verifications = verifications;
				});
			});
			var usernameLinkCreationPromise = linkManager.GetNewLinkPromise(null, null)
			.then(function(link){
				$rootScope.$apply(function(){
					$rootScope.userLink = {
						url: WEBSITE_VIEW_URL + link,
						link: link
					};
				});
			});
			return Promise.all([usernamemetadataPromise, usernameLinkCreationPromise]);
		}).catch(function(f){ console.log(f); });
	}
	
	$scope.SignInButtonClick = function() {
		if($rootScope.UserAuthenticated) {
			logoutService.Logout()
			.catch(function(failure) {
				console.log(failure);
				$scope.$apply(function(){
					$scope.alert = { type: 'danger', msg: 'Failed to log out.' };
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
	$scope.verifications = [];
	$scope.AddVerificationsButtonClick = function(){
		pageService.NavigateToPage('update');
	};
	$scope.SaveProfileButtonClick = function() {
		userManager.UpdateUserDataPromise({
			profile: $scope.userProfile,
			username: $scope.username
		}).then(function(){
			$scope.$apply(function(){
				$scope.alert = { type: 'success', msg: 'Profile updated' };
			});
		}).catch(function(failure) {
			console.error("Failed to save user profile: " + failure);
			$scope.$apply(function(){
				$scope.alert = { type: 'danger', msg: 'Failed to save profile. Please try again.' };
			});
		});
	};
}]);
