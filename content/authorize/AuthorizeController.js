angular.module(GOLFPRO).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/authorize/:pin?', { templateUrl: 'authorize/authorize.html', controller: 'authorizeController' });
}]);
angular.module(GOLFPRO).controller('authorizeController', [
	'$scope',
	'$routeParams',
	'loginStatusProvider',
	'eventHandler',
	'pageService',
	'userManager',
	'ngDialog',
	'storageProviderService',
	'utilities',
function($scope, $routeParams, loginStatusProvider, eventHandler, pageService, userManager, ngDialog, storageProviderService, utilities) {
	$scope.closeAlert = function(){ $scope.alert = null; };
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
					$scope.$apply(function(){
						$scope.alert = { type: 'danger', msg: 'No user with that email address exists.'};
					});
					break;
				case 'PasswordResetRequiredException':
					$scope.$apply(function(){
						$scope.alert = { type: 'danger', msg: 'Please reset your password.'};
					});
					break;
				case 'UserNotConfirmedException':
					return resendVerificationCode(username, password);
				case 'NetworkingError':
					$scope.$apply(function(){
						$scope.alert = { type: 'danger', msg: 'Trouble connecting to peers, internet connection issue.'};
					});
					break;
				case 'InvalidParameterException':
					$scope.$apply(function(){
						$scope.alert = { type: 'danger', msg: 'Please check your username and password and sign in again.'};
					});
					break;
				default:
					$scope.$apply(function(){
						$scope.alert = { type: 'danger', msg: 'Failed to sign in with user.'};
					});
			}
			console.error(JSON.stringify({Title: 'Failed signing in user', Error: error.stack || error.toString(), Detail: error}, null, 2));
			eventHandler.capture('LoginFailure', {Title: 'Failure to SignIn using Username', User: username, Error: error.stack || error.toString(), Detail: error});
		});
	}

	function resendVerificationCode() {
		return loginStatusProvider.resendAuthorizationCodePromise(username, password)
		.then(function(){
			$scope.$apply(function(){
				$scope.alert = { type: 'success', msg: 'Please check your email for a verification link.'};
			});
			$scope.closeThisDialog(false);
		}, function(error){
			switch (error.code) {
				case 'UserNotFoundException':
				case 'ResourceNotFoundException':
				$scope.$apply(function(){
					$scope.alert = { type: 'danger', msg: 'No user with that email address exists.'};
				});
					break;
				case 'NetworkingError':
					$scope.$apply(function(){
						$scope.alert = { type: 'danger', msg: 'Trouble connecting to peers, internet connection issue.'};
					});
					break;
				default:
					$scope.$apply(function(){
						$scope.alert = { type: 'danger', msg: 'Could not find a user with that email address, please ensure your email is correct and try again.'};
					});
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
					$scope.$apply(function(){
						$scope.alert = { type: 'danger', msg: 'Please request a new password using the reset link.'};
					});
					break;
				case 'NetworkingError':
					$scope.$apply(function(){
						$scope.alert = { type: 'danger', msg: 'Trouble connecting to peers, internet connection issue.'};
					});
					break;
				default:
					$scope.$apply(function(){
						$scope.alert = { type: 'danger', msg: 'Ensure your email and password are correct, and request a new password reset link.'};
					});
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
					$scope.$apply(function(){
						$scope.alert = { type: 'danger', msg: 'There was an issue logging in with that email and password, please try again.'};
					});
					break;
				case 'NetworkingError':
					$scope.$apply(function(){
						$scope.alert = { type: 'danger', msg: 'Trouble connecting to peers, internet connection issue.'};
					});
					break;
				case 'InvalidParameterException':
					return signInUser(username, password);
				default:
					$scope.$apply(function(){
						$scope.alert = { type: 'danger', msg: 'Failed to register.'};
					});
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
