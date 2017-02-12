angular.module(GOLFPRO).service('logoutService', [
	'$window',
    'loginStatusProvider',
	'eventHandler',
	'pageService',
	'storageProviderService',
	'utilities',
function($window, loginStatusProvider, eventHandler, pageService, storageProviderService, utilities) {
    var storageProvider = storageProviderService.GetStorageProvider('credentials');
    this.Logout = function() {
        loginStatusProvider.logoutPromise()
        .then(function() {
            storageProvider.Delete('forgotPassword');
            storageProvider.Delete('username');
            storageProvider.Delete('password');
            $window.location.reload();
        });
    };
}]);