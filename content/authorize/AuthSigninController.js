angular.module(GOLFPRO).controller('authSigninController', [
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
    var storageProvider = storageProviderService.GetStorageProvider('credentials');
    function verifySignin(pin, username, password) {
        return loginStatusProvider.confirmUsernamePromise($routeParams.pin, username, password)
        .then(function(){
            console.log('User logged in: ' + username);
        })
        .then(function(){ $scope.closeThisDialog(true); });
    }
    var forgotPasswordFlow = storageProvider.Get('forgotPassword');

    function signInUser(username, password) {
        return loginStatusProvider.usernameSigninPromise(username, password)
        .then(function() {
            storageProvider.Save('username', username);
            storageProvider.Save('password', password);
            $scope.closeThisDialog(true);
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
            $scope.closeThisDialog(false);
        }, function(error){
            switch (error.code) {
                case 'InvalidParameterException':
                    if(error.message.match('User is already confirmed.')) {
                        return signInUser(username, password);
                    }
                    break;
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
    $scope.VerifyButtonClick = function() {
        var username = ($scope.email || '').toLowerCase();
        var password = $scope.password || '';
        if(username.length === 0 || password.length === 0) {
            return guiManager.toast('Please enter your username and password.', 1000, 'center');
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
        else if($routeParams.pin) {
            return verifySignin($routeParams.pin, username, password)
            .then(function(){
                storageProvider.Save('username', username);
                storageProvider.Save('password', password);
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
                return true;
            })
            .catch(function(error) {
                eventHandler.capture('LoginFailure', {Title: 'Failure to Verfiy Login using Username', User: username, Error: error.stack || error.toString(), Detail: error});
            });
        }
        else { return signInUser(username, password); }
    };
}]);