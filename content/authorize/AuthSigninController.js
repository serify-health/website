angular.module(GOLFPRO).controller('authSigninController', [
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

    $scope.VerifyButtonClick = function() {
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
                pageService.NavigateToPage('/');
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
                            $scope.alert = { type: 'danger', msg: 'Ensure your email and password are correct, and request a new password reset link.'};
                        });
                }
                console.error(JSON.stringify({Title: 'Failed to verify new password', Error: error.stack || error.toString(), Detail: error}, null, 2));
            });
        }
        else if($routeParams.pin) {
            return verifySignin($routeParams.pin, username, password)
            .then(function(){
                storageProvider.Save('username', username);
                storageProvider.Save('password', password);
                pageService.NavigateToPage('/');
            })
            .catch(function(error){
                switch (error.code) {
                    case 'ExpiredCodeException':
                        $scope.$apply(function(){
                            $scope.alert = { type: 'danger', msg: 'This verification code is no longer valid, please check your email for a new code.'};
                        });
                        return loginStatusProvider.resendAuthorizationCodePromise(username, password)
                        .then(function(){
                            storageProvider.Save('username', username);
                            storageProvider.Save('password', password);
                            $scope.closeThisDialog(true);
                            pageService.NavigateToPage('/');
                        });
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
                        return loginStatusProvider.usernameSigninPromise(username, password)
                        .then(function() {
                            storageProvider.Save('username', username);
                            storageProvider.Save('password', password);
                            $scope.closeThisDialog(true);
                            pageService.NavigateToPage('/');
                        });
                    default:
                        $scope.$apply(function(){
                            $scope.alert = { type: 'danger', msg: 'Failed to register, please try again'};
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
        else { pageService.NavigateToPage('/'); }
    };
}]);