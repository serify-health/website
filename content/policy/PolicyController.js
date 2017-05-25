angular.module(SERIFYAPP).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/policy', { templateUrl: 'policy/policy.html', controller: 'policyController' });
	$routeProvider.when('/terms', { templateUrl: 'policy/termsOfService.html', controller: 'policyController' });
	$routeProvider.when('/about', { templateUrl: 'policy/about.html', controller: 'policyController' });
}]);
angular.module(SERIFYAPP).controller('policyController', ['$scope', 'pageService', function($scope, pageService) {
	$scope.PrivacyButtonClick = function() {
		pageService.NavigateToPage('policy');
	};
	$scope.TermsButtonClick = function() {
		pageService.NavigateToPage('terms');
	};
}]);