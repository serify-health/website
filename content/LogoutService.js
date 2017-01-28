angular.module(GOLFPRO).service('logoutService', [
	'loginStatusProvider',
	'eventHandler',
	'pageService',
	'storageProviderService',
	'utilities',
function(loginStatusProvider, eventHandler, pageService, storageProviderService, utilities) {
    var storageProvider = storageProviderService.GetStorageProvider('credentials');
    this.Logout = function() {
        storageProvider.Delete('forgotPassword');
        storageProvider.Delete('username');
        storageProvider.Delete('password');
    };
}]);