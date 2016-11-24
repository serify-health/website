angular.module(GOLFPRO).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/signup/:pin?', { templateUrl: 'signup/signup.html', controller: 'signupController' });
}]);
angular.module(GOLFPRO).controller('signupController', [
	'$scope', '$routeParams', 'loginStatusProvider', 'guiManager', 'eventHandler', 'pageService', 'storageProviderService', 'userManager',
function($scope, $routeParams, loginStatusProvider, guiManager, eventHandler, pageService, storageProviderService, userManager) {
	$scope.LoginButtonsVisible = false;
	var storageProvider = storageProviderService.GetStorageProvider('credentials');

	function verifySignin(pin, username, password) {
		return loginStatusProvider.confirmUsernamePromise($routeParams.pin, username, password)
		.then(function(){
			return userManager.UpdateUserPromise({
				info: {
					Name: username.slice(0, username.indexOf('@')),
					Email: username,
					ShortName: username.slice(0, Math.min(4, username.indexOf('@')))
				}
			});
		})
		.then(function(){ pageService.NavigateWithoutStack('profile'); });
	}
	var cachedUsername = storageProvider.Get('username');
	var cachedPassword = storageProvider.Get('password');
	var forgotPasswordFlow = storageProvider.Get('forgotPassword');
	if(forgotPasswordFlow && $routeParams.pin && cachedUsername && cachedPassword) {
		storageProvider.Delete('forgotPassword');
		loginStatusProvider.confirmNewPasswordPromise($routeParams.pin, cachedUsername, cachedPassword)
		.then(function(){
			pageService.NavigateWithoutStack('home');
		}, function(error){
			$scope.LoginButtonsVisible = true;
			switch (error.code) {
				case 'ExpiredCodeException':
					guiManager.toast('Please request a new password reset link.', 3000, 'center');
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
	else if($routeParams.pin && cachedUsername && cachedPassword) {
		console.log('PIN: ' + $routeParams.pin);
		verifySignin($routeParams.pin, cachedUsername, cachedPassword)
		.catch(function(error){
			switch (error.code) {
				case 'ExpiredCodeException':
					guiManager.toast('Please request a new code.', 3000, 'center');
					break;
				case 'NotAuthorizedException':
					guiManager.toast('Username or password is incorrect, please retry.', 1000, 'center');
					break;
				case 'NetworkingError':
					guiManager.toast('Trouble connecting to peers, internet connection issue.', 2000, 'center');
					break;
				default:
					guiManager.toast('Ensure your email and password are correct, and request a new verification code.', 1000, 'center');
			}
			console.error(JSON.stringify({Title: 'Failed to verify pin', Error: error.stack || error.toString(), Detail: error}, null, 2));
			$scope.LoginButtonsVisible = true;
		});
	}
	else {
		$scope.LoginButtonsVisible = true;
	}

	$scope.GoBackClick = pageService.GoBackPage;
	$scope.ForgotPasswordButtonClick = function() {
		if (!$scope.email || !$scope.email.match(/^[A-Z0-9][A-Z0-9._%+-]*@[A-Z0-9.-]+\.[A-Z]{2,}$/i)) {
				guiManager.toast('Please enter a valid email address.', 1000, 'center');
			}
		else if(!$scope.password || $scope.password.length < 8) {
			guiManager.toast('Your new password must be at least 8 characters.', 1000, 'center');
		}
		else {
			var username = $scope.email.toLowerCase();
			var password = $scope.password;
			storageProvider.Save('username', username);
			storageProvider.Save('password', password);
			storageProvider.Save('forgotPassword', true);
			loginStatusProvider.startForgotPasswordPromise(username)
			.then(function(){
				guiManager.toast('Please check your email for a password reset link.', 2000, 'center');
			}, function(error){
				switch (error.code) {
					case 'UserNotFoundException':
					case 'ResourceNotFoundException':
						guiManager.toast('No user with that email address exists.', 3000, 'center');
						break;
					case 'InvalidParameterException':
						guiManager.toast(error.message, 3000, 'center');
						break;
					case 'NetworkingError':
						guiManager.toast('Trouble connecting to peers, internet connection issue.', 2000, 'center');
						break;
					default:
						guiManager.toast('Could not find a user with that email address, please ensure your email is correct and try again.', 1000, 'center');
				}
				console.error(JSON.stringify({Title: 'Failed to start Forget Password Flow', Error: error.stack || error.toString(), Detail: error}, null, 2));
				eventHandler.capture('LoginFailure', {Title: 'Failure to Start Forget Password using Username', User: username, Error: error.stack || error.toString(), Detail: error});
			});
		}
	};
	$scope.RegisterButtonClick = function() {
		$scope.register = !$scope.register;
	};

	function signInUser(username, password) {
		return loginStatusProvider.usernameSigninPromise(username, password)
		.then(function() {
			storageProvider.Save('username', username);
			storageProvider.Save('password', password);
			pageService.NavigateWithoutStack('home');
		}, function(error) {
			switch (error.code) {
				case 'UserNotFoundException':
				case 'ResourceNotFoundException':
					guiManager.toast('No user with that email address exists.', 3000, 'center');
					break;
				case 'PasswordResetRequiredException':
					guiManager.toast('Please reset your password by emailing the team using the feedback button.', 3000, 'center');
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

	function resendVerificationCode(username, password) {
		storageProvider.Save('username', username);
		storageProvider.Save('password', password);
		return loginStatusProvider.resendAuthorizationCodePromise(username, password)
		.then(function(){
			guiManager.toast('Please check your email for a verification link.', 2000, 'center');
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
	$scope.SignInButtonClick = function() {
		storageProvider.Delete('forgotPassword');
		var signinUsername = ($scope.email || '').toLowerCase();
		var signinPassword = $scope.password || '';
		if($scope.register) {
			if (!$scope.email || !$scope.password) {
				return guiManager.toast('Please enter your email address and password.', 1000, 'center');
			}
			if (!signinUsername.match(/^[A-Z0-9][A-Z0-9._%+-]*@[A-Z0-9.-]+\.[A-Z]{2,}$/i)) {
				guiManager.toast('Please enter a valid email address.', 1000, 'center');
			}
			else if(signinPassword.length < 8) {
				guiManager.toast('Password must be at least 8 characters.', 1000, 'center');
			}
			else if (signinPassword !== $scope.validatePassword) {
				guiManager.toast('Passwords do not match.', 1000, 'center');
			}
			else {
				loginStatusProvider.signupPromise(signinUsername, signinPassword)
				.then(function() {
					storageProvider.Save('username', signinUsername);
					storageProvider.Save('password', signinPassword);
					pageService.NavigateWithoutStack('/');
					guiManager.toast('Please check your email for a verification link.', 2000, 'center');
					$scope.register = false;
				}, function(error) {
					switch (error.code) {
						case 'UsernameExistsException':
							guiManager.toast('A user with that email already exists.', 3000, 'center');
							break;
						case 'NotAuthorizedException':
							guiManager.toast('There was an issue logging in with that email and password, please try again.', 3000, 'center');
							break;
						case 'NetworkingError':
							guiManager.toast('Trouble connecting to peers, internet connection issue.', 2000, 'center');
							break;
						default:
							guiManager.toast('Failed to register.', 3000, 'center');
							break;
					}
					console.error(JSON.stringify({Title: 'Failed signing user up', Error: error.stack || error.toString(), Detail: error}, null, 2));
					eventHandler.capture('LoginFailure', {Title: 'Failure signing user up', User: signInUser, Error: error.stack || error.toString(), Detail: error});
				});
			}
		}
		//Loginnig in on a new device.
		else if($routeParams.pin) {
			var username = ($scope.email || cachedUsername || '').toLowerCase();
			var password = $scope.password || cachedPassword || '';
			if(username.length === 0 || password.length === 0) {
				return guiManager.toast('Please enter your username and password.', 1000, 'center');
			}
			return verifySignin($routeParams.pin, username, password)
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
					default:
						guiManager.toast('Failed to register.', 3000, 'center');
						break;
				}
				console.error(JSON.stringify({Title: 'Failed to verify pin', Error: error.stack || error.toString(), Detail: error}, null, 2));
				guiManager.toast('Please ensure your username and password are correct. If you experience repeated issues, request a new verification code.', 3000, 'center');
				eventHandler.capture('LoginFailure', {Title: 'Failure to Verify Login using Username', User: username, Error: error.stack || error.toString(), Detail: error});
				return true;
			})
			.catch(function(error) {
				eventHandler.capture('LoginFailure', {Title: 'Failure to Verfiy Login using Username', User: username, Error: error.stack || error.toString(), Detail: error});
			});
		}
		else { return signInUser(signinUsername, signinPassword); }
	};
}]);