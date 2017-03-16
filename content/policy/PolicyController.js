angular.module(SERIFYAPP).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/policy', { templateUrl: 'policy/policy.html', controller: 'policyController' });
}]);
angular.module(SERIFYAPP).controller('policyController', ['$scope', function($scope) {
}]);