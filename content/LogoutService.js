angular.module(SERIFYAPP).service('logoutService', [
	'$window',
    '$rootScope',
    'loginStatusProvider',
	'pageService',
	'storageProviderService',
	'utilities',
function($window, $rootScope, loginStatusProvider, pageService, storageProviderService, utilities) {
    var storageProvider = storageProviderService.GetStorageProvider('credentials');
    this.Logout = function() {
        loginStatusProvider.logoutPromise()
        .then(function() {
            $rootScope.$apply(function() {
                $rootScope.authentication = {};
            });
            storageProvider.Delete('forgotPassword');
            storageProvider.Delete('username');
            storageProvider.Delete('password');
            $window.location.reload();
            pageService.NavigateToPage('/');
        });
    };
}]);