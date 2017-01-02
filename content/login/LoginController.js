angular.module(GOLFPRO).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/', { templateUrl: 'login/login.html', controller: 'loginController' });
	$routeProvider.when('/main', {redirectTo:'/'});
}]);
angular.module(GOLFPRO).controller('loginController', [
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
	/******** SignInButton Block ********/
	$scope.IsAdmin = false;
	$scope.UserAuthenticated = false;
	$scope.links = [];
	function SetupUser() {
		return loginStatusProvider.validateAuthenticationPromise()
		.then(function() {
			$scope.UserAuthenticated = true;
			return userManager.GetUserIdPromise().then(function(id){
				function IsAdmin(userId) {
					var adminUsers = {
						'us-east-1:b5c9e3b0-a191-4c83-9b7b-413a8dd6bfea': true
					};
					return adminUsers[userId]
				}
				$scope.$apply(function(){
					$scope.UserId = id;
					$scope.IsAdmin = IsAdmin(id);
				});
			});
		})
		.then(function(){
			var usernamemetadataPromise = userManager.GetUserDataPromise()
			.then(function(userData){
				$scope.$apply(function(){
					$scope.verifications = (userData || {}).Verifications || [];
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
			loginStatusProvider.logoutPromise()
			.then(function() {
				$scope.$apply(function(){ $scope.UserAuthenticated = false; });
			}, function(failure) {
				console.log(failure);
				guiManager.toast('Failed to log out.', 1000, 'center');
			});
			return;
		}
		ngDialog.open({
			closeByNavigation: true,
			width: 320,
			template: 'login/signup.html',
			controller: 'signinController',
			className: 'ngdialog-theme-default'
		}).closePromise.then(function(dialogResult){
			return SetupUser();
		});
	};
	SetupUser();

	/******** SignInButton Block ********/
	$scope.verifications = [];
	$scope.AddVerificationsButtonClick = function(){
		pageService.NavigateToPage('update');
	};
	$scope.AdminButtonClick = function() {
		pageService.NavigateToPage('admin');
	};
}]);