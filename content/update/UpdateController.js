angular.module(GOLFPRO).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/update', { templateUrl: 'update/update.html', controller: 'updateController' });
}]);
angular.module(GOLFPRO).controller('updateController', [
	'$scope',
	'$anchorScroll',
	'$routeParams',
	'loginStatusProvider',
	'eventHandler',
	'pageService',
	'userManager',
	'ngDialog',
	'utilities',
	'linkManager',
	'logoutService',
function($scope, $anchorScroll, $routeParams, loginStatusProvider, eventHandler, pageService, userManager, ngDialog, utilities, linkManager, logoutService) {
	/******** SignInButton Block ********/
	$scope.closeAlert = function(){ $scope.alert = null; };
	$scope.UserAuthenticated = false;
	$scope.links = [];
	function SetupUser() {
		return loginStatusProvider.validateAuthenticationPromise()
		.then(function() {
			$scope.UserAuthenticated = true;
		}, function(notLoggedIn){
			pageService.NavigateToPage('/');
		});
	}
	$scope.tests = TESTS;
	var currentYear = new Date().getFullYear();
	$scope.years = Array.apply(null, {length:100}).map(Number.call, Number).map(function(i) { return currentYear - i - 13; });
	$scope.months = Array.apply(null, {length:12}).map(Number.call, Number).map(function(i) { return i + 1; });
	$scope.days = Array.apply(null, {length:31}).map(Number.call, Number).map(function(i) { return i + 1; });
	$scope.selectedDobYear = null;
	$scope.selectedDobMonth = null;
	$scope.selectedDobDay = null;
	$scope.verificationMonths = $scope.months;
	$scope.verificationYears = [0, 1, 2, 3, 4, 5].map(function(i) { return currentYear - i; });
	$scope.SignInButtonClick = function() {
		if($scope.UserAuthenticated) {
			logoutService.Logout()
			.catch(function(failure) {
				console.log(failure);
				$scope.$apply(function(){
					$scope.alert = { type: 'danger', msg: 'Failed to log out' };
				});
			});
			return;
		}
		ngDialog.open({
			closeByNavigation: true,
			width: 320,
			template: 'login/signup.html',
			controller: 'signinController',
			className: 'ngdialog-theme-default'
		}).closePromise.then(function(){
			return SetupUser();
		});
	};
	SetupUser();

	/******** SignInButton Block ********/
	$scope.verifications = [];
	$scope.AddRowButtonClick = function() {
		$scope.verifications.push({
			Id: utilities.getGuid(),
			Name: '',
			Year: new Date().getFullYear(),
			Month: new Date().getMonth() + 1,
			Status: 'Unknown'
		});
	};
	$scope.RemoveVerification = function(verificationId) {
		$scope.verifications.splice($scope.verifications.findIndex(function(v){ return v.Id === verificationId; }), 1);
	};

	var canvas = document.querySelector("canvas");
	var signaturePad = new SignaturePad(canvas);

	var alertElement = angular.element(document.querySelector('#alert'));
	$scope.SubmitVerificationsButtonClick = function() {
		if($scope.verifications.length < 1) {
			$scope.alert = { type: 'danger', msg: 'Add a test to verify.' };
			$anchorScroll();
			return;
		}
		if(signaturePad.isEmpty()) {
			$scope.alert = { type: 'danger', msg: 'Signature on the release form is requiired.' };
			$anchorScroll();
			return;
		}
		if(!$scope.selectedDobDay || !$scope.selectedDobMonth || !$scope.selectedDobDay)
		{
			$scope.alert = { type: 'danger', msg: 'DOB is required.' };
			$anchorScroll();
			return;
		}
		if(moment().add(-13, 'years') < moment($scope.selectedDobYear + '-' + $scope.selectedDobMonth + '-' + $scope.selectedDobDay, 'YYYY-MM-DD')) {
			$scope.alert = { type: 'danger', msg: 'The minimum age for Serify is 13, please see our information page for details.' };
			$anchorScroll();
			return;
		}
		if(!$scope.UserAuthenticated) {
			$scope.alert = { type: 'danger', msg: 'Create account to get your test results verified.' };
			$anchorScroll();
			return;
		}
		if(!$scope.name) {
			$scope.alert = { type: 'danger', msg: 'Please enter your full name.' };
			$anchorScroll();
			return;
		}
		if(!$scope.clinicName) {
			$scope.alert = { type: 'danger', msg: 'Please enter the clinic name where the tests where performed.' };
			$anchorScroll();
			return;
		}
		if(!$scope.clinicInfo) {
			$scope.alert = { type: 'danger', msg: 'Please enter the contact details for the clinic.' };
			$anchorScroll();
			return;
		}

		var userDetails = {
			dob: new Date($scope.selectedDobYear, $scope.selectedDobMonth, $scope.selectedDobDay).toISOString(),
			name: $scope.name,
			clinicInfo: $scope.clinicInfo,
			clinicName: $scope.clinicName,
			signature: signaturePad.toDataURL()
		};
		var verifications = $scope.verifications.filter(function(v){ return v.Name; }).map(function(v) {
			v.Date = v.Month + '/' + v.Year;
			return v;
		});
		var verificationPromise = userManager.VerificationRequest(verifications, userDetails)
		.then(function(){
			$scope.$apply(function(){
				$scope.alert = { type: 'success', msg: 'Verifications Submitted.' };
			});
			pageService.NavigateToPage('/');
		}, function(failure){
			console.error(failure);
			$scope.$apply(function(){
				$scope.alert = { type: 'danger', msg: 'Failed to submit verifications.' };
				$anchorScroll();
			});
		});
	};

	$scope.ProfileButtonClick = function() {
		pageService.NavigateToPage('/');
	};

	$scope.ClearSignatureButtonClick = function() {
		signaturePad.clear();
	};

	$scope.ProfileButtonClick = function() {
		pageService.NavigateToPage('/');
	};
}]);