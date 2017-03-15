var isMobile = false;

var module = angular.module(SERIFYAPP, ['ngRoute', 'ngAnimate', 'ngTouch', 'ngSanitize', 'ngDialog', 'ui.bootstrap']);
module.provider('utilities', [function() {
	var service = {
		getGuid: function() {
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random()*16|0;
				var v = c === 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
			});
		}
	};
	this.$get = function() { return service; };
}]);
module.config(['$animateProvider', '$routeProvider', function($animateProvider, $routeProvider) {
	!$animateProvider.classNameFilter(/^(?!do-not-animate).*$/);
	$routeProvider.otherwise({
		templateUrl: 'notFound.html',
		controller: ['eventHandler', function(eventHandler) {
			eventHandler.capture('404', {
				url: window.document.location.href
			});
		}]
	});
}]);
module.factory('$exceptionHandler', ['$log', 'eventHandler', function($log, eventHandler) {
	return function (exception, cause) {
		eventHandler.capture('AngularError', {
			exception: exception.toString(),
			stack: exception.stack,
			cause: cause
		});
		$log.error(exception, cause);
	};
}]);
module.run(['$rootScope', '$window', '$location', '$animate', 'eventHandler', 'pageService', 'loginStatusProvider',
	function($rootScope, $window, $location, $animate, eventHandler, pageService, loginStatusProvider) {
	$rootScope.GoBackClick = pageService.GoBackPage;
	$window.handleOpenURL = pageService.OpenUrl;
	document.addEventListener("backbutton", function(e) { pageService.GoBackPage(); }, false);
	document.addEventListener("resume", function(e){
		loginStatusProvider.validateAuthenticationPromise()
		.catch(function(failure){
			console.log(JSON.stringify({Title: 'Failed to automatically login on resume', Error: failure.stack || failure.toString(), Detail: failure}));
		});
	}, false);

	//Force loading of the error service one time.
	$window.ErrorHandlerList.push(function(error, func, line){
		eventHandler.capture('UnhandledUiError', {
			error: error.toString(),
			function: func.toString() + ':' + line.toString(),
			detail: JSON.stringify(func) + ' - ' + JSON.stringify(line)
		});
	});

	console.log('AWS Error Handler enabled');

	$rootScope.$on('$locationChangeStart', function(event) {
		if(!isMobile && pageService.AllowNavigateBackPage($location.path())) {
			event.preventDefault();
			pageService.GoBackPage();
		}
	});

	$rootScope.$on('$locationChangeSuccess', function() {
		pageService.SetCurrentPage($location.path());
	});

	$animate.enabled(true);
}]);

// This directive allows us to pass a function in on an enter key to do what we want.
module.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });
                event.preventDefault();
            }
        });
    };
});

angular.module(SERIFYAPP).controller('navController', [
	'$scope',
	'$rootScope',
	'$routeParams',
	'$location',
	'$uibModal',
	'loginStatusProvider',
	'eventHandler',
	'pageService',
	'userManager',
	'ngDialog',
	'utilities',
	'linkManager',
	'logoutService',
function($scope, $rootScope, $routeParams, $location, $uibModal, loginStatusProvider, eventHandler, pageService, userManager, ngDialog, utilities, linkManager, logoutService) {
	$scope.closeAlert = function(){ $scope.alert = null; };

	// Check current location
	$scope.isActive = function(viewLocation) {
    	return viewLocation === $location.path();
	};

	/******** SignInButton Block ********/
	$scope.IsAdmin = false;
	$rootScope.IsAdmin = false;
	$scope.UserAuthenticated = false;
	$rootScope.UserAuthenticated = false;
	$scope.links = [];
	function SetupUser() {
		return loginStatusProvider.validateAuthenticationPromise()
		.then(function(authData) {
			try {
				var data = JSON.parse(atob(authData.UserId.split('.')[1]));
				userManager.CaptureUserIdentity({
					cognitoSub: data.sub,
					email: data['cognito:username']
				});
				$rootScope.email = data['cognito:username'];
			}
			catch (exception) {}
			$rootScope.UserAuthenticated = true;
			return userManager.GetUserIdPromise().then(function(id){
				$rootScope.$apply(function(){
					$rootScope.UserId = id;
				});
			});
		})
		.then(function(){
			var usernamemetadataPromise = userManager.GetUserDataPromise()
			.then(function(user){
				$rootScope.$apply(function(){
					$rootScope.IsAdmin = user.admin;
					$rootScope.userProfile = (user.userData || {}).profile;
					$rootScope.username = (user.userData || {}).username;
					var verifications = (user || {}).Verifications || [];
					verifications.map(function(verification) {
						verification.Inverse = verification.Name !== 'HPV' && verification.Name !== 'PrEP';
						verification.Name = TESTS.find(function(t){ return t.id === verification.Name; }).name;
					});
					$rootScope.verifications = verifications;
				});
			});
			var usernameLinkCreationPromise = linkManager.GetNewLinkPromise(null, null)
			.then(function(link){
				$rootScope.$apply(function(){
					$rootScope.userLink = {
						url: WEBSITE_VIEW_URL + link,
						link: link
					};
				});
			});
			return Promise.all([usernamemetadataPromise, usernameLinkCreationPromise]);
		}).catch(function(f){ console.log(f); });
	}

	$scope.ShowFeedBackFormClick = function () {
		var modalInstance = $uibModal.open({
			templateUrl: 'login/feedbackForm.html',
			controller: ['$scope', '$uibModalInstance', 'loginStatusProvider', 'feedbackManager', function($scope, $uibModalInstance, loginStatusProvider, feedbackManager) {
				$scope.form = $scope.$resolve.form;
				$scope.closeAlert = function(){ $scope.alert = null; };
				$scope.alert = null;
				$scope.SubmitFeedbackForm = function () {
					loginStatusProvider.validateUnauthenticationPromise()
					.then(function() {
						feedbackManager.CreateFeedback($scope.form)
						.then(function() {
							$scope.$apply(function() {
								$scope.alert = { type: 'success', msg: 'Feedback Submitted!'};
							});
							setTimeout(function() {
								$scope.$apply(function() { $uibModalInstance.close('closed'); });
							}, 1000);
						}, function() {
							$scope.alert = { type: 'danger', msg: 'Failed to send feedback, please try again.'};
						});
					});
				};

				$scope.DismissFeedbackForm = function () {
					$uibModalInstance.dismiss('cancel');
				};
			}],
			resolve: {
				form: function() {
					return {
						userAuthenticated: $rootScope.UserAuthenticated,
						username: $scope.username,
						email: $scope.email
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
	$scope.SignInButtonClick = function() {
		if($rootScope.UserAuthenticated) {
			logoutService.Logout()
			.catch(function(failure) {
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
	
	$scope.AdminButtonClick = function() {
		pageService.NavigateToPage('admin');
	};
	$scope.ProfileButtonClick = function() {
		pageService.NavigateToPage('/');
	};
	$scope.PublicProfileButtonClick = function() {
		pageService.NavigateToPage('view/'+$scope.userLink.link);
	};
	$scope.PrivacyButtonClick = function() {
		pageService.NavigateToPage('policy');
	};
}]);

var mainApp = document.getElementsByTagName('body');
angular.element(mainApp).ready(function() {
	angular.bootstrap(mainApp, [SERIFYAPP], { strictDi: true });
});
FastClick.attach(document.body);