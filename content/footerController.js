angular.module(SERIFYAPP).controller('footerController', [
	'$scope',
	'$rootScope',
	'$uibModal',
	'eventHandler',
	'pageService',
function($scope, $rootScope, $uibModal, eventHandler, pageService) {
	$scope.ShowFeedBackFormClick = function () {
		eventHandler.interaction('Feedback', 'ShowForm');
		var modalInstance = $uibModal.open({
			templateUrl: 'feedback/feedbackForm.html',
			controller: 'feedbackController',
			resolve: {
				form: function() {
					return {
						userAuthenticated: $rootScope.authentication.UserAuthenticated,
						username: $rootScope.authentication.username,
						email: $rootScope.authentication.email
					};
				}
			}
		});

		modalInstance.result.then(function (selectedItem) {
			$scope.selected = selectedItem;
		}, function () {
			console.log('Modal dismissed at: ' + new Date());
		});
	};

	$scope.PrivacyButtonClick = function() {
		eventHandler.interaction('Navigation', 'Policy');
		pageService.NavigateToPage('policy');
	};
	$scope.TermsOfServiceButtonClick = function() {
		eventHandler.interaction('Navigation', 'Terms');
		pageService.NavigateToPage('terms');
	};
	$scope.AboutButtonClick = function() {
		eventHandler.interaction('Navigation', 'About');
		pageService.NavigateToPage('about');
	};
	$scope.copyRightDate = new Date().getFullYear();
}]);