angular.module(SERIFYAPP).controller('signinController', [
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
    function verifySignin(pin, username, password) {
        return loginStatusProvider.confirmUsernamePromise($routeParams.pin, username, password)
        .then(function(){
            console.log('User logged in: ' + username);
        })
        .then(function(){ $scope.closeThisDialog(true); });
    }
    var forgotPasswordFlow = storageProvider.Get('forgotPassword');

    $scope.ForgotPasswordButtonClick = function() {
        if (!$scope.email || !$scope.email.match(/^[A-Z0-9][A-Z0-9._%+-]*@[A-Z0-9.-]+\.[A-Z]{2,}$/i)) {
            $scope.alert = { type: 'danger', msg: 'Please enter a valid email address.' };
        }
        else if(!$scope.password || $scope.password.length < 8) {
            $scope.alert = { type: 'danger', msg: 'Enter a new password which must be at least 8 characters.' };
        }
        else {
            $scope.HideLoginButton = true;
            $scope.closeAlert();
            var username = $scope.email.toLowerCase();
            var password = $scope.password;
            storageProvider.Save('username', username);
            storageProvider.Save('password', password);
            storageProvider.Save('forgotPassword', true);
            eventHandler.capture('ForgotPassword', {Title: 'Starting forgot password flow', User: username});
            loginStatusProvider.startForgotPasswordPromise(username)
            .then(function(){
                $scope.$apply(function(){
                    $scope.alert = { type: 'success', msg: 'Please check your email for a password reset link.', done: true };
                });
                setTimeout(function(){
                    $scope.closeThisDialog(true);
                }, 5000);
            }, function(error){
                $scope.$apply(function() {
                    $scope.HideLoginButton = false;
                });
                switch (error.code) {
                    case 'UserNotFoundException':
                    case 'ResourceNotFoundException':
                        $scope.$apply(function(){
                            $scope.alert = { type: 'danger', msg: 'No user with that email address exists.'};
                        });
                        break;
                    case 'InvalidParameterException':
                        $scope.$apply(function(){
                            $scope.alert = { type: 'danger', msg: error.message};
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
                console.error(JSON.stringify({Title: 'Failed to start Forget Password Flow', User: username, Error: error.stack || error.toString(), Detail: error}, null, 2));
                eventHandler.capture('LoginFailure', {Title: 'Failure to Start Forget Password using Username', User: username, Error: error.stack || error.toString(), Detail: error});
            });
        }
    };
    $scope.RegisterButtonClick = function() {
        storageProvider.Delete('forgotPassword');
        var signinUsername = ($scope.email || '').toLowerCase();
        var signinPassword = $scope.password || '';
        if (!$scope.email || !$scope.password) {
                $scope.alert = { type: 'danger', msg: 'Please enter your email address and password.'};
            }
        if (!signinUsername.match(/^[A-Z0-9][A-Z0-9._%+-]*@[A-Z0-9.-]+\.[A-Z]{2,}$/i)) {
            $scope.alert = { type: 'danger', msg: 'Please enter a valid email address.'};
        }
        else if(signinPassword.length < 8) {
            $scope.alert = { type: 'danger', msg: 'Password must be at least 8 characters.'};
        }
        else {
            $scope.HideLoginButton = true;
            $scope.closeAlert();
            eventHandler.capture('RegisterUser', {Title: 'Starting new user flow', User: signinUsername});
            loginStatusProvider.signupPromise(signinUsername, signinPassword)
            .then(function() {
                storageProvider.Save('username', signinUsername);
                storageProvider.Save('password', signinPassword);
                $scope.$apply(function(){
                    $scope.alert = { type: 'success', msg: 'Please check your email for a Serify activation link.', done: true };
                });
                setTimeout(function(){
                    $scope.closeThisDialog(true);
                }, 5000);
            }, function(error) {
                $scope.$apply(function() {
                    $scope.HideLoginButton = false;
                });
                switch (error.code) {
                    case 'UsernameExistsException':
                        $scope.$apply(function(){
                            $scope.alert = { type: 'danger', msg: 'A user with that email address already exists.'};
                        });
                        break;
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
                    default:
                        $scope.$apply(function(){
                            $scope.alert = { type: 'danger', msg: 'Failed to register'};
                        });
                        break;
                }
                console.error(JSON.stringify({Title: 'Failed signing user up', Error: error.stack || error.toString(), Detail: error}, null, 2));
                eventHandler.capture('LoginFailure', {Title: 'Failure signing user up', User: signinUsername, Error: error.stack || error.toString(), Detail: error});
            });
        }
    };

    function signInUser(username, password) {
        $scope.HideLoginButton = true;
        $scope.closeAlert();
        return loginStatusProvider.usernameSigninPromise(username, password)
        .then(function() {
            storageProvider.Save('username', username);
            storageProvider.Save('password', password);
            $scope.closeThisDialog(true);
        }, function(error) {
            $scope.$apply(function() {
                $scope.HideLoginButton = false;
            });
            switch (error.code) {
                case 'UserNotFoundException':
                case 'ResourceNotFoundException':
                    $scope.$apply(function(){
                        $scope.alert = { type: 'danger', msg: 'No user with that email address exists.'};
                    });
                    break;
                case 'PasswordResetRequiredException':
                    $scope.$apply(function(){
                        $scope.alert = { type: 'danger', msg: 'Please reset your password by emailing the team using the feedback button.'};
                    });
                    break;
                case 'UserNotConfirmedException':
                    $scope.$apply(function(){
                        $scope.alert = { type: 'danger', msg: 'Please check your email for a verification link.'};
                    });
                    break;
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

    function resendVerificationCode(username, password) {
        $scope.HideLoginButton = true;
        $scope.closeAlert();
        storageProvider.Save('username', username);
        storageProvider.Save('password', password);
        return loginStatusProvider.resendAuthorizationCodePromise(username, password)
        .then(function(){
            $scope.$apply(function(){
                $scope.alert = { type: 'success', msg: 'Please check your email for a verification link.', done: true };
            });
            setTimeout(function(){
                $scope.closeThisDialog(true);
            }, 5000);
        }, function(error){
            $scope.$apply(function() {
                $scope.HideLoginButton = false;
            });
            switch (error.code) {
                case 'InvalidParameterException':
                    if(error.message.match('User is already confirmed.')) {
                        return signInUser(username, password);
                    }
                    break;
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
            console.error(JSON.stringify({Title: 'Failed to Resend Verification Code', User: username, Error: error.stack || error.toString(), Detail: error}, null, 2));
            eventHandler.capture('LoginFailure', {Title: 'Failure to Resend Verification code', User: username, Error: error.stack || error.toString(), Detail: error});
        });
    }
    $scope.SignInButtonClick = function() {
        var username = ($scope.email || '').toLowerCase();
        var password = $scope.password || '';
        if(username.length === 0 || password.length === 0) {
            $scope.alert = { type: 'danger', msg: 'Please enter your username and password.'};
            return;
        }

        //Loginnig in on a new device.
        if(forgotPasswordFlow && $routeParams.pin) {
            storageProvider.Delete('forgotPassword');
            loginStatusProvider.confirmNewPasswordPromise($routeParams.pin, username, password)
            .then(function(){
                $scope.closeThisDialog(true);
            }, function(error){
                switch (error.code) {
                    case 'ExpiredCodeException':
                        $scope.$apply(function(){
                            $scope.alert = { type: 'danger', msg: 'This verification link has expired, please request a new one.'};
                        });
                        break;
                    case 'NetworkingError':
                        $scope.$apply(function(){
                            $scope.alert = { type: 'danger', msg: 'Trouble connecting to peers, internet connection issue.'};
                        });
                        break;
                    default:
                        $scope.$apply(function(){
                            $scope.alert = { type: 'danger', msg: 'Ensure your email and password are correct, and please try again.'};
                        });
                }
                console.error(JSON.stringify({Title: 'Failed to verify new password', Error: error.stack || error.toString(), Detail: error}, null, 2));
                eventHandler.capture('LoginFailure', {Title: 'Failure to verify new password', User: username, Error: error.stack || error.toString(), Detail: error});
            });
        }
        else if($routeParams.pin) {
            return verifySignin($routeParams.pin, username, password)
            .then(function(){
                storageProvider.Save('username', username);
                storageProvider.Save('password', password);
            })
            .catch(function(error){
                switch (error.code) {
                    case 'ExpiredCodeException':
                        $scope.$apply(function(){
                            $scope.alert = { type: 'danger', msg: 'Please verify your account by navigating to your email and clicking on the link in there.'};
                        });
                        break;
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
                            $scope.alert = { type: 'danger', msg: 'Failed to register, please try again.'};
                        });
                        break;
                }
                console.error(JSON.stringify({Title: 'Failed to verify pin', Error: error.stack || error.toString(), Detail: error}, null, 2));
                eventHandler.capture('LoginFailure', {Title: 'Failure to Verify Login using Username', User: username, Error: error.stack || error.toString(), Detail: error});
                return true;
            })
            .catch(function(error) {
                eventHandler.capture('LoginFailure', {Title: 'Failure to Verfiy Login using Username', User: username, Error: error.stack || error.toString(), Detail: error});
            });
        }
        else { return signInUser(username, password); }
    };

    $scope.ResendVerificationCodeButtonClick = function() {
        var username = ($scope.email || '').toLowerCase();
        var password = $scope.password || '';
        if(username.length === 0 || password.length === 0) {
            $scope.alert = { type: 'danger', msg: 'Please enter your username and password.'};
            return;
        }
        storageProvider.Delete('forgotPassword');
        return resendVerificationCode(username, password);
    };
}]);
