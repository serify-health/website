angular.module(GOLFPRO).provider('pageService', [function(){
	var currentPage = '/';
	var stack = [];
	var service = {
		GetCurrentPage: function() { return currentPage; },
		AllowNavigateBackPage : function(path) {
			return currentPage != '/' && currentPage != '/home' && currentPage === path;
		},
		/* jshint -W093 */
		SetCurrentPage: function(newPage) { return currentPage = newPage; },
		/* jshint +W093 */
		NavigateOrigin: function(newPage) {
			if(currentPage == '/') {
				console.log('Navigating to Origin page: ' + currentPage + ' => ' + newPage);
				window.location.hash = newPage;
			}
		},
		NavigateWithoutStack: function(newPage) {
			console.log('Navigating to page: ' + currentPage + ' => ' + newPage);
			window.location.hash = newPage;
		},
		NavigateWithRemoveStack: function(newPage) {
			console.log('Navigating to page: ' + currentPage + ' => ' + newPage);
			stack = ['home'];
			window.location.hash = newPage;
		},
		NavigateToPage: function(newPage) {
			console.log('Navigating to page: ' + currentPage + ' => ' + newPage);
			stack.push(currentPage);
			window.location.hash = newPage;
		},
		GoBackPage: function() {
			if(!currentPage) {
				console.log('The currently open page was not set');
				window.location.hash = 'home';
				return;
			}

			var openPage = currentPage.split('/')[1];
			console.log('BackButton from page: ' + openPage);
			switch(openPage) {
				case '': //login
				case 'logout':
				case 'home':
					navigator.splashscreen.hide();
					navigator.app.exitApp();
					return;
				default:
					break;
			}

			var previousPage = stack.pop() || 'home';
			console.log('Navigating to page: ' + currentPage + ' => ' + previousPage);
			window.location.hash = previousPage;
		}
	};
	this.$get = function() { return service; };
}]);