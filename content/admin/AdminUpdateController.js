angular.module(SERIFYAPP).controller('adminUpdateController', [
    '$scope',
    '$uibModalInstance',
    'verificationManager',
function($scope, $uibModalInstance, verificationManager) {
    $scope.verificationRequest = $scope.$resolve.verificationRequest;
    $scope.closeAlert = function(){ $scope.alert = null; };
    $scope.alert = null;
    var updatedVerificationRequest = $scope.verificationRequest;
    $scope.UpdateVerificationButtonClick = function () {
        verificationManager.UpdateVerificationRequest(updatedVerificationRequest)
        .then(function() {
            $scope.$apply(function() {
                $scope.alert = { type: 'success', msg: 'Verification Updated!'};
            });
            setTimeout(function() {
                $scope.$apply(function() { $uibModalInstance.close('closed'); });
            }, 1000);
        })
        .catch(function(error) {
            $scope.$apply(function() {
                $scope.alert = { type: 'danger', msg: 'Failed to update verification.' };
            });
        });
    };

    $scope.DismissUpdateButtonClick = function () {
		$uibModalInstance.dismiss('cancel');
    };
}]);