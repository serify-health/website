angular.module(GOLFPRO).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/admin', { templateUrl: 'admin/admin.html', controller: 'adminController' });
}]);
angular.module(GOLFPRO).controller('adminController', [
	'$scope',
	'$routeParams',
	'loginStatusProvider',
	'guiManager',
	'eventHandler',
	'pageService',
	'userManager',
	'verificationManager',
	'ngDialog',
	'utilities',
	'linkManager',
	'logoutService',
function($scope, $routeParams, loginStatusProvider, guiManager, eventHandler, pageService, userManager, verificationManager, ngDialog, utilities, linkManager, logoutService) {
	$scope.verificationRequests = [];
	/******** SignInButton Block ********/
	$scope.UserAuthenticated = false;
	$scope.links = [];
	function SetupUser() {
		return loginStatusProvider.validateAuthenticationPromise()
		.then(function() {
			$scope.$apply(function() {
				$scope.UserAuthenticated = true;
			});
			// adminManager.GetCounts().then
			$scope.userCount = '?';
			$scope.requestCount = '?'
			verificationManager.GetVerifications()
			.then(function(verificationRequests) {
				$scope.$apply(function() {
					$scope.verificationRequests = verificationRequests.map(function(r){
						return {
							status: r.Status,
							userId: r.UserId,
							time: r.Time,
							name: (r.Info || r.info).user.name,
							dob: (r.Info || r.info).user.dob,
							clinic: (r.Info || r.info).user.clinicName,
							address: (r.Info || r.info).user.clinicInfo,
							signature: (r.Info || r.info).user.signature,
							verifications: (r.Info || r.info).verifications.map(function(v){
								return {
									name: v.Name,
									date: v.Date,
									id: v.Id
								};
							})
						};
					});
				});
			});
		});
	}

	$scope.SignInButtonClick = function() {
		if($scope.UserAuthenticated) {
			logoutService.Logout();
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

	loginStatusProvider.validateAuthenticationPromise()
	.then(function() {
		return SetupUser();
	}, function(notLoggedIn){
		ngDialog.open({
			closeByNavigation: true,
			width: 320,
			template: 'login/signup.html',
			controller: 'signinController',
			className: 'ngdialog-theme-default'
		}).closePromise.then(function(dialogResult){
			return SetupUser();
		});
	});

	/******** SignInButton Block ********/

	$scope.VerificationRequestApproveClick = function(verificationRequest) {
		var verifications = verificationRequest.verifications.map(function(v){
			return {
				Id: v.id
			};
		});
		verificationManager.ApproveVerifications(verifications, verificationRequest.userId, verificationRequest.time)
		.then(function() {
			$scope.$apply(function() {
				var foundVerificationRequest = $scope.verificationRequests.find(function(r) {
					return r.userId === verificationRequest.userId && r.time === verificationRequest.time;
				});
				foundVerificationRequest.status = 'VERIFIED';
			});
		})
		.catch(function(error) {
			guiManager.toast('Failed to approve verification.', 1000, 'center');
		});
	};
	$scope.ProfileButtonClick = function() {
		pageService.NavigateToPage('/');
	};
}]);