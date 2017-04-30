angular.module(SERIFYAPP).controller('feedbackController', [
    '$scope',
    '$uibModalInstance',
    'loginStatusProvider',
    'feedbackManager',
    'eventHandler',
function($scope, $uibModalInstance, loginStatusProvider, feedbackManager, eventHandler) {
    $scope.form = $scope.$resolve.form;
    $scope.closeAlert = function(){ $scope.alert = null; };
    $scope.alert = null;
    $scope.SubmitFeedbackForm = function () {
        eventHandler.interaction('Feedback', 'CreatedFeedback');
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
        eventHandler.interaction('Feedback', 'CancelledFeedback');
        $uibModalInstance.dismiss('cancel');
    };
}]);