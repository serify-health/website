angular.module(GOLFPRO).provider('guiManager', function() {
	var isMobile = window.cordova && window.cordova.platformId !== 'browser';
	var service = {
		alert: function(a, b, c, d) { navigator.notification && navigator.notification.alert ? navigator.notification.alert(a, b, c, d) : window.alert(a); },
		confirm: function(a, b, c) {
			return new Promise(function(s, f) {
				if(isMobile && navigator.notification && navigator.notification.alert) {
					return navigator.notification.confirm(a, function(i) { i == 1 ? s() : f(); }, c, ['OK', 'Cancel']);
				}
				else { return window.confirm(a) ? s() : f(); }
			})
			.then(function() { return b(true); })
			.catch(function() { return b(false); });
		},
		confirmPromise: function(a, c) {
			return new Promise(function(s, f) {
				if(isMobile && navigator.notification && navigator.notification.confirm) {
					return navigator.notification.confirm(a, function(i) { i == 1 ? s() : f(); }, c, ['OK', 'Cancel']);
				}
				else { return window.confirm(a) ? s() : f(); }
			});
		},
		promptPromise: function(question, title, buttons, defaultAnswer) {
			return new Promise(function(s, f) {
				if(isMobile && navigator.notification && navigator.notification.prompt) {
					return navigator.notification.prompt(question, function(result) { results.buttonIndex == 1 ? s(results.input1) : f(); }, title, buttons || ['OK'], defaultAnswer);
				}
				else {
					var result = window.prompt(question, defaultAnswer);
					return result ? s(result) : f();
				}
			});
		},
		toast: function(message) {
			return new Promise(function(s, f) {
				window.alert(message);
				s(null);
			});
		}
	};
	this.$get = function() { return service; };
});