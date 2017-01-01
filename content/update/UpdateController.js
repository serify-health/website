angular.module(GOLFPRO).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/update', { templateUrl: 'update/update.html', controller: 'updateController' });
}]);
angular.module(GOLFPRO).controller('updateController', [
	'$scope',
	'$routeParams',
	'loginStatusProvider',
	'guiManager',
	'eventHandler',
	'pageService',
	'userManager',
	'ngDialog',
	'utilities',
	'linkManager',
function($scope, $routeParams, loginStatusProvider, guiManager, eventHandler, pageService, userManager, ngDialog, utilities, linkManager) {
	/******** SignInButton Block ********/
	$scope.UserAuthenticated = false;
	$scope.links = [];
	function SetupUser() {
		return loginStatusProvider.validateAuthenticationPromise()
		.then(function() {
			$scope.UserAuthenticated = true;
			return userManager.GetUserIdPromise().then(function(id){
				$scope.$apply(function(){
					$scope.UserId = id; 
				});
			});
		}, function(notLoggedIn){
			pageService.NavigateToPage('/');
		});
	}

	$scope.SignInButtonClick = function() {
		if($scope.UserAuthenticated) {
			loginStatusProvider.logoutPromise()
			.then(function() {
				$scope.$apply(function(){ $scope.UserAuthenticated = false; });
			}, function(failure) {
				console.log(failure);
				guiManager.toast('Failed to log out.', 1000, 'center');
			});
			return;
		}
		ngDialog.open({
			closeByNavigation: true,
			width: 320,
			template: 'login/signup.html',
			controller: 'signinController',
			className: 'ngdialog-theme-default'
		}).closePromise.then(function(dialogResult){
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
			Date: new Date().toLocaleDateString(),
			Status: 'Unknown'
		});
	};
	$scope.RemoveVerification = function(verificationId) {
		$scope.verifications.splice($scope.verifications.findIndex(function(v){ return v.Id === verificationId; }), 1);
	};

	var canvas = document.querySelector("canvas");
	var signatureSet = false;
	var signaturePad = new SignaturePad(canvas);

	$scope.SubmitVerificationsButtonClick = function() {
		if($scope.verifications.length < 1) {
			guiManager.toast('Add a test to verify.');
			return;
		}
		if(signaturePad.isEmpty()) {
			guiManager.toast('Signature on the release form is requiired.');
			return;
		}
		if(!$scope.UserAuthenticated) {
			guiManager.toast('Create account to get your test results verified.');
			return;
		}
		if(!$scope.name) {
			guiManager.toast('Please enter your full name.');
			return;
		}
		if(!$scope.dob) {
			guiManager.toast('Please enter your date of birth.');
			return;
		}
		if(!$scope.clinicName) {
			guiManager.toast('Please enter the clinic name where the tests where performed.');
			return;
		}
		if(!$scope.clinicInfo) {
			guiManager.toast('Please enter the contact details for the clinic.');
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
			guiManager.toast('Verifications Submitted.', 1000, 'center');
			pageService.NavigateToPage('/');
		}, function(failure){
			console.error(failure);
			guiManager.toast('Failed to submit verifications.', 1000, 'center');
		});

		$scope.ProfileButtonClick = function() {
			pageService.NavigateToPage('/');
		};
	};
	$scope.ClearSignatureButtonClick = function() {
		signaturePad.clear();
	};
}]);