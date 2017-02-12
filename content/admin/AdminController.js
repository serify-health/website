angular.module(GOLFPRO).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/admin', { templateUrl: 'admin/admin.html', controller: 'adminController' });
}]);
angular.module(GOLFPRO).controller('adminController', [
	'$scope',
	'$routeParams',
	'loginStatusProvider',
	'eventHandler',
	'pageService',
	'verificationManager',
	'ngDialog',
	'utilities',
	'linkManager',
	'logoutService',
	'adminService',
function($scope, $routeParams, loginStatusProvider, eventHandler, pageService, verificationManager, ngDialog, utilities, linkManager, logoutService, adminService) {
	$scope.closeAlert = function(){ $scope.alert = null; };
	$scope.verificationRequests = [];
	/******** SignInButton Block ********/
	$scope.UserAuthenticated = false;
	$scope.links = [];
	function SetupUser() {
		return loginStatusProvider.validateAuthenticationPromise()
		.then(function(auth) {
			console.log((auth || {}).UserId);
			$scope.$apply(function() {
				$scope.UserAuthenticated = true;
			});
			adminService.GetCountsPromise().then(function(summary){
				$scope.$apply(function(){
					$scope.userCount = summary.userCount;
					$scope.requestCount = summary.requestCount;
				});
			}, function(){
				$scope.userCount = '?';
				$scope.requestCount = '?';
			});
			verificationManager.GetVerifications()
			.then(function(verificationRequests) {
				$scope.$apply(function() {
					$scope.verificationRequests = verificationRequests.map(function(r){
						return {
							status: r.Status,
							userId: r.UserId,
							time: r.Time,
							name: (r.Info || r.info).user.name,
							email: (r.userIdentity || {}).email,
							dob: (r.Info || r.info).user.dob,
							clinic: (r.Info || r.info).user.clinicName,
							address: (r.Info || r.info).user.clinicInfo,
							signature: (r.Info || r.info).user.signature,
							verifications: (r.Info || r.info).verifications.map(function(v){
								return {
									name: v.Name,
									date: v.Date,
									id: v.Id,
									status: v.Status,
									checked: false
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
		}).closePromise.then(function(){
			return SetupUser();
		});
	});

	/******** SignInButton Block ********/

	$scope.VerificationRequestApproveClick = function(verificationRequest) {
		var verifications = verificationRequest.verifications.filter(function(v) { return v.checked; }).map(function(v){
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
				foundVerificationRequest.status = verificationRequest.verifications.some(function(v){ return v.status.match(/unknown/i) && !v.checked; }) ? 'NEW' : 'DONE';
				foundVerificationRequest.verifications.filter(function(v) { return v.checked; }).map(function(v){
					v.status = 'Verified';
					v.checked = false;
				});
			});
		})
		.catch(function(error) {
			$scope.$apply(function(){
				$scope.alert = { type: 'danger', msg: 'Failed to approve verification.' };
			});
		});
	};
	$scope.VerificationRequestRejectClick = function(verificationRequest) {
		var verifications = verificationRequest.verifications.filter(function(v) { return v.checked; }).map(function(v){
			return {
				Id: v.id
			};
		});
		verificationManager.RejectVerifications(verifications, verificationRequest.userId, verificationRequest.time)
		.then(function() {
			$scope.$apply(function() {
				var foundVerificationRequest = $scope.verificationRequests.find(function(r) {
					return r.userId === verificationRequest.userId && r.time === verificationRequest.time;
				});
				foundVerificationRequest.status = verificationRequest.verifications.some(function(v){ return v.status.match(/unknown/i) && !v.checked; }) ? 'NEW' : 'DONE';
				foundVerificationRequest.verifications.filter(function(v) { return v.checked; }).map(function(v){
					v.status = 'Rejected';
					v.checked = false;
				});
			});
		})
		.catch(function(error) {
			$scope.$apply(function(){
				$scope.alert = { type: 'danger', msg: 'Failed to reject verification.' };
			});
		});
	};
	$scope.ProfileButtonClick = function() {
		pageService.NavigateToPage('/');
	};
}]);