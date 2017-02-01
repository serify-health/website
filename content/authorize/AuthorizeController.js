angular.module(GOLFPRO).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/authorize/:pin?', { templateUrl: 'authorize/authorize.html', controller: 'authorizeController' });
}]);
angular.module(GOLFPRO).controller('authorizeController', [
	'$scope',
	'$routeParams',
	'loginStatusProvider',
	'guiManager',
	'eventHandler',
	'pageService',
	'userManager',
	'ngDialog',
	'storageProviderService',
	'utilities',
function($scope, $routeParams, loginStatusProvider, guiManager, eventHandler, pageService, userManager, ngDialog, storageProviderService, utilities) {
	$scope.UserAuthenticated = false;
	var storageProvider = storageProviderService.GetStorageProvider('credentials');
	
	var username = storageProvider.Get('username');
	var password = storageProvider.Get('password');
	var forgotPasswordFlow = storageProvider.Get('forgotPassword');

	function signInUser() {
		return loginStatusProvider.usernameSigninPromise(username, password)
		.then(function() {
			$scope.closeThisDialog(true);
		}, function(error) {
			switch (error.code) {
				case 'UserNotFoundException':
				case 'ResourceNotFoundException':
					guiManager.toast('No user with that email address exists.', 3000, 'center');
					break;
				case 'PasswordResetRequiredException':
					guiManager.toast('Please reset your password.', 3000, 'center');
					break;
				case 'UserNotConfirmedException':
					return resendVerificationCode(username, password);
				case 'NetworkingError':
					guiManager.toast('Trouble connecting to peers, internet connection issue.', 2000, 'center');
					break;
				case 'InvalidParameterException':
					guiManager.toast('Please check your username and password and sign in again.', 2000, 'center');
					break;
				default:
					guiManager.toast('Failed to sign in with user.', 3000, 'center');
			}
			console.error(JSON.stringify({Title: 'Failed signing in user', Error: error.stack || error.toString(), Detail: error}, null, 2));
			eventHandler.capture('LoginFailure', {Title: 'Failure to SignIn using Username', User: username, Error: error.stack || error.toString(), Detail: error});
		});
	}

	function resendVerificationCode() {
		return loginStatusProvider.resendAuthorizationCodePromise(username, password)
		.then(function(){
			guiManager.toast('Please check your email for a verification link.', 2000, 'center');
			$scope.closeThisDialog(false);
		}, function(error){
			switch (error.code) {
				case 'UserNotFoundException':
				case 'ResourceNotFoundException':
					guiManager.toast('No user with that email address exists.', 3000, 'center');
					break;
				case 'NetworkingError':
					guiManager.toast('Trouble connecting to peers, internet connection issue.', 2000, 'center');
					break;
				default:
					guiManager.toast('Could not find a user with that email address, please ensure your email is correct and try again.', 1000, 'center');
			}
			console.error(JSON.stringify({Title: 'Failed to Resend Verification Code', Error: error.stack || error.toString(), Detail: error}, null, 2));
		});
	}

	if(forgotPasswordFlow && $routeParams.pin && username && password) {
		storageProvider.Delete('forgotPassword');
		loginStatusProvider.confirmNewPasswordPromise($routeParams.pin, username, password)
		.then(function(){
			pageService.NavigateToPage('/');
		}, function(error){
			switch (error.code) {
				case 'ExpiredCodeException':
					guiManager.toast('Please request a new password using the reset link.', 3000, 'center');
					break;
				case 'NetworkingError':
					guiManager.toast('Trouble connecting to peers, internet connection issue.', 2000, 'center');
					break;
				default:
					guiManager.toast('Ensure your email and password are correct, and request a new password reset link.', 1000, 'center');
			}
			console.error(JSON.stringify({Title: 'Failed to verify new password', Error: error.stack || error.toString(), Detail: error}, null, 2));
		});
	}
	else if($routeParams.pin && username && password) {
		return loginStatusProvider.confirmUsernamePromise($routeParams.pin, username, password)
		.then(function(){
			pageService.NavigateToPage('/');
		})
		.catch(function(error){
			switch (error.code) {
				case 'ExpiredCodeException':
					return resendVerificationCode(username, password);
				case 'NotAuthorizedException':
					guiManager.toast('There was an issue logging in with that email and password, please try again.', 3000, 'center');
					break;
				case 'NetworkingError':
					guiManager.toast('Trouble connecting to peers, internet connection issue.', 2000, 'center');
					break;
				case 'InvalidParameterException':
					return signInUser(username, password);
				default:
					guiManager.toast('Failed to register.', 3000, 'center');
					break;
			}
			console.error(JSON.stringify({Title: 'Failed to verify pin', Error: error.stack || error.toString(), Detail: error}, null, 2));
			eventHandler.capture('LoginFailure', {Title: 'Failure to Verify Login using Username', User: username, Error: error.stack || error.toString(), Detail: error});
		})
		.catch(function(error) {
			eventHandler.capture('LoginFailure', {Title: 'Failure to Verfiy Login using Username', User: username, Error: error.stack || error.toString(), Detail: error});
		});
	}
	else if(forgotPasswordFlow || $routeParams.pin) {
		ngDialog.open({
			closeByNavigation: true,
			width: 320,
			template: 'authorize/signup.html',
			controller: 'authSigninController',
			className: 'ngdialog-theme-default'
		}).closePromise.then(function(dialogResult){
			console.log(JSON.stringify(dialogResult, null, 2));
			// var isarray = Object.prototype.toString.call(dialogResult.value) === '[object Array]';
			// if(!isarray || !dialogResult.value || dialogResult.value.length < 1) { return; }
			if(dialogResult.value) {
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
		})
		.then(function(){
			pageService.NavigateToPage('/');
		});
	}
	else {
		pageService.NavigateToPage('/');
	}
}]);