angular.module(GOLFPRO).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/home', { templateUrl: 'home/home.html', controller: 'homeController' });
}]);
angular.module(GOLFPRO).factory('authCache', function(){
	return Promise.reject('No Cache');
});
angular.module(GOLFPRO).controller('homeController', ['$scope', '$rootScope', 'loginStatusProvider', 'guiManager', 'pageService', 'authCache', 'userManager', 'eventHandler',
function($scope, $rootScope, loginStatusProvider, guiManager, pageService, authCache, userManager, eventHandler) {
	//Returning to the home screen happens often, so unless there is a failure with the last validation attempt, or the last push id update, don't bother relogging in.
	authCache = authCache.catch(function(){ return loginStatusProvider.validateAuthenticationPromise(); });
	authCache.catch(function(error){
		console.error(JSON.stringify({Title: 'Issues authenticating', Error: error.stack || error.toString(), Detail: error}, null, 2));
		pageService.NavigateToPage('/');
	});
	$scope.startGameButtonClick = function() {
		pageService.NavigateToPage('game');
	};

	$scope.newsButtonClick = function() {
		pageService.NavigateToPage('news');
	};

	$scope.competitionButtonClick = function() {
		pageService.NavigateToPage('competition');
	};

	$scope.profileButtonClick = function() {
		pageService.NavigateToPage('profile');
	};

	$scope.$on("$routeChangeSuccess", function($currentRoute, $previousRoute) {

	});
}]);