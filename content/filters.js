angular.module(GOLFPRO).directive('awLimitLength', function () {
	return {
		restrict: "A",
		require: 'ngModel',
		link: function (scope, element, attrs, ngModel) {
			attrs.$set("ngTrim", "false");
			var limitLength = parseInt(attrs.awLimitLength);
			scope.$watch(attrs.ngModel, function(newValue) {
				var val = ngModel.$viewValue;
				if(val && val.length > limitLength) {
					ngModel.$setViewValue(val.substring(0, limitLength));
					ngModel.$render();
				}
			});
		}
	};
});