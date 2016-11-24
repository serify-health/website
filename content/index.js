var isMobile = false;

var module = angular.module(GOLFPRO, ['ngRoute', 'ngAnimate', 'ngTouch', 'ngSanitize']);
module.provider('utilities', [function() {
	var service = {
		getGuid: function() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random()*16|0;
				var v = c === 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
			});
		}
	};
	this.$get = function() { return service; };
}]);
module.config(['$animateProvider', function($animateProvider) {
	!$animateProvider.classNameFilter(/^(?!do-not-animate).*$/);
}]);
module.factory('$exceptionHandler', ['$log', 'eventHandler', function($log, eventHandler) {
	return function (exception, cause) {
		eventHandler.log('AngularError', {
			exception: exception.toString(),
			stack: exception.stack,
			cause: cause
		});
		$log.error(exception, cause);
	};
}]);
module.run(['$rootScope', '$window', '$location', '$animate', 'eventHandler', 'pageService', 'loginStatusProvider',
	function($rootScope, $window, $location, $animate, eventHandler, pageService, loginStatusProvider) {
	$rootScope.GoBackClick = pageService.GoBackPage;
	$window.handleOpenURL = pageService.OpenUrl;
	document.addEventListener("backbutton", function(e) { pageService.GoBackPage(); }, false);
	document.addEventListener("resume", function(e){
		loginStatusProvider.validateAuthenticationPromise()
		.catch(function(failure){
			console.log(JSON.stringify({Title: 'Failed to automatically login on resume', Error: failure.stack || failure.toString(), Detail: failure}));
		});
	}, false);

	//Force loading of the error service one time.
	$window.ErrorHandlerList.push(function(error, func, line){
		eventHandler.log('UnhandledUiError', {
			error: error.toString(),
			function: func.toString() + ':' + line.toString(),
			detail: JSON.stringify(func) + ' - ' + JSON.stringify(line)
		});
	});

	console.log('AWS Error Handler enabled');

	$rootScope.$on('$locationChangeStart', function(event) {
		if(!isMobile && pageService.AllowNavigateBackPage($location.path())) {
			event.preventDefault();
			pageService.GoBackPage();
		}
	});

	$rootScope.$on('$locationChangeSuccess', function() {
		pageService.SetCurrentPage($location.path());
	});

	$animate.enabled(true);
}]);

var mainApp = document.getElementsByTagName('body');
angular.element(mainApp).ready(function() {
	angular.bootstrap(mainApp, [GOLFPRO], { strictDi: true });
});
FastClick.attach(document.body);