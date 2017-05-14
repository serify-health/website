angular.module(SERIFYAPP).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/update', { templateUrl: 'update/update.html', controller: 'updateController' });
}]);
angular.module(SERIFYAPP).controller('updateController', [
	'$scope',
	'$anchorScroll',
	'$routeParams',
	'loginStatusProvider',
	'pageService',
	'userManager',
	'utilities',
	'linkManager',
	'eventHandler',
function($scope, $anchorScroll, $routeParams, loginStatusProvider, pageService, userManager, utilities, linkManager, eventHandler) {
	/******** SignInButton Block ********/
	$scope.isLoading = true;
	$scope.closeAlert = function(){ $scope.alert = null; };
	$scope.links = [];
	$scope.tests = Object.keys(TESTS).map(function(key){
		return { id: key, name: TESTS[key].name };
	});
	var currentYear = new Date().getFullYear();
	$scope.verificationMonths = Array.apply(null, {length:12}).map(Number.call, Number).map(function(i) { return i + 1; });
	$scope.verificationYears = [0, 1, 2, 3, 4, 5].map(function(i) { return currentYear - i; });
	$scope.demographicsComplete = false;
	$scope.demographics = null;
	$scope.$watch('authentication.complete', SetupUser, true);
	function SetupUser() {
		if ($scope.authentication.UserAuthenticated) {
			userManager.GetUserDataPromise()
			.then(function(user){
				$scope.$apply(function(){
					$scope.demographics = (user.userData || {}).demographics || {};
					$scope.demographicsComplete = !!($scope.demographics && $scope.demographics.firstName && $scope.demographics.lastName && $scope.demographics.selectedDobDay && $scope.demographics.selectedDobMonth && $scope.demographics.selectedDobYear);
					$scope.isLoading = false;
				});
			});

			if ($scope.verifications.length === 0) {
				$scope.AddRowButtonClick();
			}
		}
	}

	/******** SignInButton Block ********/
	$scope.verifications = [];
	$scope.AddRowButtonClick = function() {
		eventHandler.interaction('Verifications', 'AddRow');
		$scope.verifications.push({
			Id: utilities.getGuid(),
			Name: '',
			Year: new Date().getFullYear(),
			Month: new Date().getMonth() + 1,
			Status: 'Unknown'
		});
	};
	$scope.RemoveVerification = function(verificationId) {
		eventHandler.interaction('Verifications', 'RemoveRow');
		$scope.verifications.splice($scope.verifications.findIndex(function(v){ return v.Id === verificationId; }), 1);
	};

	var canvas = document.querySelector("canvas");
	var signaturePad = new SignaturePad(canvas);

	$scope.SubmitVerificationsButtonClick = function() {
		$scope.alert = null;
		eventHandler.interaction('Verifications', 'SubmitAttempt');
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
		if(!$scope.authentication.UserAuthenticated) {
			$scope.alert = { type: 'danger', msg: 'Create account to get your test results verified.' };
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
			dob: moment($scope.demographics.selectedDobYear + '-' + $scope.demographics.selectedDobMonth + '-' + $scope.demographics.selectedDobDay, 'YYYY-MM-DD').format(),
			name: '[' + $scope.demographics.firstName + '],[' + ($scope.demographics.middleName || '') + '],[' + $scope.demographics.lastName + ']',
			clinicInfo: $scope.clinicInfo,
			clinicName: $scope.clinicName,
			signature: signaturePad.toDataURL()
		};
		var hasVerification = {};
		var verifications = $scope.verifications.filter(function(v){ return v.Name; }).map(function(v) {
			if (hasVerification[v.Name]) {
				$scope.alert = { type: 'danger', msg: '' + v.Name + ' has been listed more than once.' };
				return;
			}

			hasVerification[v.Name] = true;
			return {
				Date: v.Month + '/' + v.Year,
				Name: v.Name,
				Id: v.Id,
				Status: v.Status
			};
		});

		if ($scope.alert) {
			$anchorScroll();
			return;
		}

		eventHandler.interaction('Verifications', 'Submitted');
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
	$scope.ClearSignatureButtonClick = function() {
		eventHandler.interaction('Verifications', 'ClearedSignature');
		signaturePad.clear();
	};

	$scope.CancelButtonClick = function() {
		eventHandler.interaction('Navigation', 'CancelUpdatingMedicalRelease');
		pageService.NavigateToPage('/');
	};

	$scope.NavigateToEditProfileButtonClick = function() {
		eventHandler.interaction('Navigation', 'UpdateMedicalRelease');
		pageService.NavigateToPage('edit');
	};
}]);