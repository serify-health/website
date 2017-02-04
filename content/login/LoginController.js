angular.module(GOLFPRO).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/', { templateUrl: 'login/login.html', controller: 'loginController' });
	$routeProvider.when('/main', {redirectTo:'/'});
	$routeProvider.when('/home', {redirectTo:'/'});
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
	'logoutService',
function($scope, $routeParams, loginStatusProvider, guiManager, eventHandler, pageService, userManager, ngDialog, utilities, linkManager, logoutService) {
	/******** SignInButton Block ********/
	$scope.IsAdmin = false;
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
				function IsAdmin(userId) {
					var adminUsers = {
						'us-east-1:e515087c-a24f-4d0e-9f00-8b47136dc691': true,
						'us-east-1:dd25300e-d365-4d74-8a56-94b917e92f63': true,
						'us-east-1:cf318438-b1d1-48b7-9af0-5c7bf271fc24': true,
						'us-east-1:bde636ae-408c-4905-b866-982be777b846': true,
						'us-east-1:b5c9e3b0-a191-4c83-9b7b-413a8dd6bfea': true,
						'us-east-1:9f3779f3-7f31-4821-95f3-bc1fccb351c8': true,
						'us-east-1:8f888fbc-8457-4b05-ad8e-540bd399c582': true,
						'us-east-1:62eb68de-e11b-4ca7-bc3b-a07b74f601ac': true,
						'us-east-1:3314fedf-d008-47ff-ba7a-997e5fa99e25': true,
						'us-east-1:2ab27d83-5b48-4d7b-a700-ed5461b9303f': true,
						'us-east-1:0013876b-6562-4f7f-bb72-f4f0d2b0367a': true,
						'us-east-1:6b8f8568-bac4-44ab-9c77-64c00212906a': true, // nastar@pl.o2
						'us-east-1:5ba6798f-29c5-41b0-b373-5db09938823b': true, // Kristine.Tran29@gmail.com
						'us-east-1:a6759634-6dda-4c50-9472-4bc3cbbdffda': true // jasonparad2@gmail.com
					};
					return adminUsers[userId];
				}
				$scope.$apply(function(){
					$scope.UserId = id;
					$scope.IsAdmin = IsAdmin(id);
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
			logoutService.Logout();
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
	$scope.SaveProfileButtonClick = function() {
		userManager.UpdateUserDataPromise({
			profile: $scope.userProfile,
			username: $scope.username
		}).then(function(){
			guiManager.toast('Profile updated', 1000, 'top');
		}).catch(function(failure) {
			console.error("Failed to save user profile: " + failure);
			guiManager.toast('Failed to save profile. Please try again.', 1000, 'top');
		});
	};
}]);