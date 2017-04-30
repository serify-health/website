angular.module(SERIFYAPP).provider('eventHandler', ['apiServiceProvider', 'pageServiceProvider', 'utilitiesProvider', 'storageProviderServiceProvider',
		function(apiServiceProvider, pageServiceProvider, utilitiesProvider, storageProviderServiceProvider) {
	var isMobile = window.cordova && window.cordova.platformId !== 'browser';
	var getLogObjectPromise = function(eventType, information) {
		var versionPromise = isMobile ? cordova.getAppVersion.getVersionNumber() : Promise.resolve('0.0.0-browser');
		return versionPromise
		.then(function(version) {
			var logObject = {
				eventType: eventType,
				detail: {
					lastKnownLocation:  pageServiceProvider.$get().GetCurrentPage(),
					information: information || {},
					app: {
						version : version
					}
				}
			};
			return logObject;
		});
	};

	var storageProviderService = storageProviderServiceProvider.$get().GetStorageProvider('eventHandler');
	var cachedUserGuid = storageProviderService.Get('userGuid');
	var userGuid = cachedUserGuid || utilitiesProvider.$get().getGuid();
	if(!cachedUserGuid) { storageProviderService.Save('userGuid', userGuid); }
	this.$get = ['$injector', function($injector) {
		return {
			interaction: function(category, action, label, value) {
				var sendObject = {
					hitType: 'event',
					eventCategory: category,
					eventAction: action
				};
				if (label) { sendObject.eventLabel = label; }
				if (value) { sendObject.eventValue = value; }
				if(ga) {
					ga('send', sendObject);
				}
				return Promise.resolve();
			},
			capture: function(eventType, information) {
				var $http = $injector.get('$http');
				return getLogObjectPromise(eventType, information)
				.then(function(logObject) {
					var compositeLogObject = {
						method: 'POST',
						url: API_LOG_URL,
						headers: {
							'Content-Type': 'application/json'
						},
						data: {
							Application: APPLICATION,
							LogObject: logObject,
							LogReason: 'Log Capture',
							UserGuid: userGuid
						}
					};
					var host = window.document.location.hostname;
					if (host.match(/serify/)) { return $http(compositeLogObject); }
					else {
						console.log(JSON.stringify(compositeLogObject, null, 2));
					}
				})
				.catch(function(error) {
					console.error(JSON.stringify({Title: 'Event captured failed', Error: error.stack || error.toString(), Detail: error}, null, 2));
					return Promise.reject({
						Error: 'Failed to log event.',
						Detail: error
					});
				});
			}
		};
	}];
}]);