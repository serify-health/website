angular.module(SERIFYAPP).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/authorize/:pin?', { templateUrl: 'authorize/authorize.html', controller: 'authorizeController' });
}]);
angular.module(SERIFYAPP).controller('authorizeController', [
	'$scope',
	'$window',
	'$routeParams',
	'loginStatusProvider',
	'eventHandler',
	'pageService',
	'userManager',
	'ngDialog',
	'storageProviderService',
	'utilities',
function($scope, $window, $routeParams, loginStatusProvider, eventHandler, pageService, userManager, ngDialog, storageProviderService, utilities) {
	$scope.closeAlert = function(){ $scope.alert = null; };
	var storageProvider = storageProviderService.GetStorageProvider('credentials');

	var username = storageProvider.Get('username');
	var password = storageProvider.Get('password');
	$scope.forgotPasswordFlow = storageProvider.Get('forgotPassword');

	function signInUser() {
		return loginStatusProvider.usernameSigninPromise(username, password)
		.then(function() {
			pageService.NavigateToPage('/');
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
		}, function(error){
			switch (error.code) {
				case 'UserNotFoundException':
				case 'ResourceNotFoundException':
				$scope.$apply(function(){
					$scope.alert = { type: 'danger', msg: 'No user with that email address exists.'};
				});
					break;
				case 'InvalidParameterException':
					pageService.NavigateToPage('/');
					return;
				case 'NetworkingError':
				case 'LimitExceededException':
					$scope.$apply(function(){
						$scope.alert = { type: 'danger', msg: 'Trouble connecting to Serify, please try again later.'};
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

	if ($scope.forgotPasswordFlow) {
		if($routeParams.pin && username && password) {
			storageProvider.Delete('forgotPassword');
			loginStatusProvider.confirmNewPasswordPromise($routeParams.pin, username, password)
			.then(function(){
				pageService.NavigateToPage('/');
				$window.location.reload();
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
				return openPopup();
			});
		}
		else {
			openPopup();
		}
	}

	$scope.CancelButtonClick = function() {
		pageService.NavigateToPage('/');
		eventHandler.capture('TermsCancelWarning', {
			title: 'User cancelled terms agreement',
			User: username
		});
	};

	$scope.hideAuthorize = false;

	var openPopup = function() {
		$scope.hideAuthorize = false;
		return ngDialog.open({
			closeByNavigation: true,
			width: 320,
			template: 'authorize/signup.html',
			controller: 'authSigninController',
			className: 'ngdialog-theme-default'
		}).closePromise.then(function(dialogResult){
			console.log(JSON.stringify(dialogResult, null, 2));
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
			$window.location.reload();
		});
	};
	$scope.AgreementButtonClick = function() {
		$scope.hideAuthorize = true;
		if($routeParams.pin && username && password) {
			return loginStatusProvider.confirmUsernamePromise($routeParams.pin, username, password)
			.then(function(){
				pageService.NavigateToPage('/');
				$window.location.reload();
			})
			.catch(function(error) {
				setTimeout(function() {
					$scope.$apply(function() { $scope.hideAuthorize = false; });
					switch (error.code) {
						case 'ExpiredCodeException':
							return resendVerificationCode(username, password);
						case 'InvalidParameterException':
							return signInUser(username, password);
						default:
							return openPopup();
					}
				}, 300);
			})
			.catch(function(error) {
				eventHandler.capture('LoginFailure', {Title: 'Failure to Verfiy Login using Username', User: username, Error: error.stack || error.toString(), Detail: error});
			});
		}
		else if($routeParams.pin) {
			openPopup();
		}
		else {
			pageService.NavigateToPage('/');
			$window.location.reload();
		}
	};

	$scope.ProfileButtonClick = function() {
		pageService.NavigateToPage('/');
		$window.location.reload();
	};
}]);
