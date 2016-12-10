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
	/******** SignInButton Block ********/
	$scope.UserAuthenticated = false;
	function SetupUser() {
		return loginStatusProvider.validateAuthenticationPromise()
		.then(function() {
			$scope.UserAuthenticated = true;
			return userManager.GetUserIdPromise().then(function(id){
				$scope.$apply(function(){
					$scope.UserId = id;
				});
			});
		});
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
			console.log(JSON.stringify(dialogResult, null, 2));
			// var isarray = Object.prototype.toString.call(dialogResult.value) === '[object Array]';
			// if(!isarray || !dialogResult.value || dialogResult.value.length < 1) { return; }
			//if(dialogResult.value) {
			return SetupUser();
		});
	};
	SetupUser();

	/******** SignInButton Block ********/

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