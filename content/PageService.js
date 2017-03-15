angular.module(SERIFYAPP).provider('pageService', [function(){
	var currentPage = '/';
	var stack = [];
	var service = {
		GetCurrentPage: function() { return currentPage; },
		AllowNavigateBackPage : function(path) {
			return currentPage != '/' && currentPage != '/home' && currentPage != '/main' && currentPage === path;
		},
		/* jshint -W093 */
		SetCurrentPage: function(newPage) { return currentPage = newPage; },
		/* jshint +W093 */
		NavigateOrigin: function(newPage) {
			if(currentPage == '/') {
				console.log('Navigating to Origin page: ' + currentPage + ' => ' + newPage);
				if(ga) {
					ga('set', 'page', '/' + newPage);
					ga('send', 'pageview');
				}
				window.location.hash = newPage;
			}
		},
		NavigateWithoutStack: function(newPage) {
			console.log('Navigating to page: ' + currentPage + ' => ' + newPage);
			window.location.hash = newPage;
			if(ga) {
				ga('set', 'page', '/' + newPage);
				ga('send', 'pageview');
			}
		},
		NavigateWithRemoveStack: function(newPage) {
			console.log('Navigating to page: ' + currentPage + ' => ' + newPage);
			stack = ['home'];
			window.location.hash = newPage;
			if(ga) {
				ga('set', 'page', '/' + newPage);
				ga('send', 'pageview');
			}
		},
		NavigateToPage: function(newPage) {
			console.log('Navigating to page: ' + currentPage + ' => ' + newPage);
			stack.push(currentPage);
			window.location.hash = newPage;
			if(ga) {
				ga('set', 'page', '/' + newPage);
				ga('send', 'pageview');
			}
		},
		GoBackPage: function() {
			if(!currentPage) {
				console.log('The currently open page was not set');
				window.location.hash = 'home';
				if(ga) {
					ga('set', 'page', '/home');
					ga('send', 'pageview');
				}
				return;
			}

			var openPage = currentPage.split('/')[1];
			console.log('BackButton from page: ' + openPage);
			var previousPage = stack.pop() || 'home';
			console.log('Navigating to page: ' + currentPage + ' => ' + previousPage);
			window.location.hash = previousPage;
			if(ga) {
				ga('set', 'page', '/' + previousPage);
				ga('send', 'pageview');
			}
		}
	};
	this.$get = function() { return service; };
}]);