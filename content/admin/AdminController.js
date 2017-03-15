angular.module(SERIFYAPP).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/admin', { templateUrl: 'admin/admin.html', controller: 'adminController' });
}]);
angular.module(SERIFYAPP).controller('adminController', [
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
	'userManager',
	'adminService',
	'feedbackManager',
function($scope, $routeParams, loginStatusProvider, eventHandler, pageService, verificationManager, ngDialog, utilities, linkManager, logoutService, userManager, adminService, feedbackManager) {
	$scope.closeAlert = function(){ $scope.alert = null; };
	$scope.verificationRequests = [];
	$scope.feedbackList = [];
	/******** SignInButton Block ********/
	$scope.links = [];
	$scope.$watch('authentication.complete', SetupUser, true);
	function SetupUser() {
		if(!$scope.authentication.IsAdmin) {
			pageService.NavigateToPage('/');
			return;
		}
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
		feedbackManager.GetFeedback()
		.then(function(data) {
			$scope.$apply(function() {
				$scope.feedbackList = data.feedbackList.map(function(item){
					return {
						timeString: new Date(item.time).toLocaleString(),
						time: new Date(item.time),
						body: item.information.feedbackBody,
						subject: item.information.feedbackSubject,
						email: item.information.email,
						username: item.information.username
					};
				});
			});
		});
	};

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