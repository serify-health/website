angular.module(GOLFPRO).config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/', { templateUrl: 'login/login.html', controller: 'loginController' });
}]);
angular.module(GOLFPRO).controller('loginController', [
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
	function SetupUser() {
		return loginStatusProvider.validateAuthenticationPromise()
		.then(function() {
			$scope.UserAuthenticated = true;
			return userManager.GetUserIdPromise().then(function(id){
				$scope.$apply(function(){
					$scope.UserId = id; 
				});
			});
		})
		.then(function(){
			return userManager.GetUserDataPromise();
		})
		.then(function(userData){
			$scope.$apply(function(){
				$scope.verifications = (userData || {}).Verifications || [];
				if($scope.verifications.length === 0) { $scope.AddRowButtonClick(); }
			});
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
			console.log(JSON.stringify(dialogResult, null, 2));
			// var isarray = Object.prototype.toString.call(dialogResult.value) === '[object Array]';
			// if(!isarray || !dialogResult.value || dialogResult.value.length < 1) { return; }
			//if(dialogResult.value) {
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
	$scope.SubmitVerificationsButtonClick = function() {
		if(!$scope.UserAuthenticated) {
			guiManager.toast('Create account to get your test results verified.');
			return;
		}
		userManager.SetVerifications($scope.verifications)
		.then(function(){
			guiManager.toast('Verifications Submitted.', 1000, 'center');
		}, function(failure){
			console.error(failure);
			guiManager.toast('Failed to submit verifications.', 1000, 'center');
		});
	};
	$scope.GetUserLinkClick = function() {
		var linkname = $scope.linkname;
		var username = $scope.username;
		if(username == null) {
			guiManager.toast('username is not specified.', null, null);
			return;
		}
		if(linkname == null) {
			guiManager.toast('Link name is not specified.', null, null);
			return;
		}
		linkManager.GetNewLinkPromise(linkname, username)
		.then(function(linkResults){
			$scope.$apply(function(){
				console.log('New link for user generated: ' + $scope.UserId);
				var linkInfo = '' + linkname + ':' + username;
				$scope.userLink = 'http://health-verify-service.s3-website-us-east-1.amazonaws.com/v1/index.html#/view/' + linkResults; 
			});
		});
	};
}]);