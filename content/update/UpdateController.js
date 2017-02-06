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

	$scope.SignInButtonClick = function() {
		if($scope.UserAuthenticated) {
			logoutService.Logout();
			loginStatusProvider.logoutPromise()
			.then(function() {
				$scope.$apply(function(){ $scope.UserAuthenticated = false; });
			}, function(failure) {
				console.log(failure);
				$scope.$apply(function(){
					$scope.alert = { type: 'danger', msg: 'Failed to log out.' };
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
			Date: new Date().getMonth() + 1 + '/' + new Date().getFullYear(),
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
		if(!$scope.dob) {
			$scope.alert = { type: 'danger', msg: 'Please enter your date of birth.' };
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
			dob: $scope.dob,
			name: $scope.name,
			clinicInfo: $scope.clinicInfo,
			clinicName: $scope.clinicName,
			signature: signaturePad.toDataURL()
		};
		var verificationPromise = userManager.VerificationRequest($scope.verifications, userDetails)
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
}]);