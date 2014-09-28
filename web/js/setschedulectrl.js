/**
 * Created by Derek on 2014/9/28.
 */

/*
    Controller: 'SetScheduleController'
    - handle set schedule dialogbox
 */

angular.module('AppList').controller('SetScheduleController', function($scope, $modalInstance, $log, times) {
    $scope.errmsg = null;
    $scope.startTime = times[0];
    $scope.endTime = times[1];

    $scope.ok = function() {
        if ($scope.checktime()) {
            $modalInstance.close([$scope.startTime, $scope.endTime]);
        }
    };

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };

    $scope.starttimechanged = function() {
        $scope.checktime();
    };

    $scope.endtimechanged = function() {
        $scope.checktime();
    };

    $scope.checktime = function() {
        if ($scope.startTime.getTime() >= $scope.endTime.getTime()) {
            $scope.errmsg = '開始執行時間不能小於結束執行時間!';
            return false;
        }
        else {
            $scope.errmsg = null;
            return true;
        }
    };
});
