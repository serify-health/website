angular.module(SERIFYAPP).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/', { templateUrl: 'login/login.html', controller: 'loginController' });
	$routeProvider.when('/main', {redirectTo:'/'});
	$routeProvider.when('/home', {redirectTo:'/'});
}]);
angular.module(SERIFYAPP).controller('loginController', [
	'$scope',
	'pageService',
	'userManager',
	'linkManager',
	'eventHandler',
function($scope, pageService, userManager, linkManager, eventHandler) {
	$scope.closeAlert = function(){ $scope.alert = null; };
	/******** SignInButton Block ********/
	$scope.links = [];
	$scope.$watch('authentication.complete', SetupUser, true);
	function SetupUser() {
		if ($scope.authentication.UserAuthenticated) {
			var usernamemetadataPromise = userManager.GetUserDataPromise()
			.then(function(user){
				$scope.$apply(function(){
					$scope.profile = (user.userData || {}).profile;
					$scope.username = (user.userData || {}).username;
					var originalVerifications = (user || {}).Verifications || [];
					var verifications = originalVerifications.filter(function(v) { return TESTS[v.Name]; }).map(function(verification) {
						verification.Inverse = verification.Name !== 'HPV' && verification.Name !== 'PrEP' && verification.Name !== 'HIVLoad';
						verification.Name = TESTS[verification.Name || verification.name].name;
						return verification;
					});
					$scope.verifications = verifications;
				});
			});
			var usernameLinkCreationPromise = linkManager.GetNewLinkPromise(null, null)
			.then(function(link){
				$scope.$apply(function(){
					$scope.userLink = {
						url: WEBSITE_VIEW_URL + link,
						link: link
					};
				});
			});
			return Promise.all([usernamemetadataPromise, usernameLinkCreationPromise]).catch(function(f){ console.log(f); });
		}
	}

	/******** SignInButton Block ********/
	$scope.verifications = [];
	$scope.AddVerificationsButtonClick = function() {
		eventHandler.interaction('Profile', 'StartVerifications');
		pageService.NavigateToPage('update');
	};

	$scope.CreateButtonClick = function() {
		eventHandler.interaction('Index', 'CreateAccount');
		$scope.SignInButtonClick();
	};

	$scope.EditProfileButtonClick = function() {
		eventHandler.interaction('Navigation', 'Edit');
		pageService.NavigateToPage('edit');
	};
}]);
