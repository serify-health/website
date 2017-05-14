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
	$rootScope.authentication = {};
	$rootScope.closeAlert = function(){ $rootScope.alert = null; };
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
	$scope.finishedLoading = false;
	// Check current location
	$scope.isActive = function(viewLocation) {
		return viewLocation === pageService.GetCurrentPage();
	};

	$scope.isPublicProfile = function() {
		return pageService.GetCurrentPage().includes('/view');
	};

	/******** SignInButton Block ********/
	$rootScope.authentication.IsAdmin = false;
	$rootScope.authentication.UserAuthenticated = false;
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
				$rootScope.$apply(function(){
					$rootScope.authentication.email = data['cognito:username'];
				});
			}
			catch (exception) {
				eventHandler.capture('CaptureUserIdentityFailure', {
					title: 'Failure to register user identity',
					userData: authData,
					exception: exception.toString(),
					stack: exception.stack,
					details: exception
				});
			}
			$rootScope.$apply(function(){
				$rootScope.authentication.UserAuthenticated = true;
			});
		})
		.then(function(){
			return userManager.GetUserDataPromise()
			.then(function(user){
				$rootScope.$apply(function(){
					$rootScope.authentication.IsAdmin = user.admin;
					$rootScope.authentication.username = (user.userData || {}).username;
				});
			});
		})
		.then(function(){
			$rootScope.$apply(function(){
				$rootScope.authentication.complete = true;
			});
		})
		.catch(function(f){ console.log(f); })
		.then(function() {
			$scope.$apply(function() {
				$scope.finishedLoading = true;
			});
		});
	}

	$scope.ShowFeedBackFormClick = function () {
		eventHandler.interaction('Feedback', 'ShowForm');
		var modalInstance = $uibModal.open({
			templateUrl: 'feedback/feedbackForm.html',
			controller: 'feedbackController',
			resolve: {
				form: function() {
					return {
						userAuthenticated: $rootScope.authentication.UserAuthenticated,
						username: $rootScope.authentication.username,
						email: $rootScope.authentication.email
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
	$rootScope.SignInButtonClick = function() {
		if($rootScope.authentication.UserAuthenticated) {
			eventHandler.interaction('Profile', 'Logout');
			logoutService.Logout()
			.catch(function(failure) {
				console.log(failure);
				$rootScope.$apply(function(){
					$rootScope.alert = { type: 'danger', msg: 'Failed to log out.' };
				});
			});
			return;
		}
		eventHandler.interaction('Profile', 'Login');
		ngDialog.open({
			closeByNavigation: true,
			width: 320,
			template: 'login/signup.html',
			controller: 'signinController',
			className: 'ngdialog-theme-default'
		}).closePromise.then(function() {
			return SetupUser();
		});
	};

	SetupUser();

	/******** SignInButton Block ********/
	
	$scope.AdminButtonClick = function() {
		eventHandler.interaction('Navigation', 'Admin');
		pageService.NavigateToPage('admin');
	};
	$scope.ProfileButtonClick = function() {
		eventHandler.interaction('Navigation', 'Profile');
		pageService.NavigateToPage('/');
	};
	$scope.PublicProfileButtonClick = function() {
		var usernameLinkCreationPromise = linkManager.GetNewLinkPromise(null, null)
		.then(function(link){
			pageService.NavigateToPage('view/' + link);
		});
	};
	$scope.PrivacyButtonClick = function() {
		eventHandler.interaction('Navigation', 'Policy');
		pageService.NavigateToPage('policy');
	};
	$scope.TermsOfServiceButtonClick = function() {
		eventHandler.interaction('Navigation', 'Terms');
		pageService.NavigateToPage('terms');
	};
	$scope.copyRightDate = new Date().getFullYear();
}]);

var mainApp = document.getElementsByTagName('body');
angular.element(mainApp).ready(function() {
	angular.bootstrap(mainApp, [SERIFYAPP], { strictDi: true });
});
FastClick.attach(document.body);