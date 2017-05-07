angular.module(SERIFYAPP).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/edit', { templateUrl: 'editProfile/editProfile.html', controller: 'editProfileController' });
}]);
angular.module(SERIFYAPP).controller('editProfileController', [
	'$scope',
	'pageService',
	'userManager',
	'eventHandler',
function($scope, pageService, userManager, eventHandler) {
	var currentYear = new Date().getFullYear();
	$scope.years = Array.apply(null, {length:100}).map(Number.call, Number).map(function(i) { return currentYear - i - 13; });
	$scope.months = Array.apply(null, {length:12}).map(Number.call, Number).map(function(i) { return i + 1; });
	$scope.days = Array.apply(null, {length:31}).map(Number.call, Number).map(function(i) { return i + 1; });
	$scope.username = null;
	$scope.userProfile = null;
	$scope.demographics = {
		name: null,
		selectedDobYear: null,
		selectedDobMonth: null,
		selectedDobDay: null
	};

	$scope.closeAlert = function(){ $scope.alert = null; };
	/******** SignInButton Block ********/
	$scope.links = [];
	$scope.$watch('authentication.complete', SetupUser, true);
	function SetupUser() {
		if ($scope.authentication.UserAuthenticated) {
			var usernamemetadataPromise = userManager.GetUserDataPromise()
			.then(function(user){
				$scope.$apply(function(){
					$scope.userProfile = (user.userData || {}).profile;
					$scope.username = (user.userData || {}).username;
					$scope.demographics = (user.userData || {}).demographics || {};
				});
			});
			return Promise.all([usernamemetadataPromise]).catch(function(f){ console.log(f); });
		}
	}

	/******** SignInButton Block ********/
	$scope.SaveProfileButtonClick = function() {
		eventHandler.interaction('Profile', 'Save');
		if(!$scope.demographics.selectedDobDay || !$scope.demographics.selectedDobMonth || !$scope.demographics.selectedDobDay)
		{
			$scope.alert = { type: 'danger', msg: 'DOB is required.' };
			return;
		}
		if(moment().add(-13, 'years') < moment($scope.demographics.selectedDobYear + '-' + $scope.demographics.selectedDobMonth + '-' + $scope.demographics.selectedDobDay, 'YYYY-MM-DD')) {
			$scope.alert = { type: 'danger', msg: 'The minimum age for Serify is 13, please see our information page for details.' };
			return;
		}
		if(!$scope.demographics.name) {
			$scope.alert = { type: 'danger', msg: 'Please enter your full name.' };
			return;
		}
		userManager.UpdateUserDataPromise({
			profile: $scope.userProfile,
			username: $scope.username,
			demographics: $scope.demographics
		}).then(function(){
			$scope.$apply(function(){
				$scope.alert = { type: 'success', msg: 'Profile updated' };
			});
			setTimeout(function() {
				pageService.NavigateToPage('/');
			}, 300);
		}).catch(function(failure) {
			console.error("Failed to save user profile: " + failure);
			$scope.$apply(function(){
				$scope.alert = { type: 'danger', msg: 'Failed to save profile. Please try again.' };
			});
		});
	};

	$scope.DeleteProfileButtonClick = function() {

	};
}]);
