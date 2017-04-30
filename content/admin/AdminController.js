angular.module(SERIFYAPP).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/admin', { templateUrl: 'admin/admin.html', controller: 'adminController' });
}]);
angular.module(SERIFYAPP).controller('adminController', [
	'$scope',
	'$route',
	'$routeParams',
	'$uibModal',
	'pageService',
	'verificationManager',
	'adminService',
	'feedbackManager',
	'userManager',
	'eventHandler',
function($scope, $route, $routeParams, $uibModal, pageService, verificationManager, adminService, feedbackManager, userManager, eventHandler) {
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
				$scope.verificationRequests = verificationRequests.reduce(function(list, r) {
					return list.concat((r.Info || r.info).verifications.map(function(v) {
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
							verification: {
								name: TESTS[v.Name].name,
								date: v.Date,
								id: v.Id,
								status: v.Status
							}
						};
					}));
				}, []).filter(function(r) { return r.verification.status === 'Unknown'; });
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
	}

	/******** SignInButton Block ********/

	$scope.VerificationRequestApproveClick = function(verificationRequest) {
		eventHandler.interaction('Admin', 'ApproveVerification');
		var verifications = [ {Id: verificationRequest.verification.id} ];
		verificationManager.ApproveVerifications(verifications, verificationRequest.userId, verificationRequest.time)
		.then(function() {
			$scope.$apply(function() {
				verificationRequest.status = 'DONE';
			});
		})
		.catch(function(error) {
			$scope.$apply(function(){
				$scope.alert = { type: 'danger', msg: 'Failed to approve verification.' };
			});
		});
	};
	$scope.VerificationRequestEditClick = function(verificationRequest) {
		eventHandler.interaction('Admin', 'EditVerification');
		var modalInstance = $uibModal.open({
			templateUrl: 'admin/updateForm.html',
			controller: 'adminUpdateController',
			resolve: {
				verificationRequest: function() {
					return verificationRequest;
				}
			}
		});

		modalInstance.result.then(function (updatedVerificationRequest) { console.log('completed', updatedVerificationRequest); }, function() { console.log('Modal dismissed at: ' + new Date()); })
		.then(function() { $route.reload(); });
	};
	$scope.VerificationRequestRejectClick = function(verificationRequest) {
		eventHandler.interaction('Admin', 'RejectVerification');
		var verifications = [ {Id: verificationRequest.verification.id} ];
		verificationManager.RejectVerifications(verifications, verificationRequest.userId, verificationRequest.time)
		.then(function() {
			$scope.$apply(function() {
				verificationRequest.status = 'DONE';
			});
		})
		.catch(function(error) {
			$scope.$apply(function(){
				$scope.alert = { type: 'danger', msg: 'Failed to reject verification.' };
			});
		});
	};
	$scope.VerificationRequestPositiveClick = function(verificationRequest) {
		$scope.alert = { type: 'danger', msg: 'The "Set Positive" Button has not been enabled yet. If this is required please contact the development team.' };
	};
	$scope.ProfileButtonClick = function() {
		pageService.NavigateToPage('/');
	};
	$scope.lookupEmailAddress = null;
	$scope.JumpToUserProfileButtonClick = function() {
		eventHandler.interaction('Admin', 'JumpToProfile');
		if ($scope.lookupEmailAddress === null) {
			$scope.alert = { type: 'danger', msg: 'Plesae enter email address.' };
			return;
		}
		userManager.GetUserAllInformation($scope.lookupEmailAddress).then(function(userData) {
			pageService.NavigateToPage('view/' + userData.linkInfo);
		}).catch(function(error) {
			$scope.$apply(function(){
				$scope.alert = { type: 'danger', msg: 'Failed to get page for ' + $scope.lookupEmailAddress + ':' + JSON.stringify(error, null, 2) };
			});
		});
	};
}]);