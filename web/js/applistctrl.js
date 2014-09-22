/**
 * Created by Derek on 2014/9/22.
 */

angular.module('AppList')
.constant('url', '/applist')
.controller('AppListCtrl', function($scope, $http, url) {
    $scope.appList = [];
    $scope.error = null;

    $http.get(url)
        .success(function(appList) {
            console.log(appList);
            $scope.appList = appList;
            $scope.error = null;
        })
        .error(function(error) {
            $scope.error = error;
        });

    $scope.getTotalCount = function() {
        return $scope.appList.length;
    };

    $scope.getMarketStatusCount = function(status) {
        return _.reduce($scope.appList, function(count, app) {
            if (app.marketStatus == status)
                return count+1;
            else
                return count;
        }, 0);
    };

    $scope.getExecCount = function(execId) {
        return _.reduce($scope.appList, function(count, app) {
            if (app.execId == execId)
                return count+1;
            else
                return count;
        }, 0);
    };
});
