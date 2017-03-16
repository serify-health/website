angular.module(SERIFYAPP).provider('apiService', ['$locationProvider', function($locationProvider) {
	var isDebug = window.isDebug;
	this.$get = ['$location', '$http', function($location, $http) {
		var host = $location.host();
		if (host.match(/serify/)) {
			return {
				getPromise: function(httpMethod, resourcePath, body) {
					var lambda = new AWS.Lambda();
					var params = {
						FunctionName: LAMBDA_FUNCTION,
						//ClientContext: 'STRING_VALUE',
						InvocationType: 'RequestResponse',
						LogType: 'None',
						Payload: JSON.stringify({
							httpMethod: httpMethod,
							resourcePath: resourcePath,
							body: body || {}
						})
					};
					//if(!isDebug()) { params.Qualifier = 'PROD'; }

					return Promise.resolve()
					.then(function() {
						//console.log(JSON.stringify({Title: 'ApiProvider Execute Start', Now: new Date().toISOString(), Info: params }, null, 2));
						return lambda.invoke(params).promise();
					})
					.then(function(data) {
						var result = JSON.parse(data.Payload);
						if(data.StatusCode != 200 || result.statusCode != 200) {
							//console.log(JSON.stringify({Title: '===> End (Failure)', result: data, Now: new Date().toISOString()}, null, 2));
							return Promise.reject(result);
						}
						//console.log(JSON.stringify({Title: '===> End', Now: new Date().toISOString()}, null, 2));
						return result.body;
					});
				}
			};
		}
		else {
			return {
				getPromise: function(httpMethod, resourcePath, body) {
					return Promise.resolve($http({
						method: httpMethod,
						url: 'http://localhost:8080/api' + resourcePath,
						data: body
					}).then(function(response) {
						if(response.status != 200) {
							return Promise.reject(response.data);
						}
						return Promise.resolve(response.data);
					}, function(response) {
						if(response && response.status && response.status != 200) {
							return Promise.reject(response.data);
						}
						return Promise.reject({ title: 'failed to connect', data: response });
					}));
				}
			};
		}
	}];
}]);