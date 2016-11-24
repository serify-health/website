angular.module(GOLFPRO).provider('loginStatusProvider', [function() {
	var GOOGLEPLUS_AUTH_INFO = {
		//scopes: 'profile email',
		//webClientId: '942710094206-sjnk1ita1794lv0pqebt02u2r18lq5k8.apps.googleusercontent.com'
		//offline: true, // optional, but requires the webClientId - if set to true the plugin will also return a serverAuthCode, which can be used to grant offline access to a non-Google server
	};
	AWS.config.region = AWS_REGION;
	AWSCognito.config.region = AWS_REGION;
	var waitForInit = function(iteration) {
		iteration = iteration || 0;
		return new Promise(function(s, f){ facebookConnectPlugin.getLoginStatus(s, f); })
		.catch(function(failure) {
			console.log('Waiting for Facebook Init. Iteration: ' + iteration + ': ' + failure);
			if(iteration < 20) { return new Promise(function(s, f) { setTimeout(function() { s(); }, 50); }).then(function() { return waitForInit(iteration + 1); }); }
			else { return Promise.reject({Error: 'Failed to init facebook.', Detail: failure}); }
		});
	};

	var attemptFacebookLoginPromise = function() {
		return waitForInit().then(function() {
			return new Promise(function(s, f){ facebookConnectPlugin.getLoginStatus(s, f); })
			.then(function(authentication) {
				if(authentication.status !== 'connected') {
					return new Promise(function(s, f) {
						var scopes = ['email'];
						if(!window.cordova || window.cordova.platformId === 'browser') { scopes.push('rerequest'); }
						//Login when logged in automatically rerequests permissions: https://github.com/jeduan/cordova-plugin-facebook4/blob/master/src/android/ConnectPlugin.java#L718?at=180df7e6b0e7c9a887282ec33032a5ea431dbdf9
						facebookConnectPlugin.login(scopes, s, f);
					});
				}
				else {
					return Promise.resolve();
				}
			});
		}).then(function() { return validateAuthenticationPromise(); });
	};

	var attemptGoogleLoginPromise = function() {
		return new Promise(function(s, f){ window.plugins.googleplus.trySilentLogin(GOOGLEPLUS_AUTH_INFO, s, f); })
		.catch(function(errorCode) {
			console.log(JSON.stringify({
				Title: 'Google Silent Login Failure',
				ErrorCode: errorCode,
				Detail: [
					'https://developers.google.com/android/reference/com/google/android/gms/auth/api/signin/GoogleSignInStatusCodes',
					'https://developers.google.com/android/reference/com/google/android/gms/common/api/CommonStatusCodes'
				]
			}, null, 2));
			return new Promise(function(s, f) { window.plugins.googleplus.login(GOOGLEPLUS_AUTH_INFO, s, f); });
		}).then(function(authentication) {
			return validateAuthenticationPromise().then(function() { return authentication; });
		});
	};

	var signupPromise = function(username, password) {
		var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(POOL_DATA);
		var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser({ Username : username, Pool : userPool });
		var attributeEmail = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute({ Name : 'email', Value : username });
		var attributeList = [ attributeEmail ];
		return new Promise(function(s, f) {
			userPool.signUp(username, password, attributeList, null, function(error, result) { error ? f(error) : s(result); });
		});
	};

	var confirmUsernamePromise = function(pin, username, password) {
		var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(POOL_DATA);
		var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser({ Username : username, Pool : userPool });
		return new Promise(function(s, f) {
			cognitoUser.confirmRegistration(pin, true, function(error, result) {
				return error ? f(error) : s(result);
			});
		}).then(function(){
			console.log('Auth code success, logging in.');
			return usernameSigninPromise(username, password);
		}).then(function() { return validateAuthenticationPromise(); });
	};

	var resendAuthorizationCodePromise = function(username) {
		var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(POOL_DATA);
		var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser({ Username : username, Pool : userPool });
		return new Promise(function(s, f) {
			cognitoUser.resendConfirmationCode(function(error, result) {
				return error ? f(error) : s(result);
			});
		});
	};

	var startForgotPasswordPromise = function(username) {
		var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(POOL_DATA);
		var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser({ Username : username, Pool : userPool });
		return new Promise(function(s, f) {
			cognitoUser.forgotPassword({
				onSuccess: function() { s(); },
				onFailure: function(error) { f(error); }
			});
		});
	};

	var confirmNewPasswordPromise = function(pin, username, password) {
		var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(POOL_DATA);
		var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser({ Username : username, Pool : userPool });
		return new Promise(function(s, f) {
			cognitoUser.confirmPassword(pin, password, {
				onSuccess: function() { s(); },
				onFailure: function(error) { f(error); }
			});
		}).then(function(){
			console.log('Auth code success, logging in.');
			return usernameSigninPromise(username, password);
		}).then(function() { return validateAuthenticationPromise(); });
	};
	var usernameSigninPromise = function(username, password) {
		return new Promise(function(s, f) {
			var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(POOL_DATA);
			var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser({ Username: username, Pool: userPool });
			var authDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails({ Username: username, Password: password });

			cognitoUser.authenticateUser(authDetails, {
				onSuccess: function(result) {
					normalizedAuth = {};
					normalizedAuth['cognito-idp.' + AWS.config.region + '.amazonaws.com/' + USER_POOL_ID] = result.getIdToken().getJwtToken();
					return s(normalizedAuth);
				},
				onFailure: function(error) {
					return f(error);
				}
			});
		});
	};

	var validateAuthenticationPromise = function() {
		var getCognitoUserPoolAuthenticationPromise = new Promise(function(s, f) {
			var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(POOL_DATA).getCurrentUser();
			if (cognitoUser === null) { return s(null); }

			cognitoUser.getSession(function(error, session) {
				if(error) {
					console.error(JSON.stringify({Title: 'Error on getSession', Error: error.stack || error.toString(), Detail: error}, null, 2));
				}
				if(error || !session.isValid()) { return s(null); }

				var jwt = session.getIdToken().getJwtToken();
				var normalizedAuth = { Login: {}, Type: 'Local', UserId: jwt };
				normalizedAuth.Login['cognito-idp.' + AWS.config.region + '.amazonaws.com/' + USER_POOL_ID] = jwt;
				return s(normalizedAuth);
			});
		});
		return Promise.all([getCognitoUserPoolAuthenticationPromise])
		.then(function(result){
			console.log('RESULT: ' + JSON.stringify(result, null, 2));
			var authentication = result.find(function(r) { return r !== null; });
			if(authentication == null) { return Promise.reject('Not authenticated with any provider, please login.'); } //jshint ignore:line
			if(AWS.config.credentials && !AWS.config.credentials.expired && AWS.config.credentials.expireTime > new Date()) {
				console.log('credentials not expired, reusing.');
				return authentication;
			}

			AWS.config.credentials = new AWS.CognitoIdentityCredentials({
				IdentityPoolId: IDENTITY_POOL_ID,
				Logins: authentication.Login
			});

			return new Promise(function(s, f) { AWS.config.credentials.get(function(error){ error ? f(error) : s(authentication); }); })
			.catch(function(error) {
				console.error(JSON.stringify({Title: 'Could not authenticate against Idendtity Pool or Trust for IAM Role using credentials',
					Error: error.stack || error.toString(), Detail: error}, null, 2));
				return Promise.reject({Error: 'AWS Credential Login issue.', Detail: error});
			});
		});
	};

	var logoutPromise = function() {
		return validateAuthenticationPromise()
		.then(function(auth){
			switch(auth.Type) {
				case 'Facebook':
					return new Promise(function(s, f) { facebookConnectPlugin.logout(s, f); });
				case 'Google':
					return new Promise(function(s, f) { window.plugins.googleplus.logout(s, f); });
				case 'Local':
					return new Promise(function(s, f) { return s(new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(POOL_DATA).getCurrentUser().signOut()); });
				default:
					return Promise.reject('Not Logged In.');
			}
		})
		.then(function(success) {
			console.log(success);
			if(AWS.config.credentials) {
				console.log('Clearing the AWS Cached Id.');
				AWS.config.credentials.clearCachedId();
			}
		});
	};
	var service = {
		signupPromise: signupPromise,
		usernameSigninPromise: usernameSigninPromise,
		confirmUsernamePromise: confirmUsernamePromise,
		resendAuthorizationCodePromise: resendAuthorizationCodePromise,
		startForgotPasswordPromise: startForgotPasswordPromise,
		confirmNewPasswordPromise: confirmNewPasswordPromise,
		validateAuthenticationPromise: validateAuthenticationPromise,
		logoutPromise: logoutPromise
	};
	this.$get = function() { return service; };
}]);