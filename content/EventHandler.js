angular.module(GOLFPRO).provider('eventHandler', ['apiServiceProvider', 'pageServiceProvider', 'utilitiesProvider', 'storageProviderServiceProvider',
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
			log: function(eventType, information) {
				var $http = $injector.get('$http');
				getLogObjectPromise(eventType, information).then(function(logObject){
					if(!isMobile) { return logObject; }
					var dbEventPromise = apiServiceProvider.$get().getPromise('POST', '/event', logObject)
					.then(function(success) {
						console.log(JSON.stringify({Title: 'Event logged', Result: logObject}, null, 2));
						return Promise.resolve(success);
					});
					var streamEventPromise = $http({
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
					});
					return Promise.all([dbEventPromise, streamEventPromise])
					.catch(function(failure) {
						console.error(JSON.stringify({Title: 'Failed to log event.', LogObject: logObject, Error: failure.stack || failure.toString(), Detail: failure}, null, 2));
						return Promise.reject({
							Error: 'Failed to log event.',
							Detail: failure
						});
					});
				});
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
					if(window.document.location.hostname === 'localhost') {
						console.log(JSON.stringify(compositeLogObject, null, 2));
					}
					return $http(compositeLogObject);
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